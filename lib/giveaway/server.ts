// 나눔이벤트 응모권 — 서버 권위(DB). 회원ID는 라우트에서 카카오 세션 쿠키로 검증해 전달.
// 슬롯/한도 검증을 서버에서 수행(KST 기준). service_role로 RLS 우회.
import { getSupabaseAdmin } from "@/lib/supabase/server";

export const VISIT_SLOT_HOURS = 6;
export const VISIT_DAILY_CAP = 24 / VISIT_SLOT_HOURS; // 4
export const AD_ENTRY_CAP = 5;
export const SHARE_CHANNELS = ["share", "x", "facebook", "line", "copy"] as const;
export const REF_ENTRY_CAP = SHARE_CHANNELS.length;

export interface EntryPublic {
  visit: number;
  ad: number;
  ref: string[];
  total: number;
}
export interface Eligibility {
  ok: boolean;
  reason?: "not-logged-in" | "cooldown" | "maxed";
  nextClaimAt?: number; // epoch ms
  remainingToday: number;
}

interface EntryRow {
  member_id: string;
  giveaway_id: string;
  visit_entries: number;
  ad_entries: number;
  ref_channels: string[];
  claim_day: string | null;
  claimed_slots: number[];
}

const pad = (n: number) => String(n).padStart(2, "0");
// KST 벽시계 (UTC+9) — UTC getter로 읽음
function kstWall(): Date {
  return new Date(Date.now() + 9 * 3600 * 1000);
}
function todayKST(): string {
  const k = kstWall();
  return `${k.getUTCFullYear()}-${pad(k.getUTCMonth() + 1)}-${pad(k.getUTCDate())}`;
}
function currentSlot(): number {
  return Math.floor(kstWall().getUTCHours() / VISIT_SLOT_HOURS);
}
// 다음 슬롯 시작 epoch(ms)
function nextSlotStartMs(): number {
  const k = kstWall();
  const nextHour = (currentSlot() + 1) * VISIT_SLOT_HOURS; // 6/12/18/24
  return Date.UTC(k.getUTCFullYear(), k.getUTCMonth(), k.getUTCDate(), nextHour, 0, 0) - 9 * 3600 * 1000;
}

function emptyRow(memberId: string, giveawayId: string): EntryRow {
  return {
    member_id: memberId,
    giveaway_id: giveawayId,
    visit_entries: 0,
    ad_entries: 0,
    ref_channels: [],
    claim_day: null,
    claimed_slots: [],
  };
}

async function fetchRow(memberId: string, giveawayId: string): Promise<EntryRow> {
  const sb = getSupabaseAdmin();
  if (!sb) return emptyRow(memberId, giveawayId);
  const { data } = await sb
    .from("entries")
    .select("*")
    .eq("member_id", memberId)
    .eq("giveaway_id", giveawayId)
    .maybeSingle();
  return (data as EntryRow) ?? emptyRow(memberId, giveawayId);
}

function toPublic(r: EntryRow): EntryPublic {
  const ref = r.ref_channels ?? [];
  return {
    visit: r.visit_entries ?? 0,
    ad: r.ad_entries ?? 0,
    ref,
    total: (r.visit_entries ?? 0) + (r.ad_entries ?? 0) + ref.length,
  };
}
export function totalOf(r: EntryRow): number {
  return (r.visit_entries ?? 0) + (r.ad_entries ?? 0) + (r.ref_channels?.length ?? 0);
}

function eligibilityOf(r: EntryRow): Eligibility {
  const today = todayKST();
  const claimedToday = r.claim_day === today ? r.claimed_slots ?? [] : [];
  const remainingToday = Math.max(0, VISIT_DAILY_CAP - claimedToday.length);
  if (claimedToday.length >= VISIT_DAILY_CAP) return { ok: false, reason: "maxed", remainingToday: 0 };
  if (claimedToday.includes(currentSlot()))
    return { ok: false, reason: "cooldown", nextClaimAt: nextSlotStartMs(), remainingToday };
  return { ok: true, remainingToday };
}

async function save(r: EntryRow): Promise<void> {
  const sb = getSupabaseAdmin();
  if (!sb) return;
  await sb.from("entries").upsert(
    {
      member_id: r.member_id,
      giveaway_id: r.giveaway_id,
      visit_entries: r.visit_entries,
      ad_entries: r.ad_entries,
      ref_channels: r.ref_channels,
      claim_day: r.claim_day,
      claimed_slots: r.claimed_slots,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "member_id,giveaway_id" }
  );
}

export async function getEntryState(memberId: string, giveawayId: string) {
  const r = await fetchRow(memberId, giveawayId);
  return { entry: toPublic(r), eligibility: eligibilityOf(r) };
}

export async function claimVisit(memberId: string, giveawayId: string) {
  const r = await fetchRow(memberId, giveawayId);
  const today = todayKST();
  if (r.claim_day !== today) {
    r.claim_day = today;
    r.claimed_slots = [];
  }
  const elig = eligibilityOf(r);
  if (!elig.ok) return { ok: false as const, entry: toPublic(r), eligibility: elig };
  r.visit_entries += 1;
  r.claimed_slots = [...r.claimed_slots, currentSlot()];
  await save(r);
  return { ok: true as const, entry: toPublic(r), eligibility: eligibilityOf(r) };
}

export async function addAdEntry(memberId: string, giveawayId: string) {
  const r = await fetchRow(memberId, giveawayId);
  if (r.ad_entries >= AD_ENTRY_CAP) return { ok: false as const, entry: toPublic(r), reason: "maxed" };
  r.ad_entries += 1;
  await save(r);
  return { ok: true as const, entry: toPublic(r) };
}

export async function addShare(memberId: string, giveawayId: string, channel: string) {
  if (!SHARE_CHANNELS.includes(channel as (typeof SHARE_CHANNELS)[number]))
    return { ok: false as const, reason: "bad-channel" };
  const r = await fetchRow(memberId, giveawayId);
  if (r.ref_channels.includes(channel) || r.ref_channels.length >= REF_ENTRY_CAP)
    return { ok: false as const, entry: toPublic(r), reason: "dup-or-max" };
  r.ref_channels = [...r.ref_channels, channel];
  await save(r);
  return { ok: true as const, entry: toPublic(r) };
}

// 추첨용: 한 이벤트의 모든 응모자 풀
export async function fetchPool(giveawayId: string): Promise<{ memberId: string; weight: number }[]> {
  const sb = getSupabaseAdmin();
  if (!sb) return [];
  const { data } = await sb.from("entries").select("*").eq("giveaway_id", giveawayId);
  return ((data as EntryRow[]) ?? [])
    .map((r) => ({ memberId: r.member_id, weight: totalOf(r) }))
    .filter((p) => p.weight > 0);
}
