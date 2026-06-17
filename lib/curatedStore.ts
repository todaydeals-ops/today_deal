// 추천딜 관리자 등록분 임시 저장소 (localStorage).
// 데모용 — 추후 Supabase curated_deals 테이블로 교체.
import type { CuratedDeal } from "@/lib/types";

const KEY = "oneuldeal_curated_v1";

export function getStoredCurated(): CuratedDeal[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as CuratedDeal[]) : [];
  } catch {
    return [];
  }
}

export function saveStoredCurated(deals: CuratedDeal[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(deals));
}

export function addStoredCurated(deal: CuratedDeal): CuratedDeal[] {
  const next = [deal, ...getStoredCurated()];
  saveStoredCurated(next);
  return next;
}

export function removeStoredCurated(id: string): CuratedDeal[] {
  const next = getStoredCurated().filter((d) => d.id !== id);
  saveStoredCurated(next);
  return next;
}

// 다음 추천 번호(seq) 계산: 저장분 + 기본 mock 중 최대값 + 1
export function nextSeq(base: CuratedDeal[]): number {
  const all = [...getStoredCurated(), ...base];
  const max = all.reduce((acc, d) => Math.max(acc, d.seq), 0);
  return max + 1;
}
