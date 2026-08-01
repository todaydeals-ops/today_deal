// 잠자리연구소 전용 헤더 — 오늘의딜 헤더와 동일한 높이(62px)·정렬. 로고는 Pretendard.
import Link from "next/link";
import { SLEEP_CATEGORIES } from "@/lib/magazine/sleepCategories";

const mono = "'JetBrains Mono', monospace";

export default function SleepHeader() {
  return (
    <header style={{ background: "#fff", borderBottom: "1px solid #ece8e0", position: "sticky", top: 0, zIndex: 10 }}>
      <div className="mz-wrap" style={{ height: 62, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14 }}>
        <Link href="/goodsleep" style={{ display: "flex", alignItems: "baseline", gap: 10, textDecoration: "none", color: "#16140f", flexShrink: 0 }}>
          <span style={{ fontWeight: 800, fontSize: 23, letterSpacing: "-0.6px", whiteSpace: "nowrap" }}>잠자리연구소</span>
          <span style={{ fontFamily: mono, fontSize: 11, letterSpacing: "1.5px", fontWeight: 700, color: "#76726b", borderLeft: "1px solid #c8c0b3", paddingLeft: 10 }}>SLEEP LAB</span>
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
