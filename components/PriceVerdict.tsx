import type { PriceCompare, PriceCompareRef } from "@/lib/types";

// AI 쇼핑 진단 딱지 — 같은 상품을 네이버/쿠팡 최저가와 대조한 결과를 3단계로.
//   🔥 강추  = 네이버보다 뚜렷이 쌈(위너)
//   👍 추천  = 더 싸거나 최저가 수준
//   🔎 확인필요 = 더 비싸거나 / 우리가 동일상품을 확인 못 함 (기본값)
// 모든 상품이 셋 중 하나 → "AI가 개입·선별한 상품" 성립.

const MALL_KR = { naver: "네이버", coupang: "쿠팡" } as const;

// 🔥 강추(위너) 기준 — 정밀도 우선. 과한 절약률은 오매칭 의심이라 상한 컷.
const WIN_MIN_PCT = 15;
const WIN_MAX_PCT = 40;
const WIN_MIN_N = 2;

export type VerdictTier = "강추" | "추천" | "확인필요";

interface Entry { mall: "naver" | "coupang"; data: PriceCompareRef }
function entries(pc?: PriceCompare): Entry[] {
  const out: Entry[] = [];
  if (pc?.naver) out.push({ mall: "naver", data: pc.naver });
  if (pc?.coupang) out.push({ mall: "coupang", data: pc.coupang });
  return out;
}
function bestRec(es: Entry[], ourPrice: number) {
  let best: { pct: number; n: number; mall: "naver" | "coupang" } | null = null;
  for (const e of es) {
    if (e.data.verdict !== "추천" || !e.data.ref) continue;
    const pct = Math.round(((e.data.ref - ourPrice) / e.data.ref) * 100);
    if (!best || pct > best.pct) best = { pct, n: e.data.n, mall: e.mall };
  }
  return best;
}

// 모든 상품에 대해 셋 중 하나를 반환(기본 확인필요).
export function verdictOf(pc: PriceCompare | undefined, ourPrice: number): { tier: VerdictTier; pct?: number } {
  const es = entries(pc);
  const best = bestRec(es, ourPrice);
  if (best && best.pct >= WIN_MIN_PCT && best.pct <= WIN_MAX_PCT && best.n >= WIN_MIN_N) {
    return { tier: "강추", pct: best.pct };
  }
  if (es.some((e) => e.data.verdict === "추천")) return { tier: "추천", pct: best?.pct };
  if (es.some((e) => e.data.verdict === "비슷")) return { tier: "추천" };
  return { tier: "확인필요" };
}
// 정렬용 — 강추 0 → 추천 1 → 확인필요 2
export function verdictRank(pc: PriceCompare | undefined, ourPrice: number): number {
  const t = verdictOf(pc, ourPrice).tier;
  return t === "강추" ? 0 : t === "추천" ? 1 : 2;
}

// 디지털/네온 팔레트 — 다크 칩 위 밝은 색(이미지 위에서도 잘 보임)
const TONE: Record<VerdictTier, { c: string }> = {
  강추: { c: "#FFC53D" }, // 앰버
  추천: { c: "#2DE08A" }, // 네온 그린
  확인필요: { c: "#AEB4BA" }, // 쿨 그레이
};
const MONO = '"JetBrains Mono", ui-monospace, "SFMono-Regular", Menlo, monospace';

// 다크 칩 한 개 — 지정 tier로 렌더(카드 배지·범례 공용).
export function BadgeChip({ tier }: { tier: VerdictTier }) {
  const col = TONE[tier].c;
  return (
    <span
      style={{
        display: "inline-flex", alignItems: "center", gap: 5,
        background: "rgba(16,15,12,0.92)", color: col,
        fontFamily: MONO, fontSize: 10.5, fontWeight: 700, lineHeight: 1.1,
        padding: "4px 8px", borderRadius: 5, letterSpacing: "0.02em",
        border: `1px solid ${col}59`, boxShadow: "0 1px 5px rgba(0,0,0,0.4)",
        whiteSpace: "nowrap",
      }}
      title="AI 쇼핑 분석 — 네이버/쿠팡 최저가 대비"
    >
      <span aria-hidden style={{ width: 6, height: 6, borderRadius: "50%", background: col, boxShadow: `0 0 6px ${col}`, flexShrink: 0 }} />
      <span>AI분석 · {tier}</span>
    </span>
  );
}

