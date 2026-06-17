import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PartnerProfile from "@/components/PartnerProfile";
import CuratedList from "@/components/CuratedList";
import { partnerProfile } from "@/data/mockCurated";
import { fetchActiveCurated } from "@/lib/data/curated";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "오늘의 추천딜 — 오늘의딜",
  description: "직접 고른 쿠팡 핫딜 큐레이션",
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
