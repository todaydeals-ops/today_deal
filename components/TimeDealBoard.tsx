"use client";

import { useState } from "react";
import type { Deal, Platform } from "@/lib/types";
import { PLATFORM_ORDER, PLATFORM_LABELS } from "@/lib/types";
import DealColumn from "./DealColumn";
import styles from "./TimeDealBoard.module.css";

interface TimeDealBoardProps {
  dealsByPlatform: Record<Platform, Deal[]>;
}

// 타임딜 3열 보드.
// 데스크탑: 3열 동시 노출. 모바일: 탭으로 한 플랫폼씩 전환(탭/숨김은 CSS가 제어).
export default function TimeDealBoard({ dealsByPlatform }: TimeDealBoardProps) {
  const [active, setActive] = useState<Platform>(PLATFORM_ORDER[0]);

  return (
    <>
      {/* 모바일 전용 탭 (데스크탑에선 CSS로 숨김) */}
      <div className={styles.tabs} role="tablist">
        {PLATFORM_ORDER.map((p) => (
          <button
            key={p}
            role="tab"
            aria-selected={active === p}
            className={`${styles.tab} ${active === p ? styles.tabActive : ""}`}
            onClick={() => setActive(p)}
          >
            {PLATFORM_LABELS[p]}
          </button>
        ))}
      </div>

      <div className={styles.grid}>
        {PLATFORM_ORDER.map((p) => (
          <div
            key={p}
            className={`${styles.colWrap} ${active === p ? styles.colActive : ""}`}
          >
            <DealColumn platform={p} deals={dealsByPlatform[p]} />
          </div>
        ))}
      </div>
    </>
  );
}
