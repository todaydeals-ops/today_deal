// 매거진 공통 UI — Kontents 컨셉(오렌지) 셸. 로고·헤더·푸터·정직성 배지·코너칩·커버.
import Link from "next/link";
import { CORNERS, cornerOf, CATCH } from "@/lib/magazine/corners";

const mono = "'JetBrains Mono', monospace";
const serif = "'Noto Serif KR', serif";

export function MagazineLogo() {
  return (
    <Link href="/magazine" className="mz-logo" style={{ textDecoration: "none", color: "#16160f" }}>
      <span className="a">오늘의딜<span className="dot">.</span></span>
      <span className="b">MAGAZINE</span>
    </Link>
  );
}

export function MagazineHeader() {
  return (
    <header className="mz-head">
      <MagazineLogo />
      <nav>
        {CORNERS.map((c) => (
          <Link key={c.key} className="mz-link" href={`/magazine?corner=${c.key}`} style={{ color: "#6b6a60" }}>
            {c.name}
          </Link>
        ))}
        <Link className="mz-pill" href="/magazine">매거진</Link>
      </nav>
    </header>
  );
}

export function MagazineFooter() {
  return (
    <footer className="mz-foot" style={{ flexDirection: "column", alignItems: "flex-start", gap: 18 }}>
      <div style={{ fontFamily: serif, fontSize: 14.5, color: "#6b6a60", lineHeight: 1.85, maxWidth: 540 }}>
        {CATCH.lonely.lead}<br />
        <span style={{ color: "#46443c" }}>{CATCH.lonely.tail}</span>
      </div>
      <div style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
        <nav>
          <Link className="mz-link" href="/">오늘의딜 홈</Link>
          <Link className="mz-link" href="/magazine">매거진</Link>
          <Link className="mz-link" href="/board">핫딜게시판</Link>
          <Link className="mz-link" href="/terms">이용약관</Link>
          <Link className="mz-link" href="/privacy">개인정보처리방침</Link>
        </nav>
        <div className="cp">© 2026 TODAYDEALS</div>
      </div>
    </footer>
  );
}

// 정직성 배지 — 모든 글 상단 고정
export function HonestyBadge() {
  return (
    <div style={{ border: "1px solid #e7e2d9", background: "#faf8f5", borderRadius: 12, padding: "14px 16px", display: "flex", alignItems: "center", gap: 13, margin: "22px 0 28px" }}>
      <span style={{ width: 34, height: 34, borderRadius: 9999, border: "2px solid #ff5a3c", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M5 13l4 4L19 7" stroke="#ff5a3c" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#16160f", lineHeight: 1.5 }}>이 글은 끝까지 읽어도 특정 제품을 추천하지 않습니다.</div>
        <div style={{ fontSize: 12, color: "#76726b", lineHeight: 1.5 }}>소비자의 바른 선택, 그 방향만 제시합니다.</div>
      </div>
      <span style={{ marginLeft: "auto", flex: "none", fontFamily: mono, fontSize: 9.5, fontWeight: 600, color: "#ff5a3c", border: "1px solid #f7c9ba", borderRadius: 9999, padding: "4px 8px" }}>AD-FREE</span>
    </div>
  );
}

export function CornerChip({ cornerKey, size = "md" }: { cornerKey: string; size?: "sm" | "md" }) {
  const c = cornerOf(cornerKey);
  const fs = size === "md" ? 11.5 : 10;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: fs, fontWeight: 700, color: c.color, background: c.chipBg, borderRadius: 6, padding: size === "md" ? "5px 11px" : "3px 8px" }}>
      {c.name}
      <span style={{ fontFamily: mono, fontSize: fs - 2, fontWeight: 500, letterSpacing: ".5px", opacity: 0.8 }}>{c.nameEn}</span>
    </span>
  );
}

export function FieldChip({ field }: { field?: string }) {
  if (!field) return null;
  return (
    <span style={{ fontFamily: mono, fontSize: 10.5, fontWeight: 500, letterSpacing: ".5px", color: "#6b6a60" }}>{field}</span>
  );
}

// 타이포 커버 — AI/스톡 이미지 대신 쓰는 데이터형 표지
export function CoverPanel({ cornerKey, headline, height = 180, big = 26 }: { cornerKey: string; headline: string; height?: number; big?: number }) {
  return (
    <div style={{ height: "100%", minHeight: height, background: "#faf8f5", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "16px 18px", boxSizing: "border-box" }}>
      <CornerChip cornerKey={cornerKey} size="sm" />
      <div style={{ fontSize: big, fontWeight: 800, color: "#16160f", letterSpacing: "-0.6px", lineHeight: 1.25 }}>{headline}</div>
      <div style={{ fontFamily: mono, fontSize: 10, fontWeight: 500, letterSpacing: ".5px", color: "#b0aaa0" }}>오늘의딜 MAGAZINE</div>
    </div>
  );
}
