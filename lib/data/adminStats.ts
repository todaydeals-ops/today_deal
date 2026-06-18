// 관리자 운영 현황 집계 — 실데이터 카운트.
import { getSupabaseAdmin } from "@/lib/supabase/server";

export interface AdminStats {
  viewsToday: number;
  viewsTotal: number;
  members: number;
  membersConsented: number;
  deals: number;
  curated: number;
  giveaways: number;
  draws: number;
}

const ZERO: AdminStats = {
  viewsToday: 0,
  viewsTotal: 0,
  members: 0,
  membersConsented: 0,
  deals: 0,
  curated: 0,
  giveaways: 0,
  draws: 0,
};

export async function getAdminStats(): Promise<AdminStats> {
  const sb = getSupabaseAdmin();
  if (!sb) return ZERO;
  try {
    const [vc, m, mc, d, c, g, dr] = await Promise.all([
      sb.from("view_counter").select("day_count,total").eq("id", 1).maybeSingle(),
      sb.from("members").select("*", { count: "exact", head: true }),
      sb.from("members").select("*", { count: "exact", head: true }).eq("marketing_consent", true),
      sb.from("deals").select("*", { count: "exact", head: true }),
      sb.from("curated_deals").select("*", { count: "exact", head: true }).eq("is_active", true),
      sb.from("giveaways").select("*", { count: "exact", head: true }),
      sb.from("draw_results").select("*", { count: "exact", head: true }),
    ]);
    return {
      viewsToday: Number(vc.data?.day_count) || 0,
      viewsTotal: Number(vc.data?.total) || 0,
      members: m.count ?? 0,
      membersConsented: mc.count ?? 0,
      deals: d.count ?? 0,
      curated: c.count ?? 0,
      giveaways: g.count ?? 0,
      draws: dr.count ?? 0,
    };
  } catch {
    return ZERO;
  }
}
