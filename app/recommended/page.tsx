import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PartnerProfile from "@/components/PartnerProfile";
import CuratedList from "@/components/CuratedList";
import { partnerProfile } from "@/data/mockCurated";
import { fetchActiveCurated } from "@/lib/data/curated";

export const revalidate = 60;

const SITE = "https://todaydeals.co.kr";
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
  },
};

// 추천딜 — 링크인바이오식 큐레이션 (프로필 헤더 + 검색/필터 카드 리스트)
export default async function Recommended() {
  const deals = await fetchActiveCurated();

  return (
    <>
      <Header />
      <main className="wrap">
        <PartnerProfile profile={partnerProfile} />
        <CuratedList deals={deals} />
      </main>
      <Footer />
    </>
  );
}
