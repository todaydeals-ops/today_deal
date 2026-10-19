// 가전 에러코드 사전 — AS연구소 에러코드 글을 브랜드·제품·코드로 모은 색인(생활백과).
//
// ★왜 색인이고 항목이 아닌가(2026-10-20): 주요 브랜드×제품 에러코드는 AS연구소 글이 이미 다룬다
//   (삼성·LG 세탁기·건조기·식기세척기·냉장고·에어컨, 경동나비엔·린나이 보일러 …). 같은 주제로 생활백과 항목을
//   또 만들면 같은 검색어를 두고 두 페이지가 순위를 깎는다. 그래서 여기는 "찾아보는 입구"로만 두고 본문은
//   AS 글로 보낸다 — 실제 검색 유입이 들어오는 AS 글로 내부 링크를 모으는 효과도 있다.
//   AS 글이 없는 조합(귀뚜라미·대성쎌틱·캐리어·로보락 등)만 생활백과 error-code 항목으로 쓴다.
import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header";
import MediaFooter from "@/components/MediaFooter";
import { fetchMagazineList } from "@/lib/data/magazine";
import { canonicalArticleUrl } from "@/lib/magazine/owner";
import { B4AS_CATEGORIES } from "@/lib/magazine/b4asCategories";
import { entriesByType, wikiUrl, WIKI_BASE } from "@/lib/wiki/load";
import ErrorCodeTable, { type CodeRow } from "./ErrorCodeTable";
import "../../magazine/magazine.css";
import "../wiki.css";

export const revalidate = 86400; // AS 글은 하루 1~2편 늘어난다

const URL_SELF = `${WIKI_BASE}/error-codes`;

export const metadata: Metadata = {
  title: "가전 에러코드 사전, 브랜드별 코드 뜻과 셀프 조치 찾기 | 오늘의딜 생활백과",
  description: "세탁기·건조기·식기세척기·냉장고·에어컨·보일러 화면에 뜬 에러코드를 브랜드와 코드로 찾아보세요. 코드마다 뜻과 기사님 부르기 전 해볼 것을 정리한 글로 이어 드립니다.",
  alternates: { canonical: URL_SELF },
  openGraph: { title: "가전 에러코드 사전", url: URL_SELF, type: "website", siteName: "오늘의딜 생활백과" },
};

// 브랜드 판별 — 제품 라인명은 브랜드로 접는다(트롬·휘센→LG, 비스포크·그랑데→삼성 …)
const BRANDS: [RegExp, string][] = [
  [/삼성|갤럭시|비스포크|그랑데|무풍/, "삼성"], [/LG|트롬|휘센|디오스|퓨리케어|코드제로|그램|스타일러/i, "LG"],
  [/경동|나비엔/, "경동나비엔"], [/린나이/, "린나이"], [/귀뚜라미/, "귀뚜라미"], [/대성|쎌틱/, "대성쎌틱"],
  [/쿠쿠/, "쿠쿠"], [/쿠첸/, "쿠첸"], [/코웨이/, "코웨이"], [/SK ?매직/i, "SK매직"], [/청호/, "청호나이스"],
  [/위니아|딤채/, "위니아"], [/다이슨/, "다이슨"], [/캐리어/, "캐리어"], [/로보락/, "로보락"], [/애플|아이폰|맥북|에어팟|아이패드/, "애플"],
  [/소니|PS5|플레이스테이션/i, "소니"], [/닌텐도/, "닌텐도"], [/필립스/, "필립스"], [/브라운/, "브라운"], [/샤오미/, "샤오미"],
  [/KT/, "KT"], [/SK브로드밴드/, "SK브로드밴드"], [/LG유플러스/, "LG유플러스"], [/오므론/, "오므론"],
];
// 제목에서 코드로 보면 안 되는 대문자·숫자 묶음
const NOT_CODE = new Set(["LG", "SK", "KT", "AS", "TV", "PC", "IT", "AI", "OS", "UV", "USB", "LED", "IPL", "OK", "PD", "HD", "ID", "PS5", "SSD", "HDMI", "QLED", "OLED", "BEST", "Wi", "Fi", "W", "L"]);
const CODE_RE = /(?<![A-Za-z0-9])([A-Za-z]{1,3}\d{1,3}[A-Za-z]?|\d{1,3}[A-Za-z]{1,2}|[A-Za-z][A-Z]|\d{2,3}(?=[·,\s]|$))(?![A-Za-z0-9])/g;
// "LG 코드제로"(청소기 이름)를 에러코드 글로 잡지 않게 — 10-20 첫 빌드에서 실제로 잡혔다
const IS_CODE_ARTICLE = /에러|오류 ?코드|(?<!LG )코드(?!제로)|표시창|점멸|램프/;
// 제품명은 "지우고 남은 것"이 아니라 알려진 제품 단어에서 찾는다(지우는 방식은 "스타일러 냄새 구김 셀프체크 물버림"이 됐다)
const PRODUCTS = ["김치냉장고", "김치플러스", "식기세척기", "로봇청소기", "무선청소기", "공기청정기", "전자레인지", "세탁기", "건조기", "냉장고", "에어컨", "보일러", "정수기", "스타일러", "밥솥", "인덕션", "오븐", "비데", "제습기", "가습기", "청소기", "모뎀", "인터넷"];
const LINES = ["트롬", "휘센", "디오스", "비스포크", "그랑데", "딤채", "퓨리케어", "무풍"];

