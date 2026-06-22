import type { PriceCompare, PriceCompareRef } from "@/lib/types";

// AI 가격비교 진단 배지 — 같은 상품을 네이버/쿠팡 최저가와 대조한 결과.
// 정직 원칙: 우리가 비싸면 "더 싼 곳 있어요"도 그대로 노출(신뢰의 해자).

const MALL_KR = { naver: "네이버", coupang: "쿠팡" } as const;

interface Entry { mall: "naver" | "coupang"; data: PriceCompareRef }
function entries(pc: PriceCompare): Entry[] {
  const out: Entry[] = [];
  if (pc.naver) out.push({ mall: "naver", data: pc.naver });
  if (pc.coupang) out.push({ mall: "coupang", data: pc.coupang });
  return out;
}

// 컴팩트(카드용) — 한 줄 핵심만. 추천 우선 노출(없으면 비추 → 비슷).
export function PriceVerdictBadge({ pc }: { pc?: PriceCompare }) {
  if (!pc) return null;
  const es = entries(pc);
  if (!es.length) return null;
  const malls = (v: string) => es.filter((e) => e.data.verdict === v).map((e) => MALL_KR[e.mall]).join("·");

  let tone: "good" | "warn" | "neutral", text: string;
  if (es.some((e) => e.data.verdict === "추천")) {
    tone = "good"; text = `${malls("추천")} 최저가보다 저렴`;
  } else if (es.some((e) => e.data.verdict === "비추")) {
    tone = "warn"; text = `${malls("비추")}가 더 저렴`;
  } else {
    tone = "neutral"; text = `${es.map((e) => MALL_KR[e.mall]).join("·")} 최저가 수준`;
  }

  const C = {
    good: { bg: "#E8F5EE", fg: "#1A8A5A", dot: "#1A8A5A" },
    warn: { bg: "#FBEEEA", fg: "#B4452F", dot: "#B4452F" },
    neutral: { bg: "#F0EEEA", fg: "#6F6B64", dot: "#9A958C" },
  }[tone];

  return (
    <span
      style={{
        display: "inline-flex", alignItems: "center", gap: 5,
        background: C.bg, color: C.fg,
        fontSize: 11, fontWeight: 700, lineHeight: 1.2,
        padding: "4px 8px", borderRadius: 999, letterSpacing: "-0.01em",
        maxWidth: "100%",
      }}
      title="AI 가격비교 진단"
    >
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: C.dot, flexShrink: 0 }} />
      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{text}</span>
    </span>
  );
}

// 풀버전(상세페이지용) — 몰별로 최저가·판정 표기 + 면책.
export function PriceVerdictDetail({ pc, ourPrice }: { pc?: PriceCompare; ourPrice: number }) {
  if (!pc) return null;
  const es = entries(pc);
  if (!es.length) return null;

  return (
    <div style={{ border: "1px solid #EFECE7", borderRadius: 14, padding: "14px 16px", background: "#FCFBF9" }}>
      <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.04em", color: "#6F6B64", marginBottom: 10 }}>
        AI 가격비교 진단
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {es.map(({ mall, data }) => {
          const cheaper = data.verdict === "추천"; // 우리가 더 쌈
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
        동일/유사 상품의 공개 검색 최저가와 비교한 추정치예요. 옵션·용량에 따라 다를 수 있어요.
      </p>
    </div>
  );
}
