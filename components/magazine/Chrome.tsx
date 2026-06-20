// 매거진 공통 UI — 로고·헤더·푸터·정직성 배지·코너칩·분야칩. (디자인 핸드오프 재현)
import Link from "next/link";
import { CORNERS, cornerOf } from "@/lib/magazine/corners";

const mono = "'JetBrains Mono', monospace";

export function MagazineLogo({ size = "md" }: { size?: "sm" | "md" }) {
  const box = size === "md" ? 30 : 26;
  const icon = size === "md" ? 17 : 15;
  const name = size === "md" ? 19 : 17;
  const label = size === "md" ? 11 : 10;
  return (
    <Link href="/magazine" style={{ display: "flex", alignItems: "center", gap: 9, textDecoration: "none" }}>
      <span style={{ width: box, height: box, borderRadius: 9, background: "#ff5a3c", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <svg width={icon} height={icon} viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="9" stroke="#fff" strokeWidth="2.4" />
          <path d="M12 7.2V12l3.1 2" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" />
        </svg>
      </span>
      <span style={{ fontWeight: 800, fontSize: name, color: "#1a1a1a", letterSpacing: "-0.5px" }}>
        오늘의딜<span style={{ color: "#ff5a3c" }}>.</span>
      </span>
      <span style={{ fontFamily: mono, fontSize: label, letterSpacing: "1.5px", color: "#1a1a1a", fontWeight: 600, borderLeft: "1px solid #e2ddd4", paddingLeft: 11, marginLeft: 4 }}>
        MAGAZINE
      </span>
    </Link>
  );
}

export function MagazineHeader({ small = false }: { small?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: small ? "16px 30px" : "18px 30px", borderBottom: "1px solid #efece7" }}>
      <MagazineLogo size={small ? "sm" : "md"} />
      <nav style={{ display: "flex", gap: 18, fontSize: 12.5, fontWeight: 600 }}>
        {CORNERS.map((c) => (
          <Link key={c.key} href={`/magazine?corner=${c.key}`} className="mz-nav" style={{ color: "#46433d", textDecoration: "none" }}>
            {c.name}
          </Link>
        ))}
      </nav>
    </div>
  );
}

export function MagazineFooter() {
  return (
    <div style={{ background: "#faf8f5", borderTop: "1px solid #efece7", padding: "20px 30px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <span style={{ fontFamily: mono, fontSize: 11, color: "#9a958c", letterSpacing: ".5px" }}>오늘의딜 매거진 · 광고·제휴 없이 운영됩니다</span>
      <span style={{ fontFamily: mono, fontSize: 11, color: "#b6b1a8" }}>© 2026 TODAYDEALS</span>
    </div>
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
        <div style={{ fontSize: 13, fontWeight: 700, color: "#1a1a1a", lineHeight: 1.5 }}>이 글은 끝까지 읽어도 특정 제품을 추천하지 않습니다.</div>
        <div style={{ fontSize: 12, color: "#76726b", lineHeight: 1.5 }}>소비자의 바른 선택, 그 방향만 제시합니다.</div>
      </div>
      <span style={{ marginLeft: "auto", flex: "none", fontFamily: mono, fontSize: 9.5, fontWeight: 600, color: "#ff5a3c", border: "1px solid #f7c9ba", borderRadius: 9999, padding: "4px 8px" }}>AD-FREE</span>
    </div>
  );
}

export function CornerChip({ cornerKey, size = "md" }: { cornerKey: string; size?: "sm" | "md" }) {
  const c = cornerOf(cornerKey);
  const fs = size === "md" ? 11 : 9.5;
  return (
    <span style={{ fontFamily: mono, fontSize: fs, fontWeight: 700, letterSpacing: ".5px", color: c.color, background: c.chipBg, borderRadius: 6, padding: size === "md" ? "5px 11px" : "3px 7px" }}>
      {c.name}
    </span>
  );
}

export function FieldChip({ field }: { field?: string }) {
  if (!field) return null;
  return (
    <span style={{ fontSize: 12, fontWeight: 500, color: "#46433d", background: "#f1ede6", borderRadius: 9999, padding: "5px 12px" }}>{field}</span>
  );
}
