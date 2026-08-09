// 알약연구소 전용 헤더 — 오늘의딜·잠자리연구소와 동일한 높이(62px)·정렬. 로고 Pretendard.
// ★링크는 SUB_ORIGIN 절대 URL 하나로 통일(어디서 렌더돼도 pill.todaydeals.co.kr로 간다).
import { PILL_CATEGORIES } from "@/lib/magazine/pillCategories";
import { pillHref } from "@/lib/magazine/subdomain";

export default async function PillHeader() {
  return (
    <header style={{ background: "#fff", borderBottom: "1px solid #ece8e0", position: "sticky", top: 0, zIndex: 10 }}>
      <div className="mz-wrap" style={{ height: 62, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14 }}>
        <a href={pillHref()} style={{ textDecoration: "none", color: "#16140f", flexShrink: 0 }}>
          <span style={{ fontWeight: 800, fontSize: 23, letterSpacing: "-0.6px", whiteSpace: "nowrap" }}>알약연구소</span>
        </a>
        <nav style={{ display: "flex", alignItems: "center", gap: 20, fontSize: 14, overflowX: "auto" }}>
          {PILL_CATEGORIES.map((c) => (
            <a key={c.key} href={pillHref(c.key)} style={{ color: "#5b564d", textDecoration: "none", whiteSpace: "nowrap" }}>{c.label}</a>
          ))}
        </nav>
      </div>
    </header>
  );
}
