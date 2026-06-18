// 좋아요(추천) — IP당 글 1회. proxy "/api/board"(정확매칭)에 안 걸려 공개.
import { getSupabaseAdmin } from "@/lib/supabase/server";

export const runtime = "nodejs";

function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("x-real-ip")?.trim() || "0.0.0.0";
}

export async function POST(req: Request): Promise<Response> {
  let slug = "";
  try {
    slug = ((await req.json()) as { slug?: string }).slug?.trim() || "";
  } catch {
    return Response.json({ ok: false, error: "잘못된 요청" }, { status: 400 });
  }
  if (!slug) return Response.json({ ok: false, error: "slug 필요" }, { status: 400 });

  const sb = getSupabaseAdmin();
  if (!sb) return Response.json({ ok: false, error: "서버 설정 오류" }, { status: 500 });

  try {
    const { data, error } = await sb.rpc("bump_board_vote", { p_slug: slug, p_ip: clientIp(req) });
    if (error) return Response.json({ ok: false, error: error.message }, { status: 500 });
    return Response.json({ ok: true, votes: typeof data === "number" ? data : null });
  } catch {
    return Response.json({ ok: false, error: "오류" }, { status: 500 });
  }
}
