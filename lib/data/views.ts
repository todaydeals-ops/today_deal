// 조회수 카운터 — 유니크 아님. 모든 페이지 렌더(사람+봇 크롤 포함) 1회씩 합산.
// 서버 렌더 시점에 원자적 증가(RPC). service_role로 RLS 우회.
import { getSupabaseAdmin } from "@/lib/supabase/server";

export async function bumpViews(): Promise<{ today: number; total: number } | null> {
  const sb = getSupabaseAdmin();
  if (!sb) return null;
  try {
    const { data, error } = await sb.rpc("bump_views");
    const row = Array.isArray(data) ? data[0] : data;
    if (error || !row) return null;
    return {
      today: Number(row.today_count) || 0,
      total: Number(row.total_count) || 0,
    };
  } catch {
    return null;
  }
}
