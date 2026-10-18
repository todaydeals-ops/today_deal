import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import RecommendedHeader from "@/components/RecommendedHeader";
import CuratedList from "@/components/CuratedList";
import { fetchActiveCurated } from "@/lib/data/curated";
import { getRecommendedHeader } from "@/lib/data/settings";

// 2026-09-15 — 관리자 헤더 설정 반영 목적이었으나 force-dynamic(무캐시)이
// Supabase egress 한도 초과로 사이트 전체를 막은 사고의 원인이었다. 1분 캐시로도
// "즉시"에 가깝고, 방문마다 재조회하던 걸 없앤다.
export const revalidate = 60;

const SITE = "https://www.todaydeals.co.kr";
export const metadata: Metadata = {
  title: "오늘의 AI추천딜 — AI가 고른 인기몰 특가 큐레이션",
  description:
    "마켓컬리·이마트 등 인기 쇼핑몰 특가를 AI가 추려 한곳에. 가전·주방·생활·가구·식품 카테고리별 추천딜을 한눈에.",
  alternates: { canonical: `${SITE}/recommended` },
  openGraph: {
    title: "오늘의 AI추천딜 — AI가 고른 인기몰 특가",
    description: "마켓컬리·이마트 등 인기 쇼핑몰 특가를 AI가 추려 한곳에 모았어요.",
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
    name: "오늘의 AI추천딜",
    itemListElement: deals.filter((d) => d.slug && d.imageUrl).map((d, i) => ({
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
