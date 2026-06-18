// 딜(Đ) 재화 — 적립/사용 엔진. members.deal_balance + deal_ledger. service_role 전용.
import { getSupabaseAdmin } from "@/lib/supabase/server";

// 적립/사용 규칙
export const DEAL = {
  post: 2, // 핫딜 글 승인
  visit: 1, // 출석(하루 1회)
  ad: 2, // 광고 시청
  share: 3, // 친구 공유
  entry: -5, // 이벤트 응모 1회
} as const;

export const DEAL_SYMBOL = "Đ";

export async function awardDeal(memberId: string, delta: number, reason: string, ref?: string): Promise<number | null> {
  const sb = getSupabaseAdmin();
  if (!sb || !memberId) return null;
  try {
    const { data, error } = await sb.rpc("award_deal", { p_member: memberId, p_delta: delta, p_reason: reason, p_ref: ref ?? null });
    if (error) return null;
    return typeof data === "number" ? data : null;
  } catch {
    return null;
  }
}

export async function getBalance(memberId: string): Promise<number> {
  const sb = getSupabaseAdmin();
  if (!sb || !memberId) return 0;
  try {
    const { data } = await sb.from("members").select("deal_balance").eq("id", memberId).maybeSingle();
    return Number(data?.deal_balance) || 0;
  } catch {
    return 0;
  }
}

// KST '오늘' 시작(UTC ISO)
function kstTodayStartIso(): string {
  const k = new Date(Date.now() + 9 * 3600 * 1000);
  const startUtc = Date.UTC(k.getUTCFullYear(), k.getUTCMonth(), k.getUTCDate()) - 9 * 3600 * 1000;
  return new Date(startUtc).toISOString();
}

async function countLedger(memberId: string, filters: { reason: string; ref?: string; since?: string }): Promise<number> {
  const sb = getSupabaseAdmin();
  if (!sb) return 0;
  try {
    let q = sb.from("deal_ledger").select("*", { count: "exact", head: true }).eq("member_id", memberId).eq("reason", filters.reason);
    if (filters.ref) q = q.eq("ref", filters.ref);
    if (filters.since) q = q.gte("created_at", filters.since);
    const { count } = await q;
    return count ?? 0;
  } catch {
    return 0;
  }
}

// 출석(하루 1회) — 카카오 로그인 시 호출
export async function awardDailyVisit(memberId: string): Promise<void> {
  if (!memberId) return;
  if ((await countLedger(memberId, { reason: "visit", since: kstTodayStartIso() })) > 0) return;
  await awardDeal(memberId, DEAL.visit, "visit");
}

// 글 승인 보상 — 같은 글(slug) 1회만
export async function awardPostOnce(memberId: string, slug: string): Promise<void> {
  if (!memberId || !slug) return;
  if ((await countLedger(memberId, { reason: "post", ref: slug })) > 0) return;
  await awardDeal(memberId, DEAL.post, "post", slug);
}
