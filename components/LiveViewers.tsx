// "지금 N명이 보는 중" 배지 — 렌더 시 카운트 증가 + 오늘 누적 표시.
// 모든 페이지 히트(봇 크롤 포함)를 합산하므로 유니크 방문자 수가 아님.
import { bumpViews } from "@/lib/data/views";
import styles from "./LiveViewers.module.css";

export default async function LiveViewers() {
  const v = await bumpViews();
  if (!v || v.today <= 0) return null;
  return (
    <div className={styles.badge} aria-label={`오늘 ${v.today}회 조회`}>
      <span className={styles.dot} />
      지금 <strong>{v.today.toLocaleString("ko-KR")}</strong>명이 오늘의딜을 보는 중
    </div>
  );
}
