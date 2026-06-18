// 회원 통계 — 실제 members 테이블 카운트 (뉴스레터 발송대상 등).
import { getSupabaseAdmin } from "@/lib/supabase/server";

export async function getMemberStats(): Promise<{ total: number; consented: number }> {
  const sb = getSupabaseAdmin();
  if (!sb) return { total: 0, consented: 0 };
  try {
    const totalRes = await sb.from("members").select("*", { count: "exact", head: true });
    const consentRes = await sb
      .from("members")
      .select("*", { count: "exact", head: true })
      .eq("marketing_consent", true);
    return { total: totalRes.count ?? 0, consented: consentRes.count ?? 0 };
  } catch {
    return { total: 0, consented: 0 };
  }
}
