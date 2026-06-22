import type { PriceCompare, PriceCompareRef } from "@/lib/types";

// AI 가격비교 진단 배지 — 같은 상품을 네이버/쿠팡 최저가와 대조한 결과.
// 정직 원칙: 우리가 비싸면 "더 싼 곳 있어요"도 그대로 노출(신뢰의 해자).

const MALL_KR = { naver: "네이버", coupang: "쿠팡" } as const;

// 🏆 위너("진짜 싸요") 기준 — 정밀도 우선. 너무 큰 절약률은 오매칭 의심이라 상한 컷.
const WIN_MIN_PCT = 15; // 최소 절약률(%)
const WIN_MAX_PCT = 40; // 상한(초과 시 등급/용량 불일치 의심)
const WIN_MIN_N = 4; // 매칭 신뢰도(밴드 내 후보 수)

interface Entry { mall: "naver" | "coupang"; data: PriceCompareRef }
function entries(pc: PriceCompare): Entry[] {
  const out: Entry[] = [];
  if (pc.naver) out.push({ mall: "naver", data: pc.naver });
  if (pc.coupang) out.push({ mall: "coupang", data: pc.coupang });
  return out;
}
// 최대 절약 추천 1건(있으면). pct=양수면 우리가 그만큼 저렴.
function bestRec(es: Entry[], ourPrice: number) {
  let best: { pct: number; n: number; mall: "naver" | "coupang" } | null = null;
  for (const e of es) {
    if (e.data.verdict !== "추천" || !e.data.ref) continue;
    const pct = Math.round(((e.data.ref - ourPrice) / e.data.ref) * 100);
    if (!best || pct > best.pct) best = { pct, n: e.data.n, mall: e.mall };
  }
  return best;
}
const isWinner = (b: ReturnType<typeof bestRec>) =>
  !!b && b.pct >= WIN_MIN_PCT && b.pct <= WIN_MAX_PCT && b.n >= WIN_MIN_N;

// 외부(피드 정렬)용 — 이 딜이 🏆 위너인지.
export function isPriceWinner(pc: PriceCompare | undefined, ourPrice: number): boolean {
  if (!pc) return false;
  return isWinner(bestRec(entries(pc), ourPrice));
}

// 컴팩트(카드용) — 한 줄 핵심만. 위너 > 추천 > 비추 > 비슷.
export function PriceVerdictBadge({ pc, ourPrice }: { pc?: PriceCompare; ourPrice: number }) {
  if (!pc) return null;
  const es = entries(pc);
  if (!es.length) return null;
  const malls = (v: string) => es.filter((e) => e.data.verdict === v).map((e) => MALL_KR[e.mall]).join("·");
  const best = bestRec(es, ourPrice);

  let tone: "winner" | "good" | "warn" | "neutral", text: string;
  if (isWinner(best)) {
    tone = "winner"; text = `진짜 싸요 ${best!.pct}%↓`;
  } else if (es.some((e) => e.data.verdict === "추천")) {
    tone = "good"; text = `${malls("추천")} 최저가보다 저렴`;
  } else if (es.some((e) => e.data.verdict === "비추")) {
    tone = "warn"; text = `${malls("비추")}가 더 저렴`;
  } else {
    tone = "neutral"; text = `${es.map((e) => MALL_KR[e.mall]).join("·")} 최저가 수준`;
  }

  const C = {
    winner: { bg: "#FFF1D6", fg: "#A66A00", dot: "#E8A317", icon: "🏆 " },
    good: { bg: "#E8F5EE", fg: "#1A8A5A", dot: "#1A8A5A", icon: "" },
    warn: { bg: "#FBEEEA", fg: "#B4452F", dot: "#B4452F", icon: "" },
    neutral: { bg: "#F0EEEA", fg: "#6F6B64", dot: "#9A958C", icon: "" },
  }[tone];

  return (
    <span
      style={{
        display: "inline-flex", alignItems: "center", gap: 5,
        background: C.bg, color: C.fg,
        fontSize: 11, fontWeight: 800, lineHeight: 1.2,
        padding: "4px 8px", borderRadius: 999, letterSpacing: "-0.01em", maxWidth: "100%",
      }}
      title="AI 가격비교 진단"
    >
      {tone !== "winner" && <span style={{ width: 5, height: 5, borderRadius: "50%", background: C.dot, flexShrink: 0 }} />}
      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{C.icon}{text}</span>
    </span>
  );
}

// 풀버전(상세페이지용) — 몰별 최저가·판정 + 면책. 위너면 상단 강조.
export function PriceVerdictDetail({ pc, ourPrice }: { pc?: PriceCompare; ourPrice: number }) {
  if (!pc) return null;
  const es = entries(pc);
  if (!es.length) return null;
  const winner = isWinner(bestRec(es, ourPrice));

  return (
    <div style={{ border: `1px solid ${winner ? "#F0D79A" : "#EFECE7"}`, borderRadius: 14, padding: "14px 16px", background: winner ? "#FFFBF2" : "#FCFBF9" }}>
      <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.04em", color: winner ? "#A66A00" : "#6F6B64", marginBottom: 10 }}>
        {winner ? "🏆 AI 진단 — 지금 진짜 싸요" : "AI 가격비교 진단"}
      </div>
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
                {same ? "비슷" : cheaper ? `추천 ${diff}%` : `비추 +${diff}%`}
              </span>
            </div>
          );
        })}
      </div>
      <p style={{ fontSize: 10.5, color: "#9A958C", marginTop: 10, lineHeight: 1.5 }}>
        AI가 동일·유사 상품의 공개 검색 최저가와 비교한 추정치예요. 분석 시점·옵션·용량에 따라 실제 가격과 다를 수 있어요.
      </p>
    </div>
  );
}
