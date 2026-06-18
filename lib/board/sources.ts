// 핫딜 RSS 멀티소스 수집 — 뽐뿌·루리웹. 정규식 파싱(외부 XML 의존성 없음).
// 제목 포맷: 뽐뿌 `[쇼핑몰] 상품명 (가격/배송)` · 루리웹 `[쇼핑몰] 상품명 / 가격`(+<category>)

export interface RawDeal {
  source: string; // "ppomppu" | "ruliweb"
  sourceId: string; // 글 번호
  slug: string; // `${source}-${sourceId}`
  boardType: string; // hot | overseas | coupon | free
  title: string; // 원문 제목(쇼핑몰/가격 제거된 깔끔본)
  rawTitle: string; // 원문 그대로
  shop?: string;
  price?: number;
  shipping?: string;
  category?: string; // 소스 제공(루리웹) 또는 분류기
  author?: string;
  body?: string;
  imageUrl?: string; // RSS 내 썸네일(루리웹 등)
  sourceUrl: string;
  createdAt?: string;
}

interface SourceDef {
  source: string;
  rss: string;
  boardType: string;
  idFrom: RegExp; // link에서 글번호 추출
}

const UA = "Mozilla/5.0 (compatible; TodaydealsBot/1.0; +https://www.todaydeals.co.kr)";

export const SOURCES: SourceDef[] = [
  { source: "ppomppu", rss: "https://www.ppomppu.co.kr/rss.php?id=ppomppu", boardType: "hot", idFrom: /no=(\d+)/ },
  { source: "ppomppu", rss: "https://www.ppomppu.co.kr/rss.php?id=ppomppu4", boardType: "overseas", idFrom: /no=(\d+)/ },
  { source: "ppomppu", rss: "https://www.ppomppu.co.kr/rss.php?id=coupon", boardType: "coupon", idFrom: /no=(\d+)/ },
  { source: "ruliweb", rss: "https://bbs.ruliweb.com/market/board/1020/rss", boardType: "hot", idFrom: /\/read\/(\d+)/ },
];

