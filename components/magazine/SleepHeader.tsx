// 잠자리연구소(수면·침구 글) 전용 헤더 — 오늘의딜 헤더 대신, 잠자리연구소 정체성 + 고유 6분류 메뉴.
import Link from "next/link";
import { SLEEP_CATEGORIES } from "@/lib/magazine/sleepCategories";

const mono = "'JetBrains Mono', monospace";
const serif = "'Noto Serif KR', serif";

export default function SleepHeader() {
  return (
    <header style={{ borderBottom: "1px solid rgba(22,20,15,0.10)", background: "#fff" }}>
      <div className="mz-wrap" style={{ paddingTop: 15, paddingBottom: 13, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, flexWrap: "wrap" }}>
        <Link href="/goodsleep" style={{ display: "flex", alignItems: "baseline", gap: 10, textDecoration: "none", color: "#16140f", flexShrink: 0 }}>
          <span style={{ fontFamily: serif, fontWeight: 800, fontSize: 21, letterSpacing: "-0.5px", whiteSpace: "nowrap" }}>잠자리연구소</span>
          <span style={{ fontFamily: mono, fontSize: 11, letterSpacing: "1.5px", fontWeight: 700, color: "#76726b", borderLeft: "1px solid #c8c0b3", paddingLeft: 10 }}>SLEEP LAB</span>
        </Link>
        <nav style={{ display: "flex", alignItems: "center", gap: 15, flexWrap: "wrap", fontSize: 14 }}>
          {SLEEP_CATEGORIES.map((c) => (
            <Link key={c.key} href={`/goodsleep?cat=${c.key}`} style={{ color: "#5b564d", textDecoration: "none", whiteSpace: "nowrap" }}>{c.label}</Link>
          ))}
          <a href="https://www.todaydeals.co.kr" style={{ fontFamily: mono, fontSize: 11.5, color: "#9a9286", textDecoration: "none", whiteSpace: "nowrap", borderLeft: "1px solid #e4dccc", paddingLeft: 14 }}>오늘의딜 &rarr;</a>
        </nav>
      </div>
    </header>
  );
}
