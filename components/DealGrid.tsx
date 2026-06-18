import type { Deal } from "@/lib/types";
import DealCard from "./DealCard";
import styles from "./DealGrid.module.css";

// 통합 딜 그리드 (반응형). 플랫폼 구분 없이 카드만 정렬해 노출.
export default function DealGrid({ deals }: { deals: Deal[] }) {
  if (deals.length === 0) return null;
  return (
    <div className={styles.grid}>
      {deals.map((d) => (
        <DealCard key={d.id} deal={d} />
      ))}
    </div>
  );
}
