// 드립 피드 설정 — 일정 레이트(1개 / RELEASE_INTERVAL_SEC초)로 한 개씩 꾸준히 공개.
// 외부 스케줄러(15분)가 497초보다 드물게 호출하므로, 호출 때마다 "그동안 밀린 개수"를
// 497초 간격 타임스탬프로 공개하고 나머지(remainder)는 이월 → 평균 간격을 정확히 유지.

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

// 공개 레이트 — 1개당 간격(초). 497초 ≈ 8분 17초.
export const RELEASE_INTERVAL_SEC = 497;
const MAX_BURST = 8; // 1회 호출당 공개 상한(밤샘·스케줄러 공백 후 무더기 방지)

// 마지막 공개시각(anchor) 기준으로 이번에 공개할 개수와 anchor(ms)를 계산.
// - 정상: anchor = 마지막 공개시각 → 나머지(remainder) 이월로 평균 497초/개 유지.
// - 장시간 공백(>1h, 밤샘/스케줄러 중단): anchor를 현재 근처로 리셋 → 아침 글이 신선하게.
export function releaseSchedule(lastIso: string | null): { count: number; anchorMs: number } {
  const now = Date.now();
  const stepMs = RELEASE_INTERVAL_SEC * 1000;
  if (!lastIso) return { count: 1, anchorMs: now - stepMs };
  let anchorMs = new Date(lastIso).getTime();
  if (Number.isNaN(anchorMs) || (now - anchorMs) / 1000 > 3600) {
    anchorMs = now - MAX_BURST * stepMs; // 공백 리셋
  }
  const count = Math.min(MAX_BURST, Math.floor((now - anchorMs) / stepMs));
  return { count, anchorMs };
}
