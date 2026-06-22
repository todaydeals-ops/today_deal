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

const TONE: Record<VerdictTier, { bg: string; fg: string; icon: string }> = {
  강추: { bg: "#FFF1D6", fg: "#A66A00", icon: "🔥" },
  추천: { bg: "#E8F5EE", fg: "#1A8A5A", icon: "👍" },
  확인필요: { bg: "#F0EEEA", fg: "#7A766E", icon: "🔎" },
};

// 컴팩트(카드용) — 모든 카드에 항상 표시.
export function PriceVerdictBadge({ pc, ourPrice }: { pc?: PriceCompare; ourPrice: number }) {
  const { tier, pct } = verdictOf(pc, ourPrice);
  const c = TONE[tier];
  const text = (tier === "강추" || tier === "추천") && typeof pct === "number" && pct > 0 ? `${tier} ${pct}%↓` : tier;
  return (
    <span
      style={{
        display: "inline-flex", alignItems: "center", gap: 4,
        background: c.bg, color: c.fg,
        fontSize: 11, fontWeight: 800, lineHeight: 1.2,
        padding: "4px 8px", borderRadius: 999, letterSpacing: "-0.01em", maxWidth: "100%",
      }}
      title="AI 쇼핑 진단 — 네이버/쿠팡 최저가 대비"
    >
      <span aria-hidden style={{ flexShrink: 0 }}>{c.icon}</span>
      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{text}</span>
    </span>
  );
}

// 풀버전(상세페이지용) — 몰별 최저가·판정 + 면책. 매칭 데이터 없으면 확인필요 안내.
export function PriceVerdictDetail({ pc, ourPrice }: { pc?: PriceCompare; ourPrice: number }) {
  const es = entries(pc);
  const { tier } = verdictOf(pc, ourPrice);
  const c = TONE[tier];

  return (
    <div style={{ border: `1px solid ${tier === "강추" ? "#F0D79A" : "#EFECE7"}`, borderRadius: 14, padding: "14px 16px", background: tier === "강추" ? "#FFFBF2" : "#FCFBF9" }}>
      <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.04em", color: c.fg, marginBottom: 10 }}>
        {c.icon} AI 쇼핑 진단 — {tier}
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
