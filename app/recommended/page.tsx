import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import RecommendedHeader from "@/components/RecommendedHeader";
import CuratedList from "@/components/CuratedList";
import { fetchActiveCurated } from "@/lib/data/curated";
import { getRecommendedHeader } from "@/lib/data/settings";

// 헤더 설정이 즉시 반영되도록 매 요청 최신
export const dynamic = "force-dynamic";

const SITE = "https://www.todaydeals.co.kr";
export const metadata: Metadata = {
  title: "오늘의 추천딜 — 직접 고른 쿠팡 핫딜 큐레이션",
  description:
    "에디터가 직접 골라 영상으로 보여주는 쿠팡 추천템 모음. 가전·주방·생활·가구·식품 카테고리별 핫딜을 한눈에.",
  alternates: { canonical: `${SITE}/recommended` },
  openGraph: {
    title: "오늘의 추천딜 — 직접 고른 쿠팡 핫딜",
    description: "에디터가 직접 골라 영상으로 보여주는 쿠팡 추천템 모음.",
    url: `${SITE}/recommended`,
    type: "website",
    images: [{ url: `${SITE}/opengraph-image`, width: 1200, height: 630 }],
  },
};

// 추천딜 — 설정형 헤더(배너/프로필) + 검색/필터 카드 리스트
export default async function Recommended() {
  const [deals, header] = await Promise.all([fetchActiveCurated(), getRecommendedHeader()]);

  const itemListLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "오늘의 추천딜",
    itemListElement: deals.filter((d) => d.slug).map((d, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "Product",
        name: d.productName,
        ...(d.imageUrl ? { image: d.imageUrl } : {}),
        url: `${SITE}/recommended/${d.slug}`,
        offers: { "@type": "Offer", price: d.salePrice, priceCurrency: "KRW", availability: "https://schema.org/InStock", url: `${SITE}/recommended/${d.slug}` },
      },
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListLd) }} />
      <Header />
      <main className="wrap">
        <RecommendedHeader header={header} />
        <CuratedList deals={deals} />
      </main>
      <Footer />
    </>
  );
}
