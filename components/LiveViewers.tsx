// "지금 N번째 오늘의딜을 보는 중" 배지 — 오늘 일어난 모든 활동의 순번.
// N = 홈 방문 + 오늘 글들의 조회·하트 합 + 글 수(봇·실제 모두). 자정(KST)에 초기화.
import { headers } from "next/headers";
import { bumpViews, todayBoardActivity } from "@/lib/data/views";
import styles from "./LiveViewers.module.css";

export default async function LiveViewers() {
  const h = await headers();
  const ip =
    (h.get("x-forwarded-for") || "").split(",")[0].trim() || h.get("x-real-ip") || "unknown";
  const [v, activity] = await Promise.all([bumpViews(ip), todayBoardActivity()]);
  const n = (v?.today ?? 0) + activity; // 홈 방문 + 오늘 글 조회·하트·글수
  if (n <= 0) return null;
  return (
    <div className={styles.badge} aria-label={`오늘 ${n}번째 활동`}>
      <span className={styles.dot} />
      <span>
        지금 <strong>{n.toLocaleString("ko-KR")}</strong>번째 오늘의딜을 보는 중입니다{" "}
        <span className={styles.note}>(매일 자정 KST(서울)에 초기화됩니다)</span>
      </span>
    </div>
  );
}
