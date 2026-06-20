// 제보딜 등록/조회/삭제 (에이전트·관리자). proxy 쿠키 게이트로 보호, 쓰기는 service_role.
import crypto from "node:crypto";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { awardPostOnce, reclaimPostDeal } from "@/lib/deal/server";

export const runtime = "nodejs";

const BOARD_TYPE_KEYS = ["hot", "event"];

interface Input {
  title?: string;
  boardType?: string;
  shop?: string;
  category?: string;
  price?: number | string;
  shipping?: string;
  imageUrl?: string;
  sourceUrl?: string;
  affiliateUrl?: string;
  author?: string;
  body?: string;
}

function boardSlug(title: string): string {
  const base = (title || "")
    .toLowerCase()
    .replace(/[^가-힣a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40)
    .replace(/-+$/g, "");
  return `${base || "deal"}-${crypto.randomBytes(3).toString("hex")}`;
}
const num = (v: unknown): number | null => {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : null;
};

export async function GET(): Promise<Response> {
  const sb = getSupabaseAdmin();
  if (!sb) return Response.json({ ok: false, error: "Supabase service_role 미설정", deals: [] }, { status: 500 });
  const { data, error } = await sb.from("board_deals").select("*").order("created_at", { ascending: false }).limit(200);
  if (error) return Response.json({ ok: false, error: error.message, deals: [] }, { status: 500 });
  return Response.json({ ok: true, deals: data ?? [] });
}

export async function POST(request: Request): Promise<Response> {
  const sb = getSupabaseAdmin();
  if (!sb) return Response.json({ ok: false, error: "Supabase service_role 미설정" }, { status: 500 });
  let d: Input = {};
  try {
    d = ((await request.json()) as { deal?: Input }).deal ?? {};
  } catch {
    return Response.json({ ok: false, error: "잘못된 요청" }, { status: 400 });
  }
  if (!d.title?.trim() || !d.sourceUrl?.trim()) {
    return Response.json({ ok: false, error: "제목·원본 링크는 필수입니다." }, { status: 400 });
  }
  const row = {
    slug: boardSlug(d.title.trim()),
    board_type: BOARD_TYPE_KEYS.includes(d.boardType ?? "") ? d.boardType : "hot",
    title: d.title.trim(),
    shop: d.shop?.trim() || null,
    category: d.category?.trim() || null,
    price: num(d.price),
    shipping: d.shipping?.trim() || null,
    image_url: d.imageUrl?.trim() || null,
    source_url: d.sourceUrl.trim(),
    affiliate_url: d.affiliateUrl?.trim() || null,
    author: d.author?.trim() || null,
    body: d.body?.trim() || null,
    is_published: true,
  };
  const { data, error } = await sb.from("board_deals").insert(row).select("*");
  if (error) return Response.json({ ok: false, error: error.message }, { status: 500 });
  return Response.json({ ok: true, deal: data?.[0] ?? null });
}

// 승인(검토대기 → 게시) — 관리자/에이전트
export async function PATCH(request: Request): Promise<Response> {
  const sb = getSupabaseAdmin();
  if (!sb) return Response.json({ ok: false, error: "Supabase service_role 미설정" }, { status: 500 });
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return Response.json({ ok: false, error: "id 누락" }, { status: 400 });
  // 승인 전 제보자 정보 확인 (딜 적립용)
  const { data: row } = await sb.from("board_deals").select("submitter_id, slug, is_published").eq("id", id).maybeSingle();
  const { error } = await sb.from("board_deals").update({ is_published: true }).eq("id", id);
  if (error) return Response.json({ ok: false, error: error.message }, { status: 500 });
  // 처음 승인이고 로그인 제보면 +Đ2 (slug 기준 1회)
  if (row && !row.is_published && row.submitter_id && row.slug) {
    await awardPostOnce(row.submitter_id as string, row.slug as string);
  }
  return Response.json({ ok: true });
}

// 삭제(?id=) — 제재 옵션: ?reclaim=1(지급 딜 회수) ?ban=1(작성자 이용정지)
export async function DELETE(request: Request): Promise<Response> {
  const sb = getSupabaseAdmin();
  if (!sb) return Response.json({ ok: false, error: "Supabase service_role 미설정" }, { status: 500 });
  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  const reclaim = url.searchParams.get("reclaim") === "1";
  const ban = url.searchParams.get("ban") === "1";
  if (!id) return Response.json({ ok: false, error: "id 누락" }, { status: 400 });

  // 제재 시 작성자 정보 먼저 확보
  let submitterId: string | null = null;
  let slug: string | null = null;
  let published = false;
  if (reclaim || ban) {
    const { data: row } = await sb.from("board_deals").select("submitter_id, slug, is_published").eq("id", id).maybeSingle();
    submitterId = (row?.submitter_id as string) ?? null;
    slug = (row?.slug as string) ?? null;
    published = !!row?.is_published;
  }

  const { error } = await sb.from("board_deals").delete().eq("id", id);
  if (error) return Response.json({ ok: false, error: error.message }, { status: 500 });

  if (submitterId) {
    if (reclaim && published && slug) await reclaimPostDeal(submitterId, slug);
    if (ban) await sb.from("members").update({ status: "banned" }).eq("id", submitterId);
  }
  return Response.json({ ok: true, reclaimed: reclaim, banned: ban && !!submitterId });
}
