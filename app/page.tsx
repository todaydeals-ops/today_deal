import Link from "next/link";
import Header from "@/components/Header";
import Banner from "@/components/Banner";
import DealGrid from "@/components/DealGrid";
import LiveViewers from "@/components/LiveViewers";
import Footer from "@/components/Footer";
import { fetchUnifiedDeals } from "@/lib/data/deals";
import { verdictRank } from "@/components/PriceVerdict";
import PriceVerdictLegend from "@/components/PriceVerdictLegend";
import { BADGE_META, type Deal } from "@/lib/types";
import styles from "./page.module.css";

// 딜은 자주 바뀌고 신선도가 핵심 → 항상 최신 렌더(SSR). 검색엔진·JSON-LD는 그대로 노출.
export const dynamic = "force-dynamic";

const SITE = "https://www.todaydeals.co.kr";

// 자주 묻는 질문 (가시 노출 + FAQPage 스키마)
const FAQ = [
  {
    q: "오늘의딜은 어떤 사이트인가요?",
    a: "지마켓 오픈런 타임딜, 11번가 쇼킹딜·타임딜, 쿠팡 골드박스 등 여러 쇼핑몰의 실시간 특가를 한곳에 모아 할인율과 마감시간으로 비교해 보여주는 딜 큐레이션 사이트입니다.",
  },
  {
    q: "딜은 얼마나 자주 갱신되나요?",
    a: "타임딜은 약 2시간마다, 쿠팡 골드박스는 매일 오전 7시에 자동으로 최신 상품으로 갱신됩니다.",
  },
  {
    q: "어떤 쇼핑몰의 특가를 볼 수 있나요?",
    a: "현재 지마켓·11번가·쿠팡의 타임딜과 골드박스를 제공하며, 알리익스프레스 등으로 점차 확대됩니다.",
  },
  {
    q: "이용 요금이 있나요?",
    a: "무료로 이용할 수 있습니다. 일부 상품 링크는 제휴 마케팅 링크일 수 있으며, 거래는 각 쇼핑몰에서 이루어집니다.",
  },
];

// 구조화 데이터(JSON-LD) — 구글 리치결과 + AI 답변 인용(AEO/GEO).
function buildItemListLd(deals: Deal[]) {
  return {
    "@type": "ItemList",
    name: "오늘의 타임딜",
    description:
      "지마켓·쿠팡·11번가의 실시간 타임딜·골드박스를 한곳에 모았습니다. 매일 갱신.",
    numberOfItems: deals.length,
    itemListElement: deals.slice(0, 40).map((d, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "Product",
        name: d.productName,
        ...(d.imageUrl ? { image: d.imageUrl } : {}),
        ...(d.badge && BADGE_META[d.badge] ? { brand: { "@type": "Brand", name: BADGE_META[d.badge].label } } : {}),
        offers: {
          "@type": "Offer",
          price: d.salePrice,
          priceCurrency: "KRW",
          availability: d.isSoldout ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
          url: d.affiliateUrl ?? d.productUrl,
          ...(d.dealEndAt ? { priceValidUntil: d.dealEndAt.slice(0, 10) } : {}),
        },
      },
    })),
  };
}

// AI 오늘의 픽 클릭성 점수 — '지금 바로 살 만한' 것 우대(먹거리·일상소비재·유명브랜드),
// 가구·대형가전 같은 '지금 당장 불필요한 고관여' 상품은 감점. 할인율은 보조.
function pickScore(name: string, price: number, discount: number): number {
  let s = 0;
  // 먹거리(everyone) — 최우선
  if (/쌀|한우|삼겹|돼지고기|소고기|닭가슴|닭갈비|족발|곱창|생선|고등어|새우|오징어|장어|회\b|과일|사과|수박|복숭아|딸기|포도|멜론|체리|망고|토마토|옥수수|고구마|감자|채소|야채|나물|김치|반찬|만두|떡볶이|핫도그|피자|치킨|라면|국수|파스타|과자|쿠키|초콜릿|아이스크림|커피|음료|주스|생수|우유|두유|요거트|치즈|버터|햄|소시지|어묵|견과|간식|즉석밥|컵밥|시리얼|소스|양념|참기름|올리브유|꿀|잼|차류|만두/.test(name)) s += 50;
  // 일상 소비재(반복구매)
  if (/세제|샴푸|치약|칫솔|물티슈|화장지|휴지|키친타올|생리대|기저귀|섬유유연|주방세제|비누|바디워시|클렌징|선크림|마스크팩|로션|크림|틴트|쿠션|영양제|비타민|유산균|콜라겐|오메가|마그네슘|루테인|건강기능/.test(name)) s += 36;
  // 유명 브랜드
  if (/삼성|엘지|LG|애플|다이슨|필립스|나이키|아디다스|뉴발란스|퓨마|언더아머|크록스|CJ|농심|오뚜기|풀무원|동원|청정원|삼양|롯데|해태|빙그레|코카콜라|펩시|스타벅스|네스카페|맥심|켈로그|하림|비비고|종근당|GNC|일동|광동|유한|애경|아모레|메디힐|닥터지/.test(name)) s += 24;
  // 가구·대형가전·고관여(지금 당장 불필요) 감점
  if (/식탁|소파|쇼파|침대|매트리스|책상|옷장|장롱|서랍장|수납장|선반|행거|커튼|러그|조명|가구|냉장고|세탁기|건조기|에어컨|에어컨디셔너|티비|\bTV\b|모니터|의자|안마의자|러닝머신|골프|타이어/.test(name)) s -= 45;
  // 가격대 — 충동·일상 구매 우대, 고가 감점
  if (price <= 20000) s += 20; else if (price <= 50000) s += 8; else if (price > 150000) s -= 20;
  // 할인율 보조(동점 보정)
  s += Math.min(discount || 0, 80) * 0.2;
  return s;
}