// 컴팩트(카드용) — 상품 판정으로 칩 표시. 모든 카드에 항상 표시.
export function PriceVerdictBadge({ pc, ourPrice }: { pc?: PriceCompare; ourPrice: number }) {
  return <BadgeChip tier={verdictOf(pc, ourPrice).tier} />;
}

// 범례(피드 상단) — 3개 배지를 실제 이미지로 + 설명 3줄.
export function PriceVerdictLegend() {
  const items: { tier: VerdictTier; desc: string }[] = [
    { tier: "강추", desc: "네이버·쿠팡보다 확실히 저렴해요" },
    { tier: "추천", desc: "더 싸거나 최저가 수준이에요" },
    { tier: "확인필요", desc: "평상시 할인과 비슷해요 — 직접 확인하세요" },
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 6 }}>
      {items.map((it) => (
        <div key={it.tier} style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <span style={{ flexShrink: 0, minWidth: 96 }}><BadgeChip tier={it.tier} /></span>
          <span style={{ fontSize: 12.5, color: "#6F6B64", lineHeight: 1.3 }}>{it.desc}</span>
        </div>
      ))}
    </div>
  );
}

// 풀버전(상세페이지용) — 몰별 최저가·판정 + 면책. 매칭 데이터 없으면 확인필요 안내.
export function PriceVerdictDetail({ pc, ourPrice }: { pc?: PriceCompare; ourPrice: number }) {
  const es = entries(pc);
  const { tier } = verdictOf(pc, ourPrice);
  const col = TONE[tier].c;

  return (
    <div style={{ border: "1px solid #EFECE7", borderRadius: 14, padding: "14px 16px", background: "#FCFBF9" }}>
      <div style={{ marginBottom: 12 }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(16,15,12,0.95)", color: col, fontFamily: MONO, fontSize: 11, fontWeight: 700, padding: "5px 10px", borderRadius: 6, border: `1px solid ${col}59`, letterSpacing: "0.02em" }}>
          <span aria-hidden style={{ width: 6, height: 6, borderRadius: "50%", background: col, boxShadow: `0 0 6px ${col}` }} />
          AI 쇼핑분석 결과 · {tier}
        </span>
      </div>
      {es.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {es.map(({ mall, data }) => {
            const cheaper = data.verdict === "추천";
            const same = data.verdict === "비슷";
            const fg = cheaper ? "#1A8A5A" : same ? "#6F6B64" : "#B4452F";
            const diff = Math.round(((ourPrice - data.ref) / data.ref) * 100);
            const msg = same
              ? `${MALL_KR[mall]} 최저가와 비슷한 수준`
              : cheaper
              ? `${MALL_KR[mall]} 최저가(${data.ref.toLocaleString()}원)보다 저렴`
              : `${MALL_KR[mall]}가 ${data.ref.toLocaleString()}원으로 더 저렴`;
            return (
              <div key={mall} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                <span style={{ fontSize: 13.5, color: "#33312D" }}>{msg}</span>
                <span style={{ fontSize: 12.5, fontWeight: 800, color: fg, whiteSpace: "nowrap" }}>
                  {same ? "비슷" : cheaper ? `${diff}%↓` : `+${diff}%`}
                </span>
              </div>
            );
          })}
        </div>
      ) : (
        <p style={{ fontSize: 13.5, color: "#33312D", margin: 0 }}>동일 상품을 찾지 못해 가격 비교를 확인하지 못했어요. 구매 전 한 번 확인해 보세요.</p>
      )}
      <p style={{ fontSize: 10.5, color: "#9A958C", marginTop: 10, lineHeight: 1.5 }}>
        AI가 동일·유사 상품의 공개 검색 최저가와 비교한 추정치예요. 분석 시점·옵션·용량에 따라 실제 가격과 다를 수 있어요.
      </p>
    </div>
  );
}
