// 드립 피드 설정 — 하루 DAILY_TARGET개를 활동시간(KST 08~24시)에 시간대 균등 배포.
// 균등: 시간 경과에 비례한 누적 목표(targetPublishedByNow)로 자기보정 → 어느 구간이든 같은 밀도.
// 랜덤: 실제 각 글의 공개시각은 "마지막 공개~현재" 구간 안에서 랜덤(ingest.publishRate).

export const DAILY_TARGET = 77; // 하루 목표 글 수
export const MAX_BURST = 8; // 1회 호출당 공개 상한(밤샘·스케줄러 공백 후 무더기 방지)
const WINDOW_START_HOUR = 8; // KST 공개 시작
const WINDOW_END_HOUR = 24; // KST 공개 종료(자정)
const WINDOW_MIN = (WINDOW_END_HOUR - WINDOW_START_HOUR) * 60;

// KST 자정(00:00)의 epoch ms
function kstMidnightMs(nowMs: number): number {
  const kst = nowMs + 9 * 3600_000;
  const dayStartKst = Math.floor(kst / 86400_000) * 86400_000;
  return dayStartKst - 9 * 3600_000;
}

// 오늘 공개창 시작 epoch ms(= 오늘 08:00 KST). 오늘 공개분 카운트 기준.
export function windowStartMs(nowMs: number = Date.now()): number {
  return kstMidnightMs(nowMs) + WINDOW_START_HOUR * 3600_000;
}
function windowEndMs(nowMs: number): number {
  return kstMidnightMs(nowMs) + WINDOW_END_HOUR * 3600_000;
}

// 공개 활동시간(08~24시 KST) 내인가. 밖이면 공개 안 함(새벽 무더기 방지).
export function isActiveHour(): boolean {
  const now = Date.now();
  return now >= windowStartMs(now) && now < windowEndMs(now);
}

// 지금까지(오늘) 공개돼 있어야 할 누적 목표 — 창 경과시간에 선형 비례(시간대 균등).
// 예) 창 절반 지났으면 ≈ DAILY_TARGET/2.
export function targetPublishedByNow(): number {
  const now = Date.now();
  const minsIn = Math.max(0, Math.min(WINDOW_MIN, (now - windowStartMs(now)) / 60_000));
  return Math.round(DAILY_TARGET * (minsIn / WINDOW_MIN));
}

// 활동 시뮬(조회·추천) 강도 — 피크시간 가중
export function activityBoost(): number {
  const h = new Date(Date.now() + 9 * 3600_000).getUTCHours();
  if ((h >= 12 && h <= 14) || (h >= 20 && h <= 23)) return 1.6;
  if (h >= 8 && h <= 23) return 1;
  return 0.2;
}
