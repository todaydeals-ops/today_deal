import Link from "next/link";
import { SUB_ORIGIN } from "@/lib/magazine/subdomain";
import BrandFamily from "@/components/BrandFamily";

// AS연구소 푸터 — 2톤: 위 다크 밴드(방향 강조) + 아래 라이트 정보/링크. 제휴고지 없음(딜 페이지 전용).
const mono = "'Pretendard', -apple-system, BlinkMacSystemFont, sans-serif";
const serif = "'Noto Serif KR', serif";

export default function B4asFooter() {
  return (
    <footer>
      <div style={{ background: "#0f0e0a", color: "#8a857c" }}>
        <div className="mz-wrap" style={{ paddingTop: 42, paddingBottom: 40 }}>
          <div style={{ fontWeight: 800, fontSize: 19, color: "#f3efe9", letterSpacing: "-0.5px" }}>AS연구소</div>
          <div style={{ fontFamily: serif, fontSize: 23, fontWeight: 700, color: "#f3efe9", letterSpacing: "-0.5px", marginTop: 14, lineHeight: 1.4 }}>
            부르기 전에 <span style={{ color: "#ff8a6f" }}>5분</span>, 직접 해볼 수 있는 것부터.
          </div>
          <div style={{ fontSize: 13.5, color: "#a8a298", marginTop: 12, lineHeight: 1.7, maxWidth: 560 }}>
            증상별로 무엇을 먼저 확인하고, 어디까지 직접 해도 되는지, 언제 기사님을 불러야 하는지 정리합니다.
          </div>
        </div>
      </div>
      <div style={{ borderTop: "1px solid var(--border-soft)" }}>
        <div className="mz-wrap" style={{ paddingTop: 24, paddingBottom: 34, display: "flex", justifyContent: "space-between", gap: 20, flexWrap: "wrap" }}>
          <div style={{ fontFamily: mono, fontSize: 12, color: "var(--text-muted)", lineHeight: 1.7 }}>
            AS연구소<br />
            문의 hello@todaydeals.co.kr<br />
            © 2026 AS연구소 · 오늘의딜
          </div>
          <nav style={{ display: "flex", gap: 18, fontSize: 12, flexWrap: "wrap", height: "fit-content" }}>
            <a href={SUB_ORIGIN.b4as} style={{ color: "var(--text-body)", textDecoration: "none" }}>AS연구소</a>
            <Link href="/terms" style={{ color: "var(--text-body)", textDecoration: "none" }}>이용약관</Link>
            <Link href="/privacy" style={{ color: "var(--text-body)", textDecoration: "none" }}>개인정보처리방침</Link>
          </nav>
        </div>
        <div className="mz-wrap" style={{ paddingBottom: 34 }}>
          <BrandFamily current="b4as" />
        </div>
      </div>
    </footer>
  );
}
