"use client";
// 생활백과 검색 — 표제어·다른 이름(aliases)·인물로 찾는다. 항목 목록은 빌드 때 props 로 받는다(찾는 방식은 예전 그대로).
// 2026-10-27 리뉴얼: 모양은 홈 검색창과 같다(60px · 2px ink · radius 14, 결과 드롭다운도 같은 톤). Enter·찾기 = 가장 위 결과로 이동.
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import s from "./wiki-hub.module.css";

export interface SearchItem { slug: string; title: string; seoTitle: string; aliases: string[]; people: string[]; type: string }

const norm = (t: string) => t.toLowerCase().replace(/\s+/g, "");

export default function WikiSearch({ items }: { items: SearchItem[] }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  // 시안: 데스크톱은 예시까지, 모바일은 줄여서 — 서버 렌더는 데스크톱 문구, 모바일이면 하이드레이션 뒤 줄인다
  const [short, setShort] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 760px)");
    const f = () => setShort(mq.matches);
    f();
    mq.addEventListener("change", f);
    return () => mq.removeEventListener("change", f);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => { if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const hits = useMemo(() => {
    const k = norm(q);
    if (k.length < 1) return [];
    return items
      .map((it) => {
        const fields = [it.title, ...it.aliases, ...it.people, it.seoTitle].map(norm);
        const score = fields[0].startsWith(k) ? 3 : fields.some((f) => f.startsWith(k)) ? 2 : fields.some((f) => f.includes(k)) ? 1 : 0;
        return { it, score };
      })
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 12);
  }, [q, items]);

  const show = open && q.trim().length > 0;

  return (
    <div className={s.searchWrap} ref={wrapRef}>
      <form
        role="search"
        className={s.searchBox}
        onSubmit={(e) => {
          e.preventDefault();
          if (hits[0]) { setOpen(false); router.push(`/wiki/${hits[0].it.slug}`); }
          else setOpen(true);
        }}
      >
        <span className={s.searchIco} aria-hidden="true" />
        <input
          type="search"
          value={q}
          autoComplete="off"
          placeholder={short ? "찾을 말을 넣어 보세요" : "찾을 말을 넣어 보세요 · 예: 청년월세, 빅스마일데이, 홍현희 커피머신"}
          aria-label="생활백과 검색"
          onFocus={() => setOpen(true)}
          onChange={(e) => { setQ(e.target.value); setOpen(true); }}
          onKeyDown={(e) => { if (e.key === "Escape") setOpen(false); }}
        />
        <button type="submit" className={s.searchBtn}>찾기</button>
      </form>
      {show && (
        <div className={s.drop} role="group" aria-label="검색 결과">
          {hits.length ? (
            hits.map(({ it }) => (
              <Link key={it.slug} href={`/wiki/${it.slug}`} className={s.dropRow} onClick={() => setOpen(false)}>
                <span className={s.dropType}>{it.type}</span>
                <span className={s.dropTitle}>{it.title}</span>
              </Link>
            ))
          ) : (
            <>
              <div className={s.dropEmpty}>아직 없는 항목이에요. 다른 단어로 찾아보거나, 아래 분야 목록에서 비슷한 항목을 골라 보세요.</div>
              <Link href={`/search?q=${encodeURIComponent(q.trim())}`} className={s.dropAll} onClick={() => setOpen(false)}>
                매거진까지 넓혀서 &quot;{q.trim()}&quot; 찾아보기 →
              </Link>
            </>
          )}
        </div>
      )}
    </div>
  );
}
