// 잠자리연구소 전용 푸터 — 제휴 마케팅 고지 없음(딜 아님). 중립 미디어 정체성 + 오늘의딜 연결.
import Link from "next/link";

const mono = "'JetBrains Mono', monospace";

export default function SleepFooter() {
  return (
    <footer style={{ background: "#0f0e0a", color: "#8a857c" }}>
      <div className="mz-wrap" style={{ paddingTop: 34, paddingBottom: 34 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 24, flexWrap: "wrap", alignItems: "flex-start" }}>
          <div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 9 }}>
              <span style={{ fontWeight: 800, fontSize: 18, color: "#f3efe9", letterSpacing: "-0.5px" }}>잠자리연구소</span>
              <span style={{ fontFamily: mono, fontSize: 11, letterSpacing: "1.5px", color: "#8a857c" }}>SLEEP LAB</span>
            </div>
            <div style={{ fontSize: 12.5, color: "#8a857c", marginTop: 10, lineHeight: 1.6, maxWidth: 460 }}>
              광고도 협찬도 받지 않고, 해외 수면 연구를 근거로 검증하는 중립 수면 미디어입니다.
            </div>
            <div style={{ fontSize: 12, color: "#6f6a60", marginTop: 8 }}>문의 hello@todaydeals.co.kr</div>
          </div>
          <nav style={{ display: "flex", gap: 18, fontFamily: mono, fontSize: 11.5, flexWrap: "wrap" }}>
            <Link href="/goodsleep" style={{ color: "#cdc6ba", textDecoration: "none" }}>잠자리연구소</Link>
            <a href="https://www.todaydeals.co.kr" style={{ color: "#cdc6ba", textDecoration: "none" }}>오늘의딜</a>
            <Link href="/terms" style={{ color: "#8a857c", textDecoration: "none" }}>이용약관</Link>
            <Link href="/privacy" style={{ color: "#8a857c", textDecoration: "none" }}>개인정보처리방침</Link>
          </nav>
        </div>
        <div style={{ fontFamily: mono, fontSize: 11, color: "#6f6a60", marginTop: 24, borderTop: "1px solid #262320", paddingTop: 18 }}>
          © 2026 잠자리연구소 · 오늘의딜. 광고 0 · 협찬 0 · 논문 근거.
        </div>
      </div>
    </footer>
  );
}