function rowOf(a: { slug: string; title: string }, group: string): CodeRow | null {
  if (!IS_CODE_ARTICLE.test(a.title)) return null;
  // 코드는 제목 전체에서 — "총정리 · E03·4C·5C" 처럼 가운뎃점 뒤에 코드를 두는 제목이 있다
  const codes = [...new Set([...a.title.matchAll(CODE_RE)].map((m) => m[1]).filter((c) => !NOT_CODE.has(c) && !NOT_CODE.has(c.toUpperCase())))];
  const brand = BRANDS.find(([re]) => re.test(a.title))?.[1] ?? "공통";
  const product = PRODUCTS.find((p) => a.title.includes(p)) ?? "가전";
  const line = LINES.find((l) => a.title.includes(l));
  return { group, brand, product: line ? `${line} ${product}` : product, codes: codes.slice(0, 6), title: a.title, href: canonicalArticleUrl(a.slug) };
}

export default async function ErrorCodesPage() {
  const arts = await fetchMagazineList({ corner: "repair", limit: 500, light: true });
  const groupOf = new Map<string, string>();
  for (const c of B4AS_CATEGORIES) for (const s of c.slugs) groupOf.set(s, c.label);
  const groups = [...B4AS_CATEGORIES.map((c) => c.label), "기타"];

  const rows: CodeRow[] = [];
  for (const a of arts) {
    const r = rowOf(a, groupOf.get(a.slug) ?? "기타");
    if (r) rows.push(r);
  }
  // 생활백과 에러코드 항목(AS 글이 없는 조합)도 같은 표에 싣는다
  for (const e of entriesByType("error-code")) {
    rows.push({ group: "대형가전", brand: e.title.split(" ")[0], product: e.title.replace(/^\S+\s/, "").replace(/에러코드/, "").trim(), codes: (e.aliases.join(" ").match(CODE_RE) ?? []).slice(0, 6), title: e.seoTitle, href: wikiUrl(e.slug) });
  }
  rows.sort((x, y) => x.brand.localeCompare(y.brand, "ko") || x.product.localeCompare(y.product, "ko"));

  const ld = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        name: "가전 에러코드 사전",
        url: URL_SELF,
        inLanguage: "ko-KR",
        isPartOf: { "@type": "WebSite", name: "오늘의딜", url: "https://www.todaydeals.co.kr" },
        mainEntity: { "@type": "ItemList", numberOfItems: rows.length, itemListElement: rows.slice(0, 100).map((r, i) => ({ "@type": "ListItem", position: i + 1, name: `${r.brand} ${r.product} ${r.codes.join(" ")}`.trim(), url: r.href })) },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "생활백과", item: WIKI_BASE },
          { "@type": "ListItem", position: 2, name: "가전 에러코드 사전", item: URL_SELF },
        ],
      },
    ],
  };

  return (
    <>
      <Header />
      <div className="mz-page">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
        <div className="mz-wrap" style={{ paddingBottom: 90 }}>
          <section className="wk-hero">
            <div className="wk-kicker"><Link href="/wiki">생활백과</Link><span style={{ opacity: 0.5 }}>›</span><span className="wk-type">에러코드</span></div>
            <h1 style={{ marginTop: 14 }}>가전 에러코드 사전</h1>
            <p>
              화면에 뜬 코드를 그대로 넣어 보세요. 코드마다 뜻과 기사님 부르기 전에 해볼 것을 정리한 글로 이어 드립니다.
              지금 {rows.length}개 제품. 코드 표는 제조사 공식 안내 기준이고, 같은 코드라도 모델·연식에 따라 뜻이 다를 수 있으니 글 안의 범위를 함께 확인하세요.
            </p>
          </section>
          <ErrorCodeTable rows={rows} groups={groups} />
          <div className="wk-note" style={{ marginTop: 34 }}>
            가스 냄새가 나거나 일산화탄소 경보가 울리면 코드를 찾기 전에 보일러 사용을 멈추고, 창문을 열어 환기한 뒤 가스 밸브를 잠그고 가스 공급사나 제조사 서비스센터에 연락하세요. 타는 냄새·연기·누수가 함께 있으면 전원 플러그부터 뽑으세요.
          </div>
        </div>
      </div>
      <MediaFooter />
    </>
  );
}
