// 추천딜 등록/조회/삭제 (관리자 브라우저용).
// 보호: middleware Basic Auth(ADMIN_USER/ADMIN_PASS 설정 시). 쓰기는 service_role.
import type { CuratedCategory } from "@/lib/types";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { curatedSlug } from "@/lib/curatedSlug";

interface DealInput {
  productName?: string;
  category?: CuratedCategory;
  imageUrl?: string;
  affiliateUrl?: string;
  salePrice?: number | string;
  discountRate?: number | string;
  adminNote?: string;
  videoUrl?: string;
}

interface PostBody {
  deal?: DealInput;
  deals?: DealInput[];
}

interface InsertRow {
  seq: number;
  slug: string;
  product_name: string;
  category: CuratedCategory;
  image_url: string | null;
  affiliate_url: string;
  discount_rate: number | null;
  sale_price: number;
  admin_note: string | null;
  video_url: string | null;
  is_active: boolean;
}

const num = (v: unknown): number | null => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : null;
};

// 등록된 추천딜 전체(활성+비활성) — 관리자 목록용
export async function GET(): Promise<Response> {
  const sb = getSupabaseAdmin();
  if (!sb) return Response.json({ ok: false, error: "Supabase service_role 미설정", deals: [] }, { status: 500 });
  const { data, error } = await sb
    .from("curated_deals")
    .select("*")
    .order("seq", { ascending: false });
  if (error) return Response.json({ ok: false, error: error.message, deals: [] }, { status: 500 });
  return Response.json({ ok: true, deals: data ?? [] });
}

export async function POST(request: Request): Promise<Response> {
  const sb = getSupabaseAdmin();
  if (!sb) return Response.json({ ok: false, error: "Supabase service_role 미설정" }, { status: 500 });

  let body: PostBody = {};
  try {
    body = (await request.json()) as PostBody;
  } catch {
    return Response.json({ ok: false, error: "잘못된 요청" }, { status: 400 });
  }

  const inputs = Array.isArray(body.deals) ? body.deals : body.deal ? [body.deal] : [];
  const valid = inputs.filter(
    (d) => d.productName?.trim() && d.affiliateUrl?.trim() && num(d.salePrice)
  );
  if (valid.length === 0) {
    return Response.json({ ok: false, error: "상품명·제휴링크·판매가는 필수입니다." }, { status: 400 });
  }

  // 현재 최대 seq 뒤에 이어붙임 (slug 유니크 보장에도 사용)
  let seq = 0;
  try {
    const { data } = await sb
      .from("curated_deals")
      .select("seq")
      .order("seq", { ascending: false })
      .limit(1);
    seq = (data?.[0]?.seq as number) ?? 0;
  } catch {
    seq = 0;
  }

  const rows: InsertRow[] = valid.map((d) => {
    seq += 1;
    const name = d.productName!.trim();
    return {
      seq,
      slug: curatedSlug(name, seq),
      product_name: name,
      category: (d.category as CuratedCategory) ?? "생활",
      image_url: d.imageUrl?.trim() || null,
      affiliate_url: d.affiliateUrl!.trim(),
      discount_rate: num(d.discountRate),
      sale_price: num(d.salePrice)!,
      admin_note: d.adminNote?.trim() || null,
      video_url: d.videoUrl?.trim() || null,
      is_active: true,
    };
  });

  const { data, error } = await sb.from("curated_deals").insert(rows).select("*");
  if (error) return Response.json({ ok: false, error: error.message }, { status: 500 });

  return Response.json({ ok: true, registered: rows.length, deals: data ?? [] });
}

export async function DELETE(request: Request): Promise<Response> {
  const sb = getSupabaseAdmin();
  if (!sb) return Response.json({ ok: false, error: "Supabase service_role 미설정" }, { status: 500 });

  const id = new URL(request.url).searchParams.get("id");
  if (!id) return Response.json({ ok: false, error: "id 누락" }, { status: 400 });

  const { error } = await sb.from("curated_deals").delete().eq("id", id);
  if (error) return Response.json({ ok: false, error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}
