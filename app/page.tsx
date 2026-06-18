import Header from "@/components/Header";
import Banner from "@/components/Banner";
import DealGrid from "@/components/DealGrid";
import Footer from "@/components/Footer";
import { fetchUnifiedDeals, tierOf } from "@/lib/data/deals";
import { BADGE_META, type Deal, type Platform } from "@/lib/types";
import styles from "./page.module.css";

// 딜은 자주 바뀌고 신선도가 핵심 → 항상 최신 렌더(SSR). 검색엔진·JSON-LD는 그대로 노출.
export const dynamic = "force-dynamic";

const SITE = "https://todaydeals.co.kr";

// 1군: 플랫폼 MD 순서 신뢰 → 지마켓·쿠팡·11번가 2개씩 라운드로빈
function interleaveByPlatform(deals: Deal[], order: Platform[], chunk = 2): Deal[] {
  const groups = order.map((p) => deals.filter((d) => d.platform === p));
  const idx = groups.map(() => 0);
  const out: Deal[] = [];
  let more = true;
  while (more) {
    more = false;
    groups.forEach((g, gi) => {
      for (let k = 0; k < chunk && idx[gi] < g.length; k++) {
        out.push(g[idx[gi]++]);
        more = true;
      }
    });
  }
  const known = new Set(order);
  out.push(...deals.filter((d) => !known.has(d.platform))); // 그 외 플랫폼은 뒤에
  return out;
}

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
  const deals = await fetchUnifiedDeals();
  const tier1 = interleaveByPlatform(deals.filter((d) => tierOf(d) === 1), ["gmarket", "coupang", "11st"]);
  const tier2 = deals.filter((d) => tierOf(d) !== 1);

  const ld = {
    "@context": "https://schema.org",
    "@graph": [
      buildItemListLd([...tier1, ...tier2]),
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

        <div className={styles.sectionHead}>
          <h1 className={styles.title}>
            <i className={`ti ti-flame ${styles.icon}`} />
            지금 진행 중인 실시간 특가
          </h1>
          <p className={styles.sub}>지마켓·쿠팡·11번가 MD가 지금 이 순간 엄선한 타임딜·골드박스</p>
        </div>
        <DealGrid deals={tier1.length ? tier1 : tier2} />

        {tier1.length > 0 && tier2.length > 0 && (
          <>
            <div className={styles.sectionHead}>
              <h2 className={styles.title}>
                <i className={`ti ti-shopping-bag ${styles.icon}`} />
                더 둘러보는 오늘의 딜
              </h2>
              <p className={styles.sub}>마감 전에 챙기는 추가 특가 모음</p>
            </div>
            <DealGrid deals={tier2} />
          </>
        )}

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
