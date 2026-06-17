import Header from "@/components/Header";
import Banner from "@/components/Banner";
import TimeDealBoard from "@/components/TimeDealBoard";
import Footer from "@/components/Footer";
import { fetchDealsByPlatform } from "@/lib/data/deals";
import styles from "./page.module.css";

// 타임딜 메인 — 지마켓 / 11번가 / 알리 3열 (모바일은 탭 전환)
export default async function Home() {
  const dealsByPlatform = await fetchDealsByPlatform();

  return (
    <>
      <Header />
      <main className="wrap">
        <Banner />

        <div className={styles.sectionHead}>
          <h2>오늘의 타임딜</h2>
          <span className={styles.sub}>실시간</span>
        </div>
        <p className={styles.sectionDesc}>
          오늘의 신상 슈퍼할인쇼킹딜 입니다. 한눈에 확인하고 알뜰소비하세요.
        </p>

        <TimeDealBoard dealsByPlatform={dealsByPlatform} />
      </main>
      <Footer />
    </>
  );
}
