import Link from "next/link";
import AdminLogout from "@/components/AdminLogout";
import styles from "./page.module.css";

export const metadata = { title: "관리자 — 오늘의딜" };

// 관리자 허브 — 모든 등록/관리 도구를 한곳에서.
const TOOLS = [
  {
    href: "/admin/recommended",
    icon: "ti-sparkles",
    title: "추천딜 등록",
    desc: "쿠팡 큐레이션 + 쇼츠/릴스 영상 + AI 한줄평. 개별 콘텐츠 페이지 생성.",
  },
  {
    href: "/admin/timedeal",
    icon: "ti-clock-bolt",
    title: "타임딜 관리",
    desc: "지마켓·11번가·쿠팡 실시간 타임딜 수집/등록 현황.",
  },
  {
    href: "/admin/giveaway",
    icon: "ti-gift",
    title: "나눔이벤트 관리",
    desc: "경품·응모 현황 관리 및 당첨자 추첨.",
  },
  {
    href: "/admin/newsletter",
    icon: "ti-mail",
    title: "위클리 뉴스레터",
    desc: "당첨자 발표 + 추천딜 모아 이메일 발송.",
  },
];

export default function AdminHome() {
  return (
    <main className={styles.wrap}>
      <header className={styles.head}>
        <div className={styles.brand}>
          <span className={styles.logo}>
            <i className="ti ti-clock-hour-4" />
          </span>
          <div>
            <h1>
              오늘의딜 <span className={styles.dot}>·</span> 관리자
            </h1>
            <p className={styles.sub}>등록·관리 도구를 한곳에서</p>
          </div>
        </div>
        <AdminLogout className={styles.logout} />
      </header>

      <div className={styles.grid}>
        {TOOLS.map((t) => (
          <Link key={t.href} href={t.href} className={styles.card}>
            <span className={styles.cardIcon}>
              <i className={`ti ${t.icon}`} />
            </span>
            <span className={styles.cardTitle}>{t.title}</span>
            <span className={styles.cardDesc}>{t.desc}</span>
            <span className={styles.cardGo}>
              열기 <i className="ti ti-arrow-right" />
            </span>
          </Link>
        ))}
      </div>

      <div className={styles.links}>
        <Link href="/" className={styles.outLink}>
          <i className="ti ti-external-link" /> 사이트 보기
        </Link>
        <Link href="/recommended" className={styles.outLink}>
          <i className="ti ti-external-link" /> 추천딜 페이지
        </Link>
      </div>
    </main>
  );
}
