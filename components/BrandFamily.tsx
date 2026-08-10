// 브랜드 패밀리 블록 — 오늘의딜 / 잠자리 / 알약 / 성분 / AS연구소를 서로 안내한다.
// 모든 푸터에 공통으로 넣어 사이트끼리 유기적으로 연결한다.
// 브랜드 정의(이름·카피·주소·색)는 lib/brands.ts 한 곳에서만 관리한다 — 교차유도 팝업도 같은 걸 쓴다.
import { BRANDS, type BrandKey } from "@/lib/brands";

export type { BrandKey };

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
