// 브랜드 패밀리 블록 — 오늘의딜 / 잠자리연구소 / 알약연구소 / 성분연구소를 서로 안내한다.
// 모든 푸터(딜·매거진·잠자리·알약·성분)에 공통으로 넣어 사이트끼리 유기적으로 연결한다.
// 주소는 SUB_ORIGIN 한 곳에서만 관리한다(서브도메인 3개 모두 연결 완료).
import { SUB_ORIGIN } from "@/lib/magazine/subdomain";

type BrandKey = "deal" | "sleep" | "pill" | "beauty" | "b4as";

const BRANDS: { key: BrandKey; name: string; desc: string; url: string; color: string }[] = [
  { key: "deal", name: "오늘의딜", desc: "광고가 끝나는 곳에서 시작하는 기준", url: "https://www.todaydeals.co.kr", color: "#ff5a3c" },
  { key: "sleep", name: "잠자리연구소", desc: "논문으로 검증하는 잠", url: SUB_ORIGIN.sleep, color: "#3f5a54" },
  { key: "pill", name: "알약연구소", desc: "임상으로 따지는 영양제", url: SUB_ORIGIN.pill, color: "#8a6a3a" },
  { key: "beauty", name: "성분연구소", desc: "광고를 지우면 남는 성분", url: SUB_ORIGIN.beauty, color: "#8a5a6a" },
  { key: "b4as", name: "AS연구소", desc: "부르기 전 5분 셀프체크", url: SUB_ORIGIN.b4as, color: "#38539a" },
];

export default function BrandFamily({ current, dark = false }: { current: BrandKey; dark?: boolean }) {
  const label = dark ? "#8a857c" : "var(--text-muted)";
  const name = dark ? "#f3efe9" : "var(--text-body)";
  const desc = dark ? "#8a857c" : "var(--text-muted)";
  const line = dark ? "rgba(255,255,255,0.10)" : "var(--border-soft)";

  return (
    <div style={{ borderTop: `1px solid ${line}`, paddingTop: 20, marginTop: 4 }}>
      <div style={{ fontSize: 11, letterSpacing: "1.5px", color: label, fontWeight: 700, marginBottom: 14 }}>FAMILY</div>
      <div className="brand-family">
        {BRANDS.map((b) => {
          const isCurrent = b.key === current;
          const inner = (
            <>
              <span style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <span style={{ width: 7, height: 7, borderRadius: 9999, background: b.color, flex: "none" }} />
                <span style={{ fontSize: 13.5, fontWeight: 700, color: name }}>{b.name}</span>
                {isCurrent && <span style={{ fontSize: 10.5, color: desc, fontWeight: 500 }}>지금 보는 곳</span>}
              </span>
              <span style={{ display: "block", fontSize: 12, color: desc, lineHeight: 1.55, marginTop: 5 }}>{b.desc}</span>
            </>
          );
          return isCurrent ? (
            <div key={b.key} style={{ opacity: 0.72 }}>{inner}</div>
          ) : (
            <a key={b.key} href={b.url} style={{ textDecoration: "none", display: "block" }}>{inner}</a>
          );
        })}
      </div>
    </div>
  );
}
