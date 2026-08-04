// 알약연구소 전용 헤더 — 오늘의딜·잠자리연구소와 동일한 높이(62px)·정렬. 로고 Pretendard.
// ★링크는 호스트 감지로 생성: 서브도메인이면 "/?cat=", 아니면 "/pill?cat=" (서브도메인 미연결 상태에서도 동작).
import { PILL_CATEGORIES } from "@/lib/magazine/pillCategories";
import { pillOnSubdomain, pillHref } from "@/lib/magazine/subdomain";

export default async function PillHeader() {
  const onSub = await pillOnSubdomain();
  return (
    <header style={{ background: "#fff", borderBottom: "1px solid #ece8e0", position: "sticky", top: 0, zIndex: 10 }}>
      <div className="mz-wrap" style={{ height: 62, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14 }}>
        <a href={pillHref(onSub)} style={{ textDecoration: "none", color: "#16140f", flexShrink: 0 }}>
          <span style={{ fontWeight: 800, fontSize: 23, letterSpacing: "-0.6px", whiteSpace: "nowrap" }}>알약연구소</span>
        </a>
        <nav style={{ display: "flex", alignItems: "center", gap: 20, fontSize: 14, overflowX: "auto" }}>
          {PILL_CATEGORIES.map((c) => (
            <a key={c.key} href={pillHref(onSub, c.key)} style={{ color: "#5b564d", textDecoration: "none", whiteSpace: "nowrap" }}>{c.label}</a>
          ))}
        </nav>
      </div>
    </header>
  );
}
