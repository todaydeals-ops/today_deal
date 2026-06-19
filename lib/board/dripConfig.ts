// 드립 피드 설정 — 랜덤 간격(약 10~25분)으로 조금씩 자주 공개, 카테고리별 소량 분산.
// 외부 스케줄러가 자주(예: 10~15분) 호출해도 실제 공개는 랜덤 게이트가 열릴 때만.

// 활동시간(KST 08~23시)만 공개. 새벽 무더기 방지.
export function isActiveHour(): boolean {
  const kstHour = new Date(Date.now() + 9 * 3600_000).getUTCHours();
  return kstHour >= 8 && kstHour <= 23;
}

// 활동 시뮬(조회·추천) 강도 — 피크시간 가중
export function activityBoost(): number {
  const h = new Date(Date.now() + 9 * 3600_000).getUTCHours();
  if ((h >= 12 && h <= 14) || (h >= 20 && h <= 23)) return 1.6;
  if (h >= 8 && h <= 23) return 1;
  return 0.2;
}

// 카테고리별 1회 공개량 — 조금씩 자주(카테고리당 0~1). 1회 총 ~3~5개로 매끄럽게 흐름.
export interface ReleaseBucket {
  boardType: string;
  category: string | null;
  min: number;
  max: number;
}
const MAJOR = ["전자/IT", "식품", "생활/주방"]; // 주요
const MINOR = ["패션/뷰티", "해외직구", "기타"]; // 비주류
export function releasePlan(): ReleaseBucket[] {
  return [
    ...MAJOR.map((c) => ({ boardType: "hot", category: c, min: 0, max: 1 })),
    ...MINOR.map((c) => ({ boardType: "hot", category: c, min: 0, max: 1 })),
    { boardType: "free", category: null, min: 0, max: 1 },
    { boardType: "coupon", category: null, min: 0, max: 1 },
  ];
}

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

// 다음 공개까지 간격(분) — 마지막 공개시각을 시드로 안정적 랜덤. 대개 10~22분, 가끔 ~40분.
// 조금씩 자주: 외부 스케줄러(15분)와 맞물려 대략 15~25분마다 소량 공개.
// 예) 13·17·22·38 수준.
export function nextGapMinutes(seed: string): number {
  const h = hashStr(seed || "init");
  let g = 10 + (h % 13); // 10~22
  if (h % 6 === 0) g += 8 + (h % 15); // 약 17% 확률로 살짝 길게(~25~45분)
  return g;
}
