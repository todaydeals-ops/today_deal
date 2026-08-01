// 잠자리연구소 전용 헤더 — 오늘의딜 헤더와 동일한 높이(62px)·정렬. 로고 Pretendard.
import Link from "next/link";
import { SLEEP_CATEGORIES } from "@/lib/magazine/sleepCategories";

export default function SleepHeader() {
  return (
    <header style={{ background: "#fff", borderBottom: "1px solid #ece8e0", position: "sticky", top: 0, zIndex: 10 }}>
      <div className="mz-wrap" style={{ height: 62, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14 }}>
        <Link href="/goodsleep" style={{ textDecoration: "none", color: "#16140f", flexShrink: 0 }}>
          <span style={{ fontWeight: 800, fontSize: 23, letterSpacing: "-0.6px", whiteSpace: "nowrap" }}>잠자리연구소</span>
        </Link>
        <nav style={{ display: "flex", alignItems: "center", gap: 20, fontSize: 14, overflowX: "auto" }}>
          {SLEEP_CATEGORIES.map((c) => (
            <Link key={c.key} href={`/goodsleep?cat=${c.key}`} style={{ color: "#5b564d", textDecoration: "none", whiteSpace: "nowrap" }}>{c.label}</Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
