// 드립 피드 설정 — 랜덤 간격(약 40~110분)으로만 공개, 카테고리별 소량 분산.
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

// 카테고리별 1회 공개량(주요 2~3, 비주류 1~2). free/coupon 보드도 소량.
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
    ...MAJOR.map((c) => ({ boardType: "hot", category: c, min: 2, max: 3 })),
    ...MINOR.map((c) => ({ boardType: "hot", category: c, min: 1, max: 2 })),
    { boardType: "free", category: null, min: 1, max: 2 },
    { boardType: "coupon", category: null, min: 1, max: 2 },
  ];
}

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

// 다음 공개까지 간격(분) — 마지막 공개시각을 시드로 안정적 랜덤. 대개 35~70분, 가끔 ~115분+.
// 예) 39·47·56·108 수준.
export function nextGapMinutes(seed: string): number {
  const h = hashStr(seed || "init");
  let g = 35 + (h % 36); // 35~70
  if (h % 5 === 0) g += 30 + (h % 45); // 약 20% 확률로 길게(~115분+)
  return g;
}
