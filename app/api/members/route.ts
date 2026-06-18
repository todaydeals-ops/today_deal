// 회원 조회/제재해제 (관리자). proxy 쿠키 게이트로 보호.
import { getSupabaseAdmin } from "@/lib/supabase/server";

export const runtime = "nodejs";

// GET ?status=banned — 회원 목록(정지 회원 등)
export async function GET(req: Request): Promise<Response> {
  const sb = getSupabaseAdmin();
  if (!sb) return Response.json({ ok: false, error: "Supabase service_role 미설정", members: [] }, { status: 500 });
  const status = new URL(req.url).searchParams.get("status");
  let q = sb
    .from("members")
    .select("id, nickname, display_name, deal_balance, status, last_login_at")
    .order("last_login_at", { ascending: false })
    .limit(200);
  if (status) q = q.eq("status", status);
  const { data, error } = await q;
  if (error) return Response.json({ ok: false, error: error.message, members: [] }, { status: 500 });
  return Response.json({ ok: true, members: data ?? [] });
}

// PATCH ?id=&action=unban — 이용정지 해제
export async function PATCH(req: Request): Promise<Response> {
  const sb = getSupabaseAdmin();
  if (!sb) return Response.json({ ok: false, error: "Supabase service_role 미설정" }, { status: 500 });
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  const action = url.searchParams.get("action");
  if (!id) return Response.json({ ok: false, error: "id 누락" }, { status: 400 });
  if (action === "unban") {
    const { error } = await sb.from("members").update({ status: "active" }).eq("id", id);
    if (error) return Response.json({ ok: false, error: error.message }, { status: 500 });
    return Response.json({ ok: true });
  }
  return Response.json({ ok: false, error: "알 수 없는 동작" }, { status: 400 });
}
