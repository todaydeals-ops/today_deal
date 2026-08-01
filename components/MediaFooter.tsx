import Link from "next/link";

// 오늘의딜 미디어(매거진·홈) 푸터 — 2톤: 다크 밴드(방향) + 라이트 정보/링크. 제휴 마케팅 고지 없음.
// 제휴 고지가 필요한 실제 딜페이지(/deals·/deal·/recommended·/board 등)는 Footer 사용.
const mono = "'JetBrains Mono', monospace";
const serif = "'Noto Serif KR', serif";

export default function MediaFooter() {
  return (
    <footer>
      <div style={{ background: "#0f0e0a", color: "#8a857c" }}>
        <div className="wrap" style={{ paddingTop: 42, paddingBottom: 40 }}>
          <div style={{ fontWeight: 800, fontSize: 19, color: "#f3efe9", letterSpacing: "-0.5px" }}>오늘의딜<span style={{ color: "#ff8a6f" }}>.</span></div>
          <div style={{ fontFamily: serif, fontSize: 23, fontWeight: 700, color: "#f3efe9", letterSpacing: "-0.5px", marginTop: 14, lineHeight: 1.4 }}>
            광고가 끝나는 곳에서, <span style={{ color: "#ff8a6f" }}>기준</span>이 시작됩니다.
          </div>
        </div>
      </div>
      <div style={{ borderTop: "1px solid var(--border-soft)" }}>
        <div className="wrap" style={{ paddingTop: 24, paddingBottom: 34, display: "flex", justifyContent: "space-between", gap: 20, flexWrap: "wrap" }}>
          <div style={{ fontFamily: mono, fontSize: 12, color: "var(--text-muted)", lineHeight: 1.7 }}>
            오늘의딜 콘텐츠팀 · 매거진 편집국<br />
            문의 hello@todaydeals.co.kr<br />
            © 2026 오늘의딜
          </div>
          <nav style={{ display: "flex", gap: 18, fontSize: 12, flexWrap: "wrap", height: "fit-content" }}>
            <Link href="/" style={{ color: "var(--text-body)", textDecoration: "none" }}>매거진</Link>
            <a href="https://goodsleep.todaydeals.co.kr" style={{ color: "var(--text-body)", textDecoration: "none" }}>잠자리연구소</a>
            <Link href="/terms" style={{ color: "var(--text-body)", textDecoration: "none" }}>이용약관</Link>
            <Link href="/privacy" style={{ color: "var(--text-body)", textDecoration: "none" }}>개인정보처리방침</Link>
            <Link href="/partnership" style={{ color: "var(--text-body)", textDecoration: "none" }}>제휴문의</Link>
            <Link href="/admin" style={{ color: "var(--text-muted)", opacity: 0.5, textDecoration: "none" }}>admin</Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
