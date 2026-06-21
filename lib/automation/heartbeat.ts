// 하트비트 + API 일일 카운터 — settings 테이블(key→jsonb) 재사용(별도 DDL 없음).
import type { getSupabaseAdmin } from "@/lib/supabase/server";
import { HEARTBEAT_KEY, API_COUNTER_KEY, HEARTBEAT_FRESH_MIN, API_DAILY_POSTS, API_DAILY_BLURBS, kstDay } from "./policy";

type SB = NonNullable<ReturnType<typeof getSupabaseAdmin>>;

// 창 열림 여부 — 로컬(맥스 세션)이 최근 하트비트를 찍었나
export async function isLocalAlive(sb: SB, freshMin: number = HEARTBEAT_FRESH_MIN): Promise<boolean> {
  try {
    const { data } = await sb.from("settings").select("value, updated_at").eq("key", HEARTBEAT_KEY).maybeSingle();
    if (!data) return false;
    const v = (data as { value?: { at?: string }; updated_at?: string }).value ?? {};
    const atIso = v.at ?? (data as { updated_at?: string }).updated_at;
    if (!atIso) return false;
    return Date.now() - new Date(atIso).getTime() < freshMin * 60_000;
  } catch {
    return false; // 조회 실패 시 안전하게 API 모드로(사이트가 멈추지 않게)
  }
}

// 로컬 세션이 살아있음을 표시(로컬 드레인 스크립트가 주기적으로 호출)
export async function touchLocal(sb: SB): Promise<void> {
  const now = new Date().toISOString();
  await sb.from("settings").upsert({ key: HEARTBEAT_KEY, value: { source: "local", at: now }, updated_at: now }, { onConflict: "key" });
}

type Counter = { day: string; posts: number; blurbs: number };

async function readCounter(sb: SB): Promise<Counter> {
  const today = kstDay();
  try {
    const { data } = await sb.from("settings").select("value").eq("key", API_COUNTER_KEY).maybeSingle();
    const v = (data as { value?: Partial<Counter> } | null)?.value ?? {};
    if (v.day !== today) return { day: today, posts: 0, blurbs: 0 };
    return { day: today, posts: v.posts ?? 0, blurbs: v.blurbs ?? 0 };
  } catch {
    return { day: today, posts: 0, blurbs: 0 };
  }
}

// 오늘 남은 API 발행 가능량(상한 - 사용량)
export async function apiRemaining(sb: SB, kind: "posts" | "blurbs"): Promise<number> {
  const c = await readCounter(sb);
  const cap = kind === "posts" ? API_DAILY_POSTS : API_DAILY_BLURBS;
  return Math.max(0, cap - c[kind]);
}

// API 사용량 누적(생성 후 호출)
export async function bumpApi(sb: SB, kind: "posts" | "blurbs", n: number): Promise<void> {
  if (n <= 0) return;
  const c = await readCounter(sb);
  c[kind] += n;
  const now = new Date().toISOString();
  await sb.from("settings").upsert({ key: API_COUNTER_KEY, value: c, updated_at: now }, { onConflict: "key" });
}
