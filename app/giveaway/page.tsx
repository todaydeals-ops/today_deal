import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import GiveawayCard from "@/components/GiveawayCard";
import { fetchGiveaways } from "@/lib/data/giveaways";
import styles from "./page.module.css";

export const revalidate = 60;

const SITE = "https://todaydeals.co.kr";
export const metadata: Metadata = {
  title: "오늘의딜 나눔이벤트 — 매주·매월 무료 경품 추첨",
  description:
    "회원에게 매주(다수)·매월(고가) 무료 경품을 추첨으로 드립니다. 로그인하고 시간대마다 응모권을 모아보세요.",
  alternates: { canonical: `${SITE}/giveaway` },
  openGraph: {
    title: "오늘의딜 나눔이벤트 — 매주·매월 무료 경품 추첨",
    description: "로그인하고 응모권을 모아 무료 경품에 도전하세요. 매주·매월 추첨.",
    url: `${SITE}/giveaway`,
    type: "website",
  },
};

// 나눔이벤트 — 주간(매주·5명) / 월간(매월·1명) 구분
export default async function Giveaway() {
  const all = await fetchGiveaways();
  const weekly = all.filter((g) => g.type === "weekly");
  const monthly = all.filter((g) => g.type === "monthly");

  return (
    <>
      <Header />
      <main className="wrap">
        <div className={styles.hero}>
          <h2>오늘의딜 나눔이벤트</h2>
          <p>
            오늘의딜 회원에게 매주, 매월 경품을 직접 보내드립니다.
            <br />
            원클릭 회원가입으로 간편응모하세요~
          </p>
        </div>

        {/* 주간 나눔딜 */}
        <div className={styles.sectionHead}>
          <h3>주간 나눔딜</h3>
          <span className={styles.badge}>매주 · 5명 추첨</span>
        </div>
        <p className={styles.sectionDesc}>부담 없는 살림템을 매주 다섯 분께 드려요.</p>
        <div className={styles.grid}>
          {weekly.map((g) => (
            <GiveawayCard key={g.id} giveaway={g} />
          ))}
        </div>

        {/* 월간 나눔딜 */}
        <div className={`${styles.sectionHead} ${styles.monthlyHead}`}>
          <h3>월간 나눔딜</h3>
          <span className={`${styles.badge} ${styles.badgeMonthly}`}>매월 · 1명 추첨</span>
        </div>
        <p className={styles.sectionDesc}>이달의 대형 경품을 단 한 분께 몰아드려요.</p>
        <div className={styles.grid}>
          {monthly.map((g) => (
            <GiveawayCard key={g.id} giveaway={g} />
          ))}
        </div>

        <div className={styles.consentNote}>
          <i className="ti ti-info-circle" />
          <span>
            응모는 회원가입 + 마케팅 수신 동의가 필요하며, 쿠팡 등 상품 구매·클릭과는 무관합니다.
            마케팅 수신 동의는 언제든 철회할 수 있습니다.
          </span>
        </div>
      </main>
      <Footer />
    </>
  );
}
