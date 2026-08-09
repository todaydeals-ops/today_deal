import Link from "next/link";
import { SUB_ORIGIN } from "@/lib/magazine/subdomain";
import BrandFamily from "@/components/BrandFamily";

// 알약연구소 푸터 — 2톤: 위 다크 밴드(방향 강조) + 아래 라이트 정보/링크. 제휴고지 없음(딜 페이지 전용).
const mono = "'Pretendard', -apple-system, BlinkMacSystemFont, sans-serif";
const serif = "'Noto Serif KR', serif";

export default function PillFooter() {
  return (
    <footer>
      <div style={{ background: "#0f0e0a", color: "#8a857c" }}>
        <div className="mz-wrap" style={{ paddingTop: 42, paddingBottom: 40 }}>
          <div style={{ fontWeight: 800, fontSize: 19, color: "#f3efe9", letterSpacing: "-0.5px" }}>알약연구소</div>
          <div style={{ fontFamily: serif, fontSize: 23, fontWeight: 700, color: "#f3efe9", letterSpacing: "-0.5px", marginTop: 14, lineHeight: 1.4 }}>
            먹을 것과 굳이 안 먹어도 될 것을, <span style={{ color: "#ff8a6f" }}>임상</span>으로 가릅니다.
          </div>
          <div style={{ fontSize: 13.5, color: "#a8a298", marginTop: 12, lineHeight: 1.7, maxWidth: 560 }}>
            광고 문구가 아니라 실제 연구 결과를 기준으로, 성분 하나하나 따져서 정리합니다.
          </div>
        </div>
      </div>
      <div style={{ borderTop: "1px solid var(--border-soft)" }}>
        <div className="mz-wrap" style={{ paddingTop: 24, paddingBottom: 34, display: "flex", justifyContent: "space-between", gap: 20, flexWrap: "wrap" }}>
          <div style={{ fontFamily: mono, fontSize: 12, color: "var(--text-muted)", lineHeight: 1.7 }}>
            알약연구소<br />
            문의 hello@todaydeals.co.kr<br />
            © 2026 알약연구소 · 오늘의딜
          </div>
          <nav style={{ display: "flex", gap: 18, fontSize: 12, flexWrap: "wrap", height: "fit-content" }}>
            <a href={SUB_ORIGIN.pill} style={{ color: "var(--text-body)", textDecoration: "none" }}>알약연구소</a>
            <Link href="/terms" style={{ color: "var(--text-body)", textDecoration: "none" }}>이용약관</Link>
            <Link href="/privacy" style={{ color: "var(--text-body)", textDecoration: "none" }}>개인정보처리방침</Link>
          </nav>
        </div>
        <div className="mz-wrap" style={{ paddingBottom: 34 }}>
          <BrandFamily current="pill" />
        </div>
      </div>
    </footer>
  );
}
