import Header from "@/components/Header";
import Banner from "@/components/Banner";
import DealGrid from "@/components/DealGrid";
import Footer from "@/components/Footer";
import { fetchUnifiedDeals } from "@/lib/data/deals";
import { BADGE_META, type Deal } from "@/lib/types";
import styles from "./page.module.css";

// DB 변경(크롤러·관리자)이 최대 60초 안에 반영되도록 (매일 갱신 = 신선도 신호)
export const revalidate = 60;

const SITE = "https://todaydeals.co.kr";

// 구조화 데이터(JSON-LD) — 구글 리치결과 + AI 답변 인용(AEO/GEO)의 핵심.
function buildItemListLd(deals: Deal[]) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "오늘의 타임딜",
    description:
      "지마켓·11번가·쿠팡·알리익스프레스의 타임딜·골드박스를 할인율 순으로 모았습니다. 매일 갱신.",
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
          availability: d.isSoldout
            ? "https://schema.org/OutOfStock"
            : "https://schema.org/InStock",
          url: d.affiliateUrl ?? d.productUrl,
          ...(d.dealEndAt ? { priceValidUntil: d.dealEndAt.slice(0, 10) } : {}),
        },
      },
    })),
  };
}

// 타임딜 메인 — 통합 피드(플랫폼 무관, 할인율 정렬, 출처 뱃지)
export default async function Home() {
  const deals = await fetchUnifiedDeals();
  const isTier1 = (d: Deal) => !!(d.badge && BADGE_META[d.badge]?.tier === 1);
  const tier1 = deals.filter(isTier1);
  const tier2 = deals.filter((d) => !isTier1(d));

  const ld = buildItemListLd(deals);

  return (
    <>
      {/* AEO/GEO: 구조화 데이터 */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }}
      />

      <Header />
      <main className="wrap">
        <Banner />

        <div className={styles.sectionHead}>
          <h1>지금 핫한 타임딜</h1>
          <span className={styles.sub}>실시간 · 할인율순</span>
        </div>
        <p className={styles.sectionDesc}>
          지마켓·11번가·쿠팡·알리익스프레스의 타임딜·골드박스를 한곳에 모아 할인율 순으로 보여드려요.
          매일 새로 갱신됩니다.
        </p>
        <DealGrid deals={tier1.length > 0 ? tier1 : tier2} />

        {tier1.length > 0 && tier2.length > 0 && (
          <>
            <div className={styles.sectionHead2}>
              <h2>더 많은 딜</h2>
              <span className={styles.sub}>쇼킹딜 · 앵콜딜</span>
            </div>
            <DealGrid deals={tier2} />
          </>
        )}
      </main>
      <Footer />
    </>
  );
}

export const metadata = {
  alternates: { canonical: SITE },
};
