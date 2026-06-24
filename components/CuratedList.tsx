import type { CuratedDeal } from "@/lib/types";
import CuratedCard from "./CuratedCard";
import styles from "./CuratedList.module.css";

interface CuratedListProps {
  deals: CuratedDeal[]; // 서버(DB) — 이미 최신순(seq desc) 정렬
}

// 검색·카테고리 필터 제거 — 전체 추천딜을 최신순 그리드로만 노출.
export default function CuratedList({ deals }: CuratedListProps) {
  const sorted = [...deals].sort((a, b) => b.seq - a.seq);

  if (sorted.length === 0) {
    return (
      <p className={styles.empty}>
        <i className="ti ti-mood-empty" />
        아직 추천딜이 없어요. 곧 채워집니다!
      </p>
    );
  }

  return (
    <div className={styles.grid}>
      {sorted.map((deal) => (
        <CuratedCard key={deal.id} deal={deal} />
      ))}
    </div>
  );
}
