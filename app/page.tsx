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

export default async function Home() {
  const all = await fetchUnifiedDeals();
  // 타임딜 = 11번가·지마켓·오늘의집(쿠팡 골드박스는 추천딜로 분리).
  const pool = all.filter((d) => d.platform === "11st" || d.platform === "gmarket" || d.platform === "ohou");
  // "AI 오늘의 픽" — 제휴완료 플랫폼만(지마켓·오늘의집). 11번가는 미제휴라 픽 제외(수수료 0).
  const picks: typeof pool = [];
  for (const p of ["gmarket", "ohou"] as const) {
    const top = pool
      .filter((d) => d.platform === p && !d.isSoldout && d.imageUrl)
      .sort((a, b) => (b.discountRate ?? 0) - (a.discountRate ?? 0))[0];
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
              ["gmarket", "지마켓 슈퍼딜"],
              ["11st", "11번가 타임딜"],
              ["ohou", "오늘의집 오늘의딜"],
              ["coupang", "쿠팡 골드박스"],
              ["ali", "알리 타임딜"],
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
