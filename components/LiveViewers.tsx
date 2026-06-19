// "지금 N번째 오늘의딜을 보는 중" 배지 — 누적 조회 순번(IP당 하루 1회 합산).
// 사람 수가 아니라 조회 순번이라 정직함. 누적값(total)이라 매일 리셋 안 되고 계속 증가.
import { headers } from "next/headers";
import { bumpViews } from "@/lib/data/views";
import styles from "./LiveViewers.module.css";

export default async function LiveViewers() {
  const h = await headers();
  const ip =
    (h.get("x-forwarded-for") || "").split(",")[0].trim() || h.get("x-real-ip") || "unknown";
  const v = await bumpViews(ip);
  if (!v || v.total <= 0) return null;
  return (
    <div className={styles.badge} aria-label={`누적 ${v.total}번째 조회`}>
      <span className={styles.dot} />
      지금 <strong>{v.total.toLocaleString("ko-KR")}</strong>번째 오늘의딜을 보는 중입니다
    </div>
  );
}
