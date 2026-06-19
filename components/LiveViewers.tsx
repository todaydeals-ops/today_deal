// "지금 N번째 오늘의딜을 보는 중" 배지 — 오늘 조회 순번(IP당 하루 1회 합산).
// 사람 수가 아니라 조회 순번이라 정직함. 오늘값(today)이라 매일 자정(KST)에 초기화.
import { headers } from "next/headers";
import { bumpViews } from "@/lib/data/views";
import styles from "./LiveViewers.module.css";

export default async function LiveViewers() {
  const h = await headers();
  const ip =
    (h.get("x-forwarded-for") || "").split(",")[0].trim() || h.get("x-real-ip") || "unknown";
  const v = await bumpViews(ip);
  if (!v || v.today <= 0) return null;
  return (
    <div className={styles.badge} aria-label={`오늘 ${v.today}번째 방문`}>
      <span className={styles.dot} />
      <span>
        지금 <strong>{v.today.toLocaleString("ko-KR")}</strong>번째 오늘의딜을 보는 중입니다{" "}
        <span className={styles.note}>(방문 수는 매일 자정 KST(서울)에 초기화됩니다)</span>
      </span>
    </div>
  );
}
