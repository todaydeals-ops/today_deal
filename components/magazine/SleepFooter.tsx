import Link from "next/link";

// 잠자리연구소 푸터 — 다크 밴드로 방향 한 번 더 강조. 제휴 마케팅 고지 없음(딜 아님).
const mono = "'JetBrains Mono', monospace";
const serif = "'Noto Serif KR', serif";

export default function SleepFooter() {
  return (
    <footer style={{ background: "#0f0e0a", color: "#8a857c" }}>
      <div className="mz-wrap" style={{ paddingTop: 42, paddingBottom: 34 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
          <span style={{ fontWeight: 800, fontSize: 19, color: "#f3efe9", letterSpacing: "-0.5px" }}>잠자리연구소</span>
          <span style={{ fontFamily: mono, fontSize: 11, letterSpacing: "1.5px", color: "#8a857c" }}>SLEEP LAB</span>
        </div>
        <div style={{ fontFamily: serif, fontSize: 23, fontWeight: 700, color: "#f3efe9", letterSpacing: "-0.5px", marginTop: 15, lineHeight: 1.4 }}>
          광고 말고, <span style={{ color: "#ff8a6f" }}>논문</span>으로 검증하는 잠.
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 20, flexWrap: "wrap", marginTop: 28, borderTop: "1px solid #262320", paddingTop: 20 }}>
          <div style={{ fontFamily: mono, fontSize: 11.5, color: "#6f6a60", lineHeight: 1.75 }}>
            잠자리연구소 · 오늘의딜 매거진<br />
            문의 hello@todaydeals.co.kr<br />
            © 2026 잠자리연구소 · 오늘의딜
          </div>
          <nav style={{ display: "flex", gap: 18, fontFamily: mono, fontSize: 11.5, flexWrap: "wrap", height: "fit-content" }}>
            <Link href="/goodsleep" style={{ color: "#cdc6ba", textDecoration: "none" }}>잠자리연구소</Link>
            <a href="https://www.todaydeals.co.kr" style={{ color: "#cdc6ba", textDecoration: "none" }}>오늘의딜</a>
            <Link href="/terms" style={{ color: "#8a857c", textDecoration: "none" }}>이용약관</Link>
            <Link href="/privacy" style={{ color: "#8a857c", textDecoration: "none" }}>개인정보처리방침</Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
