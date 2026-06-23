// 쿠팡 파트너스 Open API (서버 전용). HMAC 서명 + 상품 검색.
// 키(COUPANG_ACCESS_KEY/COUPANG_SECRET_KEY) 없으면 null 반환 → 호출부가 목으로 폴백.
import crypto from "crypto";

// ⛔ 쿠팡 파트너스 계정 정지(과도 호출)로 모든 쿠팡 API 호출 전면 차단.
//    재개 승인 후 false로 되돌리면 정상화. (소명/재가동 전까지 절대 호출 금지)
const COUPANG_DISABLED = true;

const DOMAIN = "https://api-gateway.coupang.com";
const SEARCH_PATH =
  "/v2/providers/affiliate_open_api/apis/openapi/v1/products/search";

export interface CoupangProduct {
  productId: string;
  title: string;
  imageUrl?: string;
  price: number;
  productUrl: string; // 제휴(트래킹) 링크
}

// datetime: yyMMdd'T'HHmmss'Z' (GMT)
function gmtDatetime(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return (
    `${p(d.getUTCFullYear() % 100)}${p(d.getUTCMonth() + 1)}${p(d.getUTCDate())}` +
    `T${p(d.getUTCHours())}${p(d.getUTCMinutes())}${p(d.getUTCSeconds())}Z`
  );
}

// 쿠팡 CEA HMAC 인증 헤더 생성. message = datetime + method + path + query (query는 '?' 제외)
function authorizationHeader(
  method: string,
  path: string,
  query: string,
  accessKey: string,
  secretKey: string
): string {
  const datetime = gmtDatetime();
  const message = datetime + method + path + query;
  const signature = crypto
    .createHmac("sha256", secretKey)
    .update(message)
    .digest("hex");
  return `CEA algorithm=HmacSHA256, access-key=${accessKey}, signed-date=${datetime}, signature=${signature}`;
}

