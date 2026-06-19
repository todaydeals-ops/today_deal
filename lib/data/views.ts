// 조회수 카운터 — IP당 하루 1회만 합산(같은 IP 새로고침엔 안 오름).
// 서버 렌더 시점에 원자적 증가(RPC). service_role로 RLS 우회.
import { getSupabaseAdmin } from "@/lib/supabase/server";

// 오늘(KST 자정 이후) 일어난 활동 총합 — 오늘 올라온 게시글의 조회수+추천수 합 + 글 수.
// 봇·실제 활동(글생성·조회·하트)이 모두 반영됨. 자정(KST) 지나면 오늘 글만 세므로 자연 초기화.
export async function todayBoardActivity(): Promise<number> {
  const sb = getSupabaseAdmin();
  if (!sb) return 0;
  // KST 자정(00:00) epoch
  const kst = Date.now() + 9 * 3600_000;
  const kstMidnightMs = Math.floor(kst / 86400_000) * 86400_000 - 9 * 3600_000;
  try {
    const { data } = await sb
      .from("board_deals")
      .select("views, votes")
      .eq("is_published", true)
      .gte("created_at", new Date(kstMidnightMs).toISOString())
      .limit(1000);
    const rows = (data as { views: number | null; votes: number | null }[]) ?? [];
    let sum = rows.length; // 글 생성 액션(글 1개 = 1)
    for (const r of rows) sum += (r.views ?? 0) + (r.votes ?? 0); // 조회·하트 액션
    return sum;
  } catch {
    return 0;
  }
}

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
