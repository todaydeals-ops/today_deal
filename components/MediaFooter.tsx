import Link from "next/link";
import styles from "./MediaFooter.module.css";

// 오늘의딜 미디어(매거진·홈·생활백과) 푸터 — 2026-10-27 홈페이지 리뉴얼 시안.
// 홈(variant="home")은 큰 문구 + 보조 문구 + 크레딧·약관, 그 외 화면은 크레딧·약관 한 줄.
// (예전엔 다크 밴드 + 브랜드 패밀리 블록이 있었다 — 연구소가 오늘의딜 분야로 흡수돼 서로 홍보할 별도 브랜드가 없고, 시안에도 없다.)
// 제휴 마케팅 고지는 미디어 화면엔 필요 없다(실제 딜 페이지 /deals·/deal·/recommended·/board 는 components/Footer 사용).
export default function MediaFooter({ variant = "default" }: { variant?: "home" | "default" }) {
  const home = variant === "home";
  return (
    <footer className={`${styles.footer} ${home ? "" : styles.compact}`}>
      <div className={styles.inner}>
        {home && (
          <div className={styles.statement}>
            <p className={styles.big}>정답 대신 기준을,<br />권유 대신 근거를 드립니다.</p>
            <p className={styles.sub}>무언가를 고르고 결정하는 일은 생각보다 외롭습니다. 당신은 혼자가 아닙니다.</p>
          </div>
        )}
        <div className={styles.credits}>
          <span>오늘의딜 콘텐츠팀 · 매거진 편집국 · hello@todaydeals.co.kr · © 2026 오늘의딜</span>
          <span className={styles.links}>
            <Link href="/terms">이용약관</Link>
            <Link href="/privacy">개인정보처리방침</Link>
            <Link href="/partnership">제휴문의</Link>
            <Link href="/admin" className={styles.admin} aria-label="관리자">admin</Link>
          </span>
        </div>
      </div>
    </footer>
  );
}
