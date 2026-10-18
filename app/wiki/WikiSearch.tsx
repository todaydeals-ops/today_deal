"use client";
// 생활백과 검색 — 표제어·다른 이름(aliases)·인물로 찾는다. 항목 목록은 빌드 때 props 로 받는다.
import { useMemo, useState } from "react";
import Link from "next/link";

export interface SearchItem { slug: string; title: string; seoTitle: string; aliases: string[]; people: string[]; type: string }

const norm = (s: string) => s.toLowerCase().replace(/\s+/g, "");

export default function WikiSearch({ items }: { items: SearchItem[] }) {
  const [q, setQ] = useState("");
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

  return (
    <div>
      <input
        className="wk-search"
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="찾을 말을 넣어 보세요 · 예: 백지영 발크림, 빅스마일데이, 엽산"
        aria-label="생활백과 검색"
      />
      {q && (
        <div className="wk-hits">
          {hits.length ? (
            hits.map(({ it }) => (
              <Link key={it.slug} href={`/wiki/${it.slug}`}>
                {it.title}<small>{it.type}</small>
              </Link>
            ))
          ) : (
            <div style={{ padding: "12px 16px", fontSize: 14, color: "#76726b" }}>
              아직 없는 항목이에요. 매거진 검색이나 아래 분야 목록에서 비슷한 항목을 찾아보세요.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
