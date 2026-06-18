// 관리자 추첨 — DB 실응모자 풀에서 가중추첨 → draw_results 저장. (middleware 쿠키 게이트로 보호)
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { fetchPool } from "@/lib/giveaway/server";
import { weightedDraw, type Participant } from "@/lib/draw";

export const runtime = "nodejs";

export async function POST(req: NextRequest): Promise<Response> {
  const sb = getSupabaseAdmin();
  if (!sb) return NextResponse.json({ ok: false, error: "Supabase service_role 미설정" }, { status: 500 });

  let gid = "";
  try {
    gid = String(((await req.json()) as { gid?: string }).gid ?? "");
  } catch {
    return NextResponse.json({ ok: false, error: "잘못된 요청" }, { status: 400 });
  }
  if (!gid) return NextResponse.json({ ok: false, error: "gid 누락" }, { status: 400 });

  const { data: g } = await sb.from("giveaways").select("winner_count").eq("id", gid).maybeSingle();
  const winnerCount = (g?.winner_count as number) ?? 1;

  const pool = await fetchPool(gid);
  if (pool.length === 0) {
    return NextResponse.json({ ok: false, error: "아직 응모자가 없어요. 응모권을 모은 회원이 있어야 추첨할 수 있습니다." });
  }

  const ids = pool.map((p) => p.memberId);
  const { data: members } = await sb.from("members").select("id,nickname").in("id", ids);
  const nameMap = new Map(((members as { id: string; nickname: string }[]) ?? []).map((m) => [m.id, m.nickname]));

  const participants: Participant[] = pool.map((p) => ({
    id: p.memberId,
    name: nameMap.get(p.memberId) || "회원",
    weight: p.weight,
  }));
  const picked = weightedDraw(participants, winnerCount);
  const winners = picked.map((p) => ({ id: p.id, name: p.name, entries: p.weight }));

  const drawnAt = new Date().toISOString();
  await sb
    .from("draw_results")
    .upsert({ giveaway_id: gid, winners, pool_size: pool.length, drawn_at: drawnAt }, { onConflict: "giveaway_id" });

  return NextResponse.json({ ok: true, winners, poolSize: pool.length, drawnAt });
}

export async function DELETE(req: NextRequest): Promise<Response> {
  const sb = getSupabaseAdmin();
  if (!sb) return NextResponse.json({ ok: false, error: "Supabase service_role 미설정" }, { status: 500 });
  const gid = req.nextUrl.searchParams.get("gid");
  if (!gid) return NextResponse.json({ ok: false, error: "gid 누락" }, { status: 400 });
  await sb.from("draw_results").delete().eq("giveaway_id", gid);
  return NextResponse.json({ ok: true });
}
