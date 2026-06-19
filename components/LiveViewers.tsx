// "지금 N번째 오늘의딜을 보는 중" 배지 — 오늘 일어난 모든 활동의 순번.
// N = 오늘 활동 스냅샷(홈 방문 + 글 조회·하트 + 글 수). 새 방문자 접속 때만 갱신,
// 같은 사람 새로고침엔 안 변함(RPC 스냅샷). 자정(KST)에 초기화.
import { headers } from "next/headers";
import { bumpViews, todayBoardActivity } from "@/lib/data/views";
import styles from "./LiveViewers.module.css";

export default async function LiveViewers() {
  const h = await headers();
  const ip =
    (h.get("x-forwarded-for") || "").split(",")[0].trim() || h.get("x-real-ip") || "unknown";
  const v = await bumpViews(ip);
  // RPC가 스냅샷(activity)을 주면 그 값(새 방문자일 때만 갱신). 아직 구 RPC면 라이브 계산 폴백.
  const n = v?.activity != null ? v.activity : (v?.today ?? 0) + (await todayBoardActivity());
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
