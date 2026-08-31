import Link from "next/link";
import { SUB_ORIGIN } from "@/lib/magazine/subdomain";
import BrandFamily from "@/components/BrandFamily";

// 성분연구소 푸터 — 2톤: 위 다크 밴드(방향 강조) + 아래 라이트 정보/링크. 제휴고지 없음(딜 페이지 전용).
const mono = "'Pretendard', -apple-system, BlinkMacSystemFont, sans-serif";
const serif = "'Noto Serif KR', serif";

export default function BeautyFooter() {
  return (
    <footer>
      <div style={{ background: "#0f0e0a", color: "#8a857c" }}>
        <div className="mz-wrap" style={{ paddingTop: 42, paddingBottom: 40 }}>
          <div style={{ fontWeight: 800, fontSize: 19, color: "#f3efe9", letterSpacing: "-0.5px" }}>성분연구소</div>
          <div style={{ fontFamily: serif, fontSize: 23, fontWeight: 700, color: "#f3efe9", letterSpacing: "-0.5px", marginTop: 14, lineHeight: 1.4 }}>
            성분을 알면, <span style={{ color: "#ff8a6f" }}>선택</span>이 쉬워집니다.
          </div>
          <div style={{ fontSize: 13.5, color: "#a8a298", marginTop: 12, lineHeight: 1.7, maxWidth: 560 }}>
            화제성이나 후기가 아니라, 그 성분이 임상에서 무엇을 증명했는지로 따집니다.
          </div>
        </div>
      </div>
      <div style={{ borderTop: "1px solid var(--border-soft)" }}>
        <div className="mz-wrap" style={{ paddingTop: 24, paddingBottom: 20, display: "flex", justifyContent: "space-between", gap: 20, flexWrap: "wrap" }}>
          <div style={{ fontFamily: mono, fontSize: 12, color: "var(--text-muted)", lineHeight: 1.7 }}>
            성분연구소<br />
            문의 hello@todaydeals.co.kr<br />
            © 2026 성분연구소 · 오늘의딜
          </div>
          <nav style={{ display: "flex", gap: 18, fontSize: 12, flexWrap: "wrap", height: "fit-content" }}>
            <a href={SUB_ORIGIN.beauty} style={{ color: "var(--text-body)", textDecoration: "none" }}>성분연구소</a>
            <Link href="/terms" style={{ color: "var(--text-body)", textDecoration: "none" }}>이용약관</Link>
            <Link href="/privacy" style={{ color: "var(--text-body)", textDecoration: "none" }}>개인정보처리방침</Link>
          </nav>
        </div>
        <div className="mz-wrap" style={{ paddingBottom: 34 }}>
          <BrandFamily current="beauty" />
        </div>
      </div>
    </footer>
  );
}