function decode(s: string): string {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;nbsp;|&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tag(block: string, name: string): string {
  const m = block.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`, "i"));
  return m ? decode(m[1]) : "";
}

// 제목에서 쇼핑몰 [..] / 가격(..) 분리
function parseTitle(raw: string): { title: string; shop?: string; price?: number; shipping?: string } {
  let t = raw;
  let shop: string | undefined;
  const sm = t.match(/^\s*\[([^\]]{1,20})\]\s*/);
  if (sm) {
    shop = sm[1].trim();
    t = t.slice(sm[0].length);
  }
  let price: number | undefined;
  let shipping: string | undefined;
  // 뽐뿌: 끝의 (가격/배송)
  const pm = t.match(/\(([^)]*)\)\s*$/);
  if (pm) {
    const inner = pm[1];
    t = t.slice(0, pm.index).trim();
    const priceM = inner.match(/([\d,]{2,})\s*원?/);
    if (priceM) price = Number(priceM[1].replace(/,/g, "")) || undefined;
    if (/무료|무배/.test(inner)) shipping = "무료";
    else {
      const shipM = inner.split("/")[1];
      if (shipM) shipping = shipM.trim().slice(0, 20) || undefined;
    }
  }
  // 루리웹: 끝의 / 가격  또는  / 무료
  if (price === undefined) {
    const rm = t.match(/\/\s*([\d,]{2,})\s*원?\s*$/);
    if (rm) {
      price = Number(rm[1].replace(/,/g, "")) || undefined;
      t = t.slice(0, rm.index).trim();
    }
  }
  if (shipping === undefined && /무료|무배/.test(raw)) shipping = "무료";
  // 끝에 남은 "/ 무료" 등 정리
  t = t.replace(/\s*[/|]\s*(무료|무배)\s*$/i, "").trim();
  return { title: t || raw, shop, price, shipping };
}

async function fetchSource(def: SourceDef): Promise<RawDeal[]> {
  try {
    const res = await fetch(def.rss, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(15000) });
    if (!res.ok) return [];
    const xml = await res.text();
    const items = xml.match(/<item>([\s\S]*?)<\/item>/g) ?? [];
    const out: RawDeal[] = [];
    for (const block of items) {
      const link = tag(block, "link");
      const rawTitle = tag(block, "title");
      if (!link || !rawTitle) continue;
      const idM = link.match(def.idFrom);
      if (!idM) continue;
      const sourceId = idM[1];
      const parsed = parseTitle(rawTitle);
      // RSS 본문에 박힌 썸네일(루리웹 등) — decode 전 원본에서 추출
      const imgM = block.match(/<img[^>]+src=["']([^"']+)["']/i);
      const imageUrl = imgM ? imgM[1].replace(/^http:/, "https:") : undefined;
      out.push({
        source: def.source,
        sourceId,
        slug: `${def.source}-${sourceId}`,
        boardType: def.boardType,
        title: parsed.title,
        rawTitle,
        shop: parsed.shop,
        price: parsed.price,
        shipping: parsed.shipping,
        category: tag(block, "category") || undefined,
        author: tag(block, "author") || undefined,
        body: tag(block, "description") || undefined,
        imageUrl,
        sourceUrl: link.replace(/^http:/, "https:"),
        createdAt: tag(block, "pubDate") || undefined,
      });
    }
    return out;
  } catch {
    return [];
  }
}

// 모든 소스 수집(병렬)
export async function collectAll(): Promise<RawDeal[]> {
  const lists = await Promise.all(SOURCES.map(fetchSource));
  return lists.flat();
}

// 커뮤니티 글(뽐뿌/루리웹 view)에서 "실제 딜"을 추출 — 우리는 글을 베끼는 게 아니라
// 그 안의 진짜 쇼핑몰 링크·이미지를 퍼와 우리 글로 가공한다. 신규 항목만 1회 호출.
const SHOP_RE =
  /https?:\/\/[a-z0-9.\-]*(lotteon|gmarket|11st|coupang|smartstore\.naver|brand\.naver|shopping\.naver|ssg|auction|tmon|interpark|aliexpress|amazon|wadiz|29cm|musinsa|oliveyoung|hmall|cjonstyle|gsshop|himart|ohou|kakao)[a-z0-9./?=&_%~\-]*/i;

export async function fetchDealMeta(url: string): Promise<{ dealUrl?: string; image?: string }> {
  try {
    const res = await fetch(url, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(10000) });
    if (!res.ok) return {};
    const html = Buffer.from(await res.arrayBuffer()).toString("latin1"); // EUC-KR 페이지 多, URL은 ASCII

    // 1) 실제 딜 링크: 뽐뿌 data-url 우선, 없으면 본문 내 쇼핑몰 도메인
    let dealUrl: string | undefined;
    const dm = html.match(/data-url\s*=\s*['"]\s*(https?:\/\/[^'"]+?)\s*['"]/i);
    if (dm && !/ppomppu|ruliweb/i.test(dm[1])) dealUrl = dm[1].trim();
    if (!dealUrl) {
      const sm = html.match(SHOP_RE);
      if (sm) dealUrl = sm[0];
    }

    // 2) 상품 이미지: og:image
    let image: string | undefined;
    const im = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i);
    if (im && /^https?:\/\//i.test(im[1])) image = im[1].replace(/^http:/, "https:");

    return { dealUrl, image };
  } catch {
    return {};
  }
}

// 교차 중복 제거용 정규화 키(쇼핑몰·숫자·기호 제거)
export function normalizeKey(title: string): string {
  return title
    .toLowerCase()
    .replace(/\[[^\]]*\]/g, "")
    .replace(/[^가-힣a-z0-9]/g, "")
    .slice(0, 24);
}
