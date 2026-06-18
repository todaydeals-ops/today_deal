"use client";

import { useMemo, useState } from "react";
import type { CuratedDeal, CuratedCategory } from "@/lib/types";
import { CURATED_CATEGORIES } from "@/lib/types";
import CuratedCard from "./CuratedCard";
import styles from "./CuratedList.module.css";

interface CuratedListProps {
  deals: CuratedDeal[]; // 서버(DB) — 이미 최신순(seq desc) 정렬
}

type Filter = "전체" | CuratedCategory;
const FILTERS: Filter[] = ["전체", ...CURATED_CATEGORIES];

export default function CuratedList({ deals }: CuratedListProps) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<Filter>("전체");

  const allDeals = useMemo(() => {
    return [...deals].sort((a, b) => b.seq - a.seq);
  }, [deals]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allDeals.filter((d) => {
      const matchCat = category === "전체" || d.category === category;
      const matchQuery = q === "" || d.productName.toLowerCase().includes(q);
      return matchCat && matchQuery;
    });
  }, [allDeals, query, category]);

  return (
    <div>
      {/* 검색 */}
      <div className={styles.search}>
        <i className="ti ti-search" />
        <input
          type="search"
          placeholder="추천템 검색"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="추천딜 검색"
        />
      </div>

      {/* 카테고리 필터 (칩) */}
      <div className={styles.chips}>
        {FILTERS.map((f) => (
          <button
            key={f}
            className={`${styles.chip} ${category === f ? styles.chipActive : ""}`}
            onClick={() => setCategory(f)}
          >
            {f}
          </button>
        ))}
      </div>

      {/* 결과 */}
      {filtered.length > 0 ? (
        <div className={styles.grid}>
          {filtered.map((deal) => (
            <CuratedCard key={deal.id} deal={deal} />
          ))}
        </div>
      ) : (
        <p className={styles.empty}>
          <i className="ti ti-mood-empty" />
          조건에 맞는 추천템이 없어요.
        </p>
      )}
    </div>
  );
}
