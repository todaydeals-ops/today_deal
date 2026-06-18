// 딜(Đ) 재화 — 적립/사용 엔진. members.deal_balance + deal_ledger. service_role 전용.
import { getSupabaseAdmin } from "@/lib/supabase/server";

// 적립/사용 규칙
export const DEAL = {
  signup: 100, // 회원가입(최초 1회)
  visit: 10, // 로그인/출석(하루 1회)
  post: 5, // 핫딜 글 승인
  click: 1, // 딜 클릭(추후 클릭추적 연동)
  ad: 2, // 광고 시청
  share: 3, // 친구 공유
  entry: -10, // 이벤트 응모 1회
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

export interface LedgerEntry {
  delta: number;
  reason: string;
  ref: string | null;
  created_at: string;
}

// 최근 딜 적립/사용 내역
export async function getLedger(memberId: string, limit = 30): Promise<LedgerEntry[]> {
  const sb = getSupabaseAdmin();
  if (!sb || !memberId) return [];
  try {
    const { data } = await sb
      .from("deal_ledger")
      .select("delta, reason, ref, created_at")
      .eq("member_id", memberId)
      .order("created_at", { ascending: false })
      .limit(limit);
    return (data as LedgerEntry[]) ?? [];
  } catch {
    return [];
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

// 회원가입 보너스 — 최초 1회만
export async function awardSignupOnce(memberId: string): Promise<void> {
  if (!memberId) return;
  if ((await countLedger(memberId, { reason: "signup" })) > 0) return;
  await awardDeal(memberId, DEAL.signup, "signup");
}

// 악성글 제재 — 지급했던 글 보상(+post)을 1회만 회수(차감)
export async function reclaimPostDeal(memberId: string, slug: string): Promise<void> {
  if (!memberId || !slug) return;
  if ((await countLedger(memberId, { reason: "post", ref: slug })) < 1) return; // 지급 안 됐으면 회수 없음
  if ((await countLedger(memberId, { reason: "admin", ref: `reclaim:${slug}` })) > 0) return; // 이미 회수됨
  await awardDeal(memberId, -DEAL.post, "admin", `reclaim:${slug}`);
}
