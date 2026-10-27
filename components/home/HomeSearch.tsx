"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { rankSearch, type SearchItem } from "@/lib/search-rank";
import styles from "@/app/home.module.css";

// 홈 검색창 — 시안: 60px · 2px ink · radius 14, 입력 즉시 드롭다운(최대 6건), 많이 찾는 칩.
// 통합 색인(/api/search-index)은 처음 포커스할 때 한 번 받아 브라우저에서 거른다(디바운스 170ms).
// Enter·찾기 = /search?q= (결과 페이지). 칩 클릭 = 첫 단어를 검색어로 채우고 드롭다운을 연다(시안 동작).
export default function HomeSearch({ chips }: { chips: string[] }) {
  const [q, setQ] = useState("");
  const [dq, setDq] = useState("");
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState<SearchItem[] | null>(null);
  const [failed, setFailed] = useState(false);
  const loading = useRef(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  // 시안: 데스크톱 "무엇이 고민인가요? 예: 세탁기 에러, 마그네슘" / 모바일 "무엇이 고민인가요?" — 서버 렌더는 데스크톱 문구, 모바일이면 하이드레이션 뒤 줄인다
  const [short, setShort] = useState(false);
  useEffect(() => { const mq = window.matchMedia("(max-width: 760px)"); const f = () => setShort(mq.matches); f(); mq.addEventListener("change", f); return () => mq.removeEventListener("change", f); }, []);

  const load = () => {
    if (index || loading.current) return;
    loading.current = true;
    fetch("/api/search-index")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((j: SearchItem[]) => setIndex(j))
      .catch(() => { loading.current = false; setFailed(true); });
  };

  useEffect(() => { const id = setTimeout(() => setDq(q), 170); return () => clearTimeout(id); }, [q]);
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => { if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const terms = dq.trim();
  const results = useMemo(() => (index && terms ? rankSearch(index, terms, 6) : []), [index, terms]);
  const show = open && q.trim().length > 0;

  return (
    <>
      <div className={styles.searchWrap} ref={wrapRef}>
        <form action="/search" method="get" role="search" className={styles.searchBox} onSubmit={() => setOpen(false)}>
          <span className={styles.searchIco} aria-hidden="true" />
          <input
            ref={inputRef}
            name="q"
            type="search"
            value={q}
            autoComplete="off"
            placeholder={short ? "무엇이 고민인가요?" : "무엇이 고민인가요? 예: 세탁기 에러, 마그네슘"}
            aria-label="검색어"
            onFocus={() => { load(); setOpen(true); }}
            onChange={(e) => { setQ(e.target.value); setOpen(true); load(); }}
            onKeyDown={(e) => { if (e.key === "Escape") setOpen(false); }}
          />
          <button type="submit" className={styles.searchBtn}>찾기</button>
        </form>
        {show && (
          <div className={styles.drop} role="listbox" aria-label="검색 결과">
            {results.map((r) => (
              <Link key={r.href} href={r.href} className={styles.dropRow} onClick={() => setOpen(false)}>
                <span className={styles.dropType}>{r.t}</span>
                <span className={styles.dropTitle}>{r.title}</span>
              </Link>
            ))}
            {terms && index && results.length === 0 && (
              <div className={styles.dropEmpty}>일치하는 가이드가 없어요. 다른 단어로 찾아보세요.</div>
            )}
            {terms && !index && !failed && <div className={styles.dropEmpty}>찾는 중이에요…</div>}
            {failed && <div className={styles.dropEmpty}>지금은 바로 보여 드리지 못해요. 찾기 버튼을 눌러 결과 페이지에서 확인해 주세요.</div>}
            {results.length > 0 && <Link href={`/search?q=${encodeURIComponent(q.trim())}`} className={styles.dropAll}>"{q.trim()}" 전체 결과 보기 →</Link>}
          </div>
        )}
      </div>

      <div className={styles.chips}>
        <span className={styles.chipsLabel}>많이 찾는</span>
        {chips.map((label) => (
          <button
            key={label}
            type="button"
            className="rn-chip"
            onClick={() => { setQ(label.split(" ")[0]); setOpen(true); load(); inputRef.current?.focus(); }}
          >
            {label}
          </button>
        ))}
      </div>
    </>
  );
}
