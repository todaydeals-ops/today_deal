// 나눔이벤트(경품) 등록/조회/삭제 — 관리자용. middleware 쿠키 게이트로 보호, 쓰기는 service_role.
import type { GiveawayType } from "@/lib/types";
import { getSupabaseAdmin } from "@/lib/supabase/server";

interface Input {
  type?: GiveawayType;
  title?: string;
  prizeName?: string;
  prizeImage?: string;
  description?: string;
  startAt?: string;
  endAt?: string;
  winnerCount?: number | string;
  affiliateUrl?: string;
  drawAt?: string;
}

export async function GET(): Promise<Response> {
  const sb = getSupabaseAdmin();
  if (!sb) return Response.json({ ok: false, error: "Supabase service_role 미설정", giveaways: [] }, { status: 500 });
  const { data, error } = await sb.from("giveaways").select("*").order("start_at", { ascending: false });
  if (error) return Response.json({ ok: false, error: error.message, giveaways: [] }, { status: 500 });
  return Response.json({ ok: true, giveaways: data ?? [] });
}

export async function POST(request: Request): Promise<Response> {
  const sb = getSupabaseAdmin();
  if (!sb) return Response.json({ ok: false, error: "Supabase service_role 미설정" }, { status: 500 });

  let body: { giveaway?: Input } = {};
  try {
    body = (await request.json()) as { giveaway?: Input };
  } catch {
    return Response.json({ ok: false, error: "잘못된 요청" }, { status: 400 });
  }
  const d = body.giveaway ?? {};
  const winner = Number(d.winnerCount);
  if (!d.title?.trim() || !d.prizeName?.trim() || !d.endAt) {
    return Response.json({ ok: false, error: "제목·경품명·종료일은 필수입니다." }, { status: 400 });
  }
  const row = {
    type: (d.type as GiveawayType) === "monthly" ? "monthly" : "weekly",
    title: d.title.trim(),
    prize_name: d.prizeName.trim(),
    prize_image: d.prizeImage?.trim() || null,
    description: d.description?.trim() || null,
    start_at: d.startAt ? new Date(d.startAt).toISOString() : new Date().toISOString(),
    end_at: new Date(d.endAt).toISOString(),
    winner_count: Number.isFinite(winner) && winner > 0 ? winner : 1,
    affiliate_url: d.affiliateUrl?.trim() || null,
    draw_at: d.drawAt ? new Date(d.drawAt).toISOString() : null,
  };
  const { data, error } = await sb.from("giveaways").insert(row).select("*");
  if (error) return Response.json({ ok: false, error: error.message }, { status: 500 });
  return Response.json({ ok: true, giveaway: data?.[0] ?? null });
}

export async function DELETE(request: Request): Promise<Response> {
  const sb = getSupabaseAdmin();
  if (!sb) return Response.json({ ok: false, error: "Supabase service_role 미설정" }, { status: 500 });
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return Response.json({ ok: false, error: "id 누락" }, { status: 400 });
  const { error } = await sb.from("giveaways").delete().eq("id", id);
  if (error) return Response.json({ ok: false, error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}
