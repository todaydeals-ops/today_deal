// 추첨 결과 저장 (데모용 localStorage). 추후 Supabase giveaway_entries/결과 테이블로 교체.

export interface Winner {
  id: string;
  name: string; // 마스킹된 표시 이름
  entries: number; // 당첨 시점 응모권 수
  isMe?: boolean; // 현재 회원 본인 여부
}

export interface DrawResult {
  giveawayId: string;
  winners: Winner[];
  poolSize: number; // 추첨 모집단 크기
  drawnAt: string; // 추첨 시각 (표시용 문자열)
}

const KEY = "oneuldeal_giveaway_results_v1";

function readAll(): Record<string, DrawResult> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Record<string, DrawResult>) : {};
  } catch {
    return {};
  }
}

export function getResult(giveawayId: string): DrawResult | null {
  return readAll()[giveawayId] ?? null;
}

export function saveResult(result: DrawResult): void {
  if (typeof window === "undefined") return;
  const all = readAll();
  all[result.giveawayId] = result;
  window.localStorage.setItem(KEY, JSON.stringify(all));
}

export function clearResult(giveawayId: string): void {
  if (typeof window === "undefined") return;
  const all = readAll();
  delete all[giveawayId];
  window.localStorage.setItem(KEY, JSON.stringify(all));
}
