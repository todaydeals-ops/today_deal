// 페이지네이션 — « ‹ 이전  1 2 3 4 5  다음 › »  (숫자 윈도우 + 처음/끝 점프). top border 없음(중복선 방지).
//
// ★next/link 를 쓰지 않는다(2026-08-18 실측으로 되돌림).
// 서브 미디어 홈(goodsleep·pill·beauty·b4as)은 revalidate 가 걸려 있어 Link 가 전체 RSC 를
// 프리페치한다. 그런데 페이지 링크는 경로가 전부 "/" 이고 쿼리(?page=N)만 다르다.
// 라우터 캐시가 쿼리를 키에 넣지 않아 프리페치된 1페이지 응답이 모든 페이지 링크에 물렸고,
// 클릭하면 주소만 ?page=4 로 바뀌고 목록은 1페이지 그대로였다(3/3 재현, 프리페치 차단 시 정상).
// 헤더·분류 링크가 이미 같은 이유로 <a> 를 쓰고 있다 — 여기만 Link 로 남아 있었다.
// 전체 이동이라 스크롤이 맨 위로 돌아가는 것도 덤이다(버튼이 화면 맨 아래라 이게 중요하다).
import type { CSSProperties } from "react";

const mono = "'Pretendard', -apple-system, BlinkMacSystemFont, sans-serif";
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
    on ? <a href={href(to)} style={cell} aria-label={label}>{label}</a> : <span style={muted}>{label}</span>;

  return (
    <section className="mz-wrap" style={{ paddingTop: 22, paddingBottom: 52 }}>
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
        <Nav to={1} label="«" on={page > 1} />
        <Nav to={page - 1} label="‹ 이전" on={page > 1} />
        {nums.map((p) => (p === page
          ? <span key={p} style={active}>{p}</span>
          : <a key={p} href={href(p)} style={cell}>{p}</a>))}
        <Nav to={page + 1} label="다음 ›" on={page < totalPages} />
        <Nav to={totalPages} label="»" on={page < totalPages} />
      </div>
    </section>
  );
}
