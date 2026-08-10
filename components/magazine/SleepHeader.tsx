// 잠자리연구소 전용 헤더 — 오늘의딜 헤더와 동일한 높이(62px)·정렬. 로고 Pretendard.
import { SUB_ORIGIN } from "@/lib/magazine/subdomain";
// 서브도메인(goodsleep.todaydeals.co.kr) 루트가 /goodsleep로 rewrite되므로, 링크는 루트 절대 URL로.
import { SLEEP_CATEGORIES } from "@/lib/magazine/sleepCategories";

const GS = SUB_ORIGIN.sleep;

export default function SleepHeader() {
  return (
    <header style={{ background: "#fff", borderBottom: "1px solid #ece8e0", position: "sticky", top: 0, zIndex: 10 }}>
      <div className="mz-wrap" style={{ height: 62, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14 }}>
        <a href={`${GS}/`} style={{ textDecoration: "none", color: "#16140f", flexShrink: 0 }}>
          <span style={{ fontWeight: 800, fontSize: 23, letterSpacing: "-0.6px", whiteSpace: "nowrap" }}>잠자리연구소</span>
        </a>
        <nav className="sub-nav">
          {SLEEP_CATEGORIES.map((c) => (
            <a key={c.key} href={`${GS}/?cat=${c.key}`} style={{ color: "#5b564d", textDecoration: "none", whiteSpace: "nowrap" }}>{c.label}</a>
          ))}
        </nav>
      </div>
    </header>
  );
}
