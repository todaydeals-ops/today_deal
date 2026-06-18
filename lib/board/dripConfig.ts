// 드립 피드 설정 — 한 번에 안 붓고 단계적으로 증량. 활동시간대만 게시.
// 크론 30분 간격 가정 → 활동시간(8~24시, 16h) = 하루 약 32회 실행.
//   perRun 1 → ~30/일, 2 → ~60/일, 3 → ~100/일.

const LAUNCH = Date.UTC(2026, 5, 18); // 2026-06-18 서비스 시작 기준

function daysSinceLaunch(): number {
  return (Date.now() - LAUNCH) / 86_400_000;
}

// 단계별 회차당 공개 수(ramp)
export function perRunCap(): number {
  const d = daysSinceLaunch();
  if (d < 14) return 1; // 1단계(씨뿌리기)
  if (d < 28) return 2; // 2단계(성장)
  return 3; // 3단계(안정)
}

// KST 활동시간(08~23시)만 게시. 새벽 무더기 방지.
export function isActiveHour(): boolean {
  const kstHour = new Date(Date.now() + 9 * 3600_000).getUTCHours();
  return kstHour >= 8 && kstHour <= 23;
}

// 활동 시뮬레이션(조회·추천) 강도 — 피크시간 가중
export function activityBoost(): number {
  const h = new Date(Date.now() + 9 * 3600_000).getUTCHours();
  // 점심·저녁·밤 피크
  if ((h >= 12 && h <= 14) || (h >= 20 && h <= 23)) return 1.6;
  if (h >= 8 && h <= 23) return 1;
  return 0.2; // 심야
}
