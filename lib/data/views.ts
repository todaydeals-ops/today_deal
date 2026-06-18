// 조회수 카운터 — IP당 하루 1회만 합산(같은 IP 새로고침엔 안 오름).
// 서버 렌더 시점에 원자적 증가(RPC). service_role로 RLS 우회.
import { getSupabaseAdmin } from "@/lib/supabase/server";

export async function bumpViews(ip?: string): Promise<{ today: number; total: number } | null> {
  const sb = getSupabaseAdmin();
  if (!sb) return null;
  try {
    const { data, error } = await sb.rpc("bump_views_ip", { p_ip: ip ?? "unknown" });
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
