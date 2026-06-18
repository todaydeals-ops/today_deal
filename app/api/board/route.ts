// 제보딜 등록/조회/삭제 (에이전트·관리자). proxy 쿠키 게이트로 보호, 쓰기는 service_role.
import crypto from "node:crypto";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export const runtime = "nodejs";

const BOARD_TYPE_KEYS = ["hot", "overseas", "free", "coupon"];

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

export async function DELETE(request: Request): Promise<Response> {
  const sb = getSupabaseAdmin();
  if (!sb) return Response.json({ ok: false, error: "Supabase service_role 미설정" }, { status: 500 });
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return Response.json({ ok: false, error: "id 누락" }, { status: 400 });
  const { error } = await sb.from("board_deals").delete().eq("id", id);
  if (error) return Response.json({ ok: false, error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}