// 실제 파트너스 API 검색. 키 없거나 실패 시 null.
export async function searchCoupang(
  keyword: string,
  limit = 10
): Promise<CoupangProduct[] | null> {
  if (COUPANG_DISABLED) return null;
  const accessKey = process.env.COUPANG_ACCESS_KEY;
  const secretKey = process.env.COUPANG_SECRET_KEY;
  if (!accessKey || !secretKey) return null;

  // 서명 query와 요청 query는 반드시 동일 문자열이어야 함
  const query = `keyword=${encodeURIComponent(keyword)}&limit=${limit}`;
  const authorization = authorizationHeader("GET", SEARCH_PATH, query, accessKey, secretKey);

  try {
    const res = await fetch(`${DOMAIN}${SEARCH_PATH}?${query}`, {
      method: "GET",
      headers: { Authorization: authorization, "Content-Type": "application/json" },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const json = await res.json();
    const items: unknown[] = json?.data?.productData ?? [];
    return items.map((it) => {
      const p = it as Record<string, unknown>;
      return {
        productId: String(p.productId ?? ""),
        title: String(p.productName ?? ""),
        imageUrl: (p.productImage as string) || undefined,
        price: Number(p.productPrice ?? 0),
        productUrl: String(p.productUrl ?? ""),
      } satisfies CoupangProduct;
    });
  } catch {
    return null;
  }
}

// 쿠팡 딥링크: 임의의 쿠팡 URL(검색/상품 페이지) → 제휴 트래킹 링크(lptag 포함).
const DEEPLINK_PATH = "/v2/providers/affiliate_open_api/apis/openapi/v1/deeplink";

export async function coupangDeeplink(targetUrl: string): Promise<string | null> {
  if (COUPANG_DISABLED) return null;
  const accessKey = process.env.COUPANG_ACCESS_KEY;
  const secretKey = process.env.COUPANG_SECRET_KEY;
  if (!accessKey || !secretKey || !targetUrl) return null;
  // POST는 query가 없으므로 서명 message = datetime + "POST" + path + ""
  const authorization = authorizationHeader("POST", DEEPLINK_PATH, "", accessKey, secretKey);
  try {
    const res = await fetch(`${DOMAIN}${DEEPLINK_PATH}`, {
      method: "POST",
      headers: { Authorization: authorization, "Content-Type": "application/json" },
      body: JSON.stringify({ coupangUrls: [targetUrl] }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const json = await res.json();
    const item = json?.data?.[0];
    return (item?.shortenUrl as string) || (item?.landingUrl as string) || null;
  } catch {
    return null;
  }
}

// 쿠팡 딥링크 일괄 변환: 여러 URL → 원본URL→제휴링크 맵. (딥링크 API는 coupangUrls 배열 지원)
export async function coupangDeeplinkBatch(
  urls: string[]
): Promise<Record<string, string>> {
  if (COUPANG_DISABLED) return {};
  const accessKey = process.env.COUPANG_ACCESS_KEY;
  const secretKey = process.env.COUPANG_SECRET_KEY;
  if (!accessKey || !secretKey || urls.length === 0) return {};
  const authorization = authorizationHeader("POST", DEEPLINK_PATH, "", accessKey, secretKey);
  try {
    const res = await fetch(`${DOMAIN}${DEEPLINK_PATH}`, {
      method: "POST",
      headers: { Authorization: authorization, "Content-Type": "application/json" },
      body: JSON.stringify({ coupangUrls: urls }),
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return {};
    const json = await res.json();
    const data: unknown[] = json?.data ?? [];
    const map: Record<string, string> = {};
    data.forEach((it, i) => {
      const p = it as Record<string, unknown>;
      const original = String(p.originalUrl ?? urls[i] ?? "");
      const link = (p.shortenUrl as string) || (p.landingUrl as string);
      if (original && link) map[original] = link;
    });
    return map;
  } catch {
    return {};
  }
}

// 쿠팡 상품 URL → 페이지 OG 메타에서 상품명·이미지·가격 best-effort 추출 (스크래핑).
// 쿠팡 봇 차단으로 실패할 수 있음 → 실패 시 빈 값(관리자가 직접 채움).
export interface CoupangUrlMeta {
  title?: string;
  imageUrl?: string;
  price?: number;
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(Number(d)));
}

export async function fetchCoupangProductMeta(url: string): Promise<CoupangUrlMeta> {
  if (COUPANG_DISABLED) return {};
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
        "Accept-Language": "ko-KR,ko;q=0.9",
      },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return {};
    const html = await res.text();
    const og = (prop: string): string | undefined => {
      const re = new RegExp(
        `<meta[^>]+property=["']og:${prop}["'][^>]+content=["']([^"']+)["']`,
        "i"
      );
      const m = html.match(re);
      return m?.[1] ? decodeEntities(m[1]) : undefined;
    };
    const title = og("title");
    const imageUrl = og("image");
    // 가격: JSON-LD/메타의 "price" 패턴 best-effort
    let price: number | undefined;
    const pm = html.match(/["']?price["']?\s*[:=]\s*["']?([\d,]+)/i);
    if (pm) {
      const n = Number(pm[1].replace(/,/g, ""));
      if (n > 0) price = n;
    }
    return { title, imageUrl, price };
  } catch {
    return {};
  }
}

// 쿠팡 골드박스 (매일 오전 7시 갱신). productUrl은 이미 제휴 트래킹 링크.
const GOLDBOX_PATH = "/v2/providers/affiliate_open_api/apis/openapi/v1/products/goldbox";

export interface GoldboxProduct {
  productId: string;
  productName: string;
  imageUrl?: string;
  price: number;
  productUrl: string; // 제휴 링크
}

export async function coupangGoldbox(): Promise<GoldboxProduct[] | null> {
  if (COUPANG_DISABLED) return null;
  const accessKey = process.env.COUPANG_ACCESS_KEY;
  const secretKey = process.env.COUPANG_SECRET_KEY;
  if (!accessKey || !secretKey) return null;
  const authorization = authorizationHeader("GET", GOLDBOX_PATH, "", accessKey, secretKey);
  try {
    const res = await fetch(`${DOMAIN}${GOLDBOX_PATH}`, {
      method: "GET",
      headers: { Authorization: authorization, "Content-Type": "application/json" },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const json = await res.json();
    const items: unknown[] = json?.data ?? [];
    return items.map((it) => {
      const p = it as Record<string, unknown>;
      return {
        productId: String(p.productId ?? ""),
        productName: String(p.productName ?? ""),
        imageUrl: (p.productImage as string) || undefined,
        price: Number(p.productPrice ?? 0),
        productUrl: String(p.productUrl ?? ""),
      } satisfies GoldboxProduct;
    });
  } catch {
    return null;
  }
}

// 키 없을 때 데모용 목 검색 결과
export function mockCoupangSearch(keyword: string): CoupangProduct[] {
  const base = [12900, 23900, 8900, 45900];
  return base.map((price, i) => ({
    productId: `mock-${i}`,
    title: `${keyword} 추천 상품 ${i + 1} (목 데이터)`,
    imageUrl: undefined,
    price,
    productUrl: `https://link.coupang.com/a/mock_${encodeURIComponent(keyword)}_${i}`,
  }));
}
