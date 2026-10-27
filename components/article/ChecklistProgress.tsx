"use client";

import styles from "@/app/magazine/[slug]/article.module.css";
import { useChecklist } from "./ChecklistProvider";

// 사이드바 진행 카드(--rn-ink 배경, 큰 숫자 28px/800, 6px 바). 체크리스트가 있는 글에서만 그려진다.
export default function ChecklistProgress({ anchorId }: { anchorId: string }) {
  const ck = useChecklist();
  if (!ck || ck.total === 0) return null;
  const pct = Math.round((ck.count / ck.total) * 100);
  return (
    <div className={styles.progCard}>
      <span className={styles.progLabel}>셀프체크 진행</span>
      <span className={styles.progNum}>
        {ck.count} <span>/ {ck.total}</span>
      </span>
      <div className={styles.progTrack} role="progressbar" aria-label="셀프체크 진행률" aria-valuemin={0} aria-valuemax={ck.total} aria-valuenow={ck.count}>
        <div className={styles.progFill} style={{ width: `${pct}%` }} />
      </div>
      <a href={`#${anchorId}`} className={styles.progLink}>체크리스트로 →</a>
    </div>
  );
}
