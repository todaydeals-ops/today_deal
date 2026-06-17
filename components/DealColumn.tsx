import type { Deal, Platform } from "@/lib/types";
import { PLATFORM_LABELS } from "@/lib/types";
import DealCard from "./DealCard";
import styles from "./DealColumn.module.css";

interface DealColumnProps {
  platform: Platform;
  deals: Deal[];
}

// 플랫폼별 세로 열. 재정렬 없이 노출 순서 그대로 (기획안 3.1 레이아웃).
export default function DealColumn({ platform, deals }: DealColumnProps) {
  return (
    <div className={styles.col}>
      <div className={styles.colHead}>{PLATFORM_LABELS[platform]}</div>
      {deals.map((deal) => (
        <DealCard key={deal.id} deal={deal} />
      ))}
    </div>
  );
}
