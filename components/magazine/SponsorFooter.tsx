import Link from "next/link";
import { SUB_ORIGIN } from "@/lib/magazine/subdomain";
import BrandFamily from "@/components/BrandFamily";

// 협찬연구소 푸터 — 다른 버티컬과 같은 2톤 구조.
// ★정정 창구를 푸터가 아니라 잘 보이는 곳에 둔다. 방송사·제작사 반론을 받는 통로가
//   있다는 사실 자체가 이 미디어의 성격을 규정한다.
const mono = "'Pretendard', -apple-system, BlinkMacSystemFont, sans-serif";
const serif = "'Noto Serif KR', serif";

export default function SponsorFooter() {
  return (
    <footer>
      <div style={{ background: "#0f0e0a", color: "#8a857c" }}>
        <div className="mz-wrap" style={{ paddingTop: 42, paddingBottom: 40 }}>
          <div style={{ fontWeight: 800, fontSize: 19, color: "#f3efe9", letterSpacing: "-0.5px" }}>협찬연구소</div>
          <div style={{ fontFamily: serif, fontSize: 23, fontWeight: 700, color: "#f3efe9", letterSpacing: "-0.5px", marginTop: 14, lineHeight: 1.4 }}>
            같은 날, <span style={{ color: "#ff8a6f" }}>같은 원료</span>. 시각만 나란히 놓습니다.
          </div>
          <div style={{ fontSize: 13.5, color: "#a8a298", marginTop: 12, lineHeight: 1.7, maxWidth: 620 }}>
            방송 편성은 공개 정보입니다. 평가하지 않고 결론을 쓰지 않습니다. 무엇을 보고 무엇을 판단할지는 읽는 분의 몫입니다.
          </div>
          <div style={{ fontSize: 12.5, color: "#8a857c", marginTop: 18, lineHeight: 1.7, borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: 16, maxWidth: 620 }}>
            <b style={{ color: "#c9c3b8" }}>정정과 반론</b><br />
            기록에 사실과 다른 부분이 있으면 알려주세요. 확인되는 대로 고치고, 무엇을 언제 고쳤는지 함께 남깁니다.
            방송사·제작사·출연자의 설명도 같은 자리에 싣습니다. correction@todaydeals.co.kr
          </div>
        </div>
      </div>
      <div style={{ borderTop: "1px solid var(--border-soft)" }}>
        <div className="mz-wrap" style={{ paddingTop: 24, paddingBottom: 20, display: "flex", justifyContent: "space-between", gap: 20, flexWrap: "wrap" }}>
          <div style={{ fontFamily: mono, fontSize: 12, color: "var(--text-muted)", lineHeight: 1.7 }}>
            협찬연구소<br />
            정정·반론 correction@todaydeals.co.kr<br />
            © 2026 협찬연구소 · 오늘의딜
          </div>
          <nav style={{ display: "flex", gap: 18, fontSize: 12, flexWrap: "wrap", height: "fit-content" }}>
            <a href={SUB_ORIGIN.sponsor} style={{ color: "var(--text-body)", textDecoration: "none" }}>협찬연구소</a>
            <Link href="/terms" style={{ color: "var(--text-body)", textDecoration: "none" }}>이용약관</Link>
            <Link href="/privacy" style={{ color: "var(--text-body)", textDecoration: "none" }}>개인정보처리방침</Link>
          </nav>
        </div>
        <div className="mz-wrap" style={{ paddingBottom: 34 }}>
          <BrandFamily current="sponsor" />
        </div>
      </div>
    </footer>
  );
}
