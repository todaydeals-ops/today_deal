// 추첨 결과 공개 조회 (누구나 — 당첨자 발표). DB draw_results.
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET(req: NextRequest): Promise<Response> {
  const gid = req.nextUrl.searchParams.get("gid");
  if (!gid) return NextResponse.json({ ok: false, error: "gid 누락" }, { status: 400 });
  const sb = getSupabaseAdmin();
  if (!sb) return NextResponse.json({ ok: true, result: null });
  const { data } = await sb.from("draw_results").select("*").eq("giveaway_id", gid).maybeSingle();
  if (!data) return NextResponse.json({ ok: true, result: null });
  return NextResponse.json({
    ok: true,
    result: { winners: data.winners ?? [], poolSize: data.pool_size ?? 0, drawnAt: data.drawn_at },
  });
}
