// 매거진 공통 UI — 리디자인 확정안(페이퍼·세리프·얇은 룰, 오렌지=점)
import Link from "next/link";
import { CORNERS, cornerOf, CORNER_SHORT, CATCH } from "@/lib/magazine/corners";

const mono = "'JetBrains Mono', monospace";
const serif = "'Noto Serif KR', serif";

/* 유틸 바 (잉크) */
export function MagazineUtilBar() {
  return (
    <div className="mz-util">
      <div className="mz-wrap" style={{ paddingTop: 7, paddingBottom: 7, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <span style={{ display: "flex", alignItems: "center", gap: 8 }}><span style={{ color: "#ff5a3c" }}>●</span> 광고 0 · 제휴 0 · 구매 판단의 기준만</span>
        <span style={{ display: "flex", gap: 18 }}>
          <Link href="/" style={{ color: "#cdc6ba", textDecoration: "none" }}>오늘의딜 홈</Link>
          <Link href="/magazine" style={{ color: "#fff", textDecoration: "none" }}>매거진</Link>
        </span>
      </div>
    </div>
  );
}

/* 마스트헤드 (로고 + 코너 내비) */
export function MagazineMasthead() {
  return (
    <header className="mz-mast">
      <div className="mz-wrap" style={{ paddingTop: 22, paddingBottom: 22, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
        <Link href="/magazine" style={{ display: "flex", alignItems: "center", gap: 12, textDecoration: "none", color: "#16140f" }}>
          <span style={{ width: 34, height: 34, borderRadius: 10, background: "#ff5a3c", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="#fff" strokeWidth="2.4" /><path d="M12 7.2V12l3.1 2" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" /></svg>
          </span>
          <span style={{ display: "flex", alignItems: "baseline", gap: 9 }}>
            <span style={{ fontWeight: 900, fontSize: 23, letterSpacing: "-0.6px" }}>오늘의딜<span style={{ color: "#ff5a3c" }}>.</span></span>
            <span style={{ fontFamily: mono, fontSize: 12, letterSpacing: "3px", fontWeight: 600, color: "#16140f", borderLeft: "1px solid #c8c0b3", paddingLeft: 11 }}>MAGAZINE</span>
          </span>
        </Link>
        <nav className="mz-nav">
          {CORNERS.map((c) => (
            <Link key={c.key} className="ul-sweep" href={`/magazine?corner=${c.key}`} style={{ textDecoration: "none", color: "#5b564d" }}>{c.name}</Link>
          ))}
        </nav>
      </div>
    </header>
  );
}

/* 코너 인덱스 (5칸) */
export function CornerIndex() {
  return (
    <section className="mz-wrap" style={{ paddingTop: 34 }}>
      <div className="mz-corner-index">
        {CORNERS.map((c, i) => (
          <Link key={c.key} className="corner-cell" href={`/magazine?corner=${c.key}`}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span className="cc-n" style={{ fontFamily: mono, fontSize: 11, fontWeight: 600, color: "#9a9286" }}>{String(i + 1).padStart(2, "0")}</span>
              <span style={{ width: 9, height: 9, borderRadius: 9999, background: c.color }} />
            </div>
            <div className="cc-t" style={{ fontWeight: 800, fontSize: 16, marginTop: 14 }}>{c.name}</div>
            <div className="cc-en" style={{ fontFamily: mono, fontSize: 9.5, letterSpacing: "1px", color: c.color, marginTop: 2 }}>{c.nameEn}</div>
            <div className="cc-d" style={{ fontSize: 11.5, color: "#76726b", lineHeight: 1.5, marginTop: 9 }}>{CORNER_SHORT[c.key] ?? c.desc}</div>
          </Link>
        ))}
      </div>
    </section>
  );
}

/* 중립 선언 밴드 (잉크) */
export function NeutralBand() {
  return (
    <section style={{ background: "#16140f", color: "#f3efe9" }}>
      <div className="mz-wrap" style={{ paddingTop: 46, paddingBottom: 46, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 32, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <span style={{ width: 50, height: 50, borderRadius: 9999, border: "2px solid #ff5a3c", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="#ff5a3c" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </span>
          <div>
            <div style={{ fontFamily: serif, fontWeight: 700, fontSize: 24, letterSpacing: "-0.5px" }}>{CATCH.lonely.lead}</div>
            <div style={{ fontSize: 13.5, color: "#a89e8d", marginTop: 5 }}>{CATCH.lonely.sub} · <span style={{ color: "#ff8a6f" }}>{CATCH.lonely.hi}</span></div>
          </div>
        </div>
        <Link href="/magazine" style={{ fontWeight: 700, fontSize: 14, color: "#16140f", background: "#ff5a3c", padding: "11px 24px", borderRadius: 8, whiteSpace: "nowrap", textDecoration: "none" }}>전체 가이드 →</Link>
      </div>
    </section>
  );
}

/* 푸터 (딥 잉크) */
export function MagazineFooter() {
  return (
    <footer style={{ background: "#0f0e0a", color: "#8a857c" }}>
      <div className="mz-wrap" style={{ paddingTop: 30, paddingBottom: 30, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20, flexWrap: "wrap" }}>
        <nav style={{ display: "flex", gap: 20, fontFamily: mono, fontSize: 11, letterSpacing: "0.5px", flexWrap: "wrap" }}>
          <Link href="/" style={{ color: "#cdc6ba", textDecoration: "none" }}>오늘의딜 홈</Link>
          <Link href="/magazine" style={{ color: "#cdc6ba", textDecoration: "none" }}>매거진</Link>
          <Link href="/terms" style={{ color: "#8a857c", textDecoration: "none" }}>이용약관</Link>
          <Link href="/privacy" style={{ color: "#8a857c", textDecoration: "none" }}>개인정보처리방침</Link>
        </nav>
        <div style={{ fontFamily: mono, fontSize: 11 }}>© 2026 TODAYDEALS. All rights reserved.</div>
      </div>
    </footer>
  );
}

/* 정직성 배지 — 상세 글 상단 */
export function HonestyBadge() {
  return (
    <div style={{ border: "1px solid rgba(22,20,15,0.12)", background: "#faf7f1", borderRadius: 12, padding: "14px 16px", display: "flex", alignItems: "center", gap: 13, margin: "22px 0 28px" }}>
      <span style={{ width: 34, height: 34, borderRadius: 9999, border: "2px solid #ff5a3c", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="#ff5a3c" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </span>
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#16140f", lineHeight: 1.5 }}>이 글은 끝까지 읽어도 특정 제품을 추천하지 않습니다.</div>
        <div style={{ fontSize: 12, color: "#76726b", lineHeight: 1.5 }}>소비자의 바른 선택, 그 방향만 제시합니다.</div>
      </div>
      <span style={{ marginLeft: "auto", flex: "none", fontFamily: mono, fontSize: 9.5, fontWeight: 600, color: "#ff5a3c", border: "1px solid #f3c3b4", borderRadius: 9999, padding: "4px 8px" }}>AD-FREE</span>
    </div>
  );
}

/* ● 코너명 (모노 점 라벨) */
export function CornerDot({ cornerKey }: { cornerKey: string }) {
  const c = cornerOf(cornerKey);
  return <span style={{ fontFamily: mono, fontSize: 11, fontWeight: 700, letterSpacing: ".5px", color: c.color, whiteSpace: "nowrap" }}>● {c.name}</span>;
}

/* 분야 알약 */
export function FieldPill({ field }: { field?: string }) {
  if (!field) return null;
  return <span style={{ fontSize: 11.5, fontWeight: 500, color: "#46433d", background: "#e8e1d5", borderRadius: 9999, padding: "4px 12px" }}>{field}</span>;
}

/* 피처드 이미지 슬롯 (타이포 플레이스홀더) */
export function FeaturedImageSlot({ cornerKey }: { cornerKey: string }) {
  const c = cornerOf(cornerKey);
  const wm = c.nameEn.split(" ")[0];
  return (
    <div style={{ aspectRatio: "4 / 3", background: "linear-gradient(140deg,#ece5d9,#ddd4c5)", border: "1px solid #d6cdbe", display: "flex", alignItems: "flex-end", padding: 22, position: "relative", overflow: "hidden" }}>
      <span style={{ position: "absolute", top: 16, right: 20, fontFamily: mono, fontSize: 56, fontWeight: 700, color: "rgba(22,20,15,.07)", lineHeight: 0.8, letterSpacing: "-1px" }}>{wm}</span>
      <span style={{ fontFamily: mono, fontSize: 11, color: "#a89e8d" }}>{c.name} · 오늘의딜 매거진</span>
    </div>
  );
}
