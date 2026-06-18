// "지금 N명이 보는 중" 배지 — 오늘 IP당 1회 합산(같은 IP 새로고침엔 안 오름).
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
    <div className={styles.badge} aria-label={`오늘 ${v.today}회 조회`}>
      <span className={styles.dot} />
      지금 <strong>{v.today.toLocaleString("ko-KR")}</strong>명이 오늘의딜을 보는 중
    </div>
  );
}