export default async function Home() {
  const all = await fetchUnifiedDeals();
  // 타임딜 = 제휴완료(수익) 플랫폼 — 쿠팡(골드박스·ADBC)·지마켓·11번가·오늘의집.
  const pool = all.filter((d) => d.platform === "coupang" || d.platform === "gmarket" || d.platform === "11st" || d.platform === "ohou");
  // "AI 오늘의 픽" — 플랫폼별 '눌릴 만한'(먹거리·일상·브랜드) 1개를 상단 배치(클릭성 점수).
  // 쿠팡을 맨 앞에 두어 첫번째 AI 추천 카드로 노출.
  const picks: typeof pool = [];
  for (const p of ["coupang", "gmarket", "11st", "ohou"] as const) {
    const top = pool
      .filter((d) => d.platform === p && !d.isSoldout && d.imageUrl)
      .sort((a, b) => pickScore(b.productName, b.salePrice, b.discountRate) - pickScore(a.productName, a.salePrice, a.discountRate))[0];
    if (top) { top.pick = true; picks.push(top); }
  }
  const pickIds = new Set(picks.map((d) => d.id));
  // 나머지는 AI 추천순(강추→추천→비슷). 픽 3개를 맨 앞에.
  const rest = pool
    .filter((d) => !pickIds.has(d.id))
    .sort((a, b) => verdictRank(a.priceCompare, a.salePrice) - verdictRank(b.priceCompare, b.salePrice));
  const feed = [...picks, ...rest];

  const ld = {
    "@context": "https://schema.org",
    "@graph": [
      buildItemListLd(feed),
      {
        "@type": "FAQPage",
        mainEntity: FAQ.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />

      <Header />
      <main className="wrap">
        <Banner />

        <div style={{ margin: "14px 0 2px" }}>
          <LiveViewers />
        </div>

        <div className={styles.sectionHead}>
          <h1 className={styles.title}>
            <span aria-hidden style={{ marginRight: 4 }}>🤖</span>
            AI가 골라낸 오늘의 특가
          </h1>
          <p className={styles.sub}>네이버·쿠팡 최저가와 비교해 매긴 AI 진단으로 정렬했어요</p>
          <PriceVerdictLegend />
        </div>
        <DealGrid deals={feed} />
        <p style={{ fontSize: 11, color: "#9A958C", marginTop: 10, lineHeight: 1.5 }}>
          ※ AI 가격분석 추정치예요. 분석 시점·옵션·용량에 따라 실제 가격과 달라질 수 있어요.
        </p>

        <nav aria-label="쇼핑몰별 특가" style={{ margin: "44px 0 8px" }}>
          <h2
            style={{
              fontFamily: '"Pretendard", sans-serif',
              fontWeight: 800,
              fontSize: 18,
              letterSpacing: "-0.02em",
              color: "var(--text-strong)",
              marginBottom: 12,
            }}
          >
            쇼핑몰별 특가 모아보기
          </h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {[
              ["coupang", "쿠팡 골드박스"],
              ["gmarket", "지마켓 슈퍼딜"],
              ["11st", "11번가 타임딜"],
              ["ohou", "오늘의집 오늘의딜"],
            ].map(([k, label]) => (
              <Link
                key={k}
                href={`/deals/${k}`}
                style={{
                  padding: "9px 16px",
                  border: "1px solid var(--border-soft)",
                  borderRadius: 999,
                  fontSize: 13.5,
                  fontWeight: 600,
                  color: "var(--text-body)",
                  textDecoration: "none",
                  background: "var(--bg-surface)",
                }}
              >
                {label}
              </Link>
            ))}
          </div>
        </nav>

        <section className={styles.faq}>
          <h2 className={styles.faqTitle}>자주 묻는 질문</h2>
          <dl className={styles.faqList}>
            {FAQ.map((f) => (
              <div key={f.q} className={styles.faqItem}>
                <dt className={styles.faqQ}>{f.q}</dt>
                <dd className={styles.faqA}>{f.a}</dd>
              </div>
            ))}
          </dl>
        </section>
      </main>
      <Footer />
    </>
  );
}

export const metadata = {
  alternates: { canonical: SITE },
};
