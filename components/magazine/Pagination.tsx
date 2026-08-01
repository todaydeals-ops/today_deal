// 페이지네이션 — « ‹ 이전  1 2 3 4 5  다음 › »  (숫자 윈도우 + 처음/끝 점프). top border 없음(중복선 방지).
import Link from "next/link";
import type { CSSProperties } from "react";

const mono = "'JetBrains Mono', monospace";
const cell: CSSProperties = { fontFamily: mono, fontSize: 13, fontWeight: 700, color: "#16140f", textDecoration: "none", padding: "7px 11px", border: "1px solid #ddd5c8", borderRadius: 8, minWidth: 38, textAlign: "center", lineHeight: 1 };
const muted: CSSProperties = { ...cell, color: "#c9c1b3", borderColor: "#efe9df", pointerEvents: "none" };
const active: CSSProperties = { ...cell, background: "#16140f", color: "#fff", borderColor: "#16140f" };

export default function Pagination({ page, totalPages, href }: { page: number; totalPages: number; href: (p: number) => string }) {
  if (totalPages <= 1) return null;
  const win = 5;
  const end = Math.min(totalPages, Math.max(page + 2, win));
  const start = Math.max(1, end - win + 1);
  const nums: number[] = [];
  for (let p = start; p <= end; p++) nums.push(p);

  const Nav = ({ to, label, on }: { to: number; label: string; on: boolean }) =>
    on ? <Link href={href(to)} style={cell} aria-label={label}>{label}</Link> : <span style={muted}>{label}</span>;

  return (
    <section className="mz-wrap" style={{ paddingTop: 22, paddingBottom: 52 }}>
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
        <Nav to={1} label="«" on={page > 1} />
        <Nav to={page - 1} label="‹ 이전" on={page > 1} />
        {nums.map((p) => (p === page
          ? <span key={p} style={active}>{p}</span>
          : <Link key={p} href={href(p)} style={cell}>{p}</Link>))}
        <Nav to={page + 1} label="다음 ›" on={page < totalPages} />
        <Nav to={totalPages} label="»" on={page < totalPages} />
      </div>
    </section>
  );
}
