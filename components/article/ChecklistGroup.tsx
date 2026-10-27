"use client";

import styles from "@/app/magazine/[slug]/article.module.css";
import { useChecklist } from "./ChecklistProvider";

// 본문 속 셀프체크 단계 목록 한 덩어리 — 시안의 체크리스트 카드.
// 카드 전체가 하나의 <button role="checkbox"> 라서 터치 영역이 넉넉하고(모바일 44px+), 스크린리더는 단계 문장을 이름으로 읽는다.
// 시안의 "소요시간·팁" 칸은 본문 데이터에 없어 만들지 않았다(단계 문장 안의 굵은 글씨가 제목 역할을 한다).
export default function ChecklistGroup({
  start,
  items,
  anchorId,
  first,
}: {
  start: number; // 이 그룹 첫 단계의 글 전체 기준 번호(0부터)
  items: string[]; // 단계 본문 HTML(서버가 만든 신뢰된 마크업)
  anchorId: string;
  first: boolean; // 글의 첫 체크리스트면 안내 문구를 붙인다
}) {
  const ck = useChecklist();
  const groupDone = ck ? items.reduce((n, _, i) => n + (ck.done.has(start + i) ? 1 : 0), 0) : 0;
  return (
    <div className={styles.ck} data-check-group={anchorId}>
      <div className={styles.ckHead}>
        {first && <p className={styles.ckHint}>위에서부터 순서대로 해보세요. 확인한 단계는 체크해 두면 진행 상황이 저장됩니다.</p>}
        <span className={styles.ckCount} aria-live="polite">
          {groupDone} / {items.length} 완료
        </span>
      </div>
      <ol className={styles.ckList}>
        {items.map((html, i) => {
          const idx = start + i;
          const on = !!ck?.done.has(idx);
          return (
            <li key={idx}>
              <button
                type="button"
                role="checkbox"
                aria-checked={on}
                id={`ck-${idx}`}
                className={`${styles.ckItem} ${on ? styles.ckOn : ""}`}
                onClick={() => ck?.toggle(idx)}
              >
                <span className={styles.ckBox} aria-hidden="true">{on ? "✓" : ""}</span>
                <span className={styles.ckBody}>
                  <span className={styles.ckStep}>STEP {i + 1}</span>
                  <span className={styles.ckText} dangerouslySetInnerHTML={{ __html: html }} />
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
