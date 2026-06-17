// 타임딜 관리(등록·목록·삭제) — Supabase deals 테이블 직접 쓰기(service_role).
// ⚠️ 쓰기 엔드포인트이므로 운영에선 반드시 ADMIN_USER/ADMIN_PASS(Basic Auth, middleware)로 보호할 것.
import type { Platform } from "@/lib/types";
import { getSupabaseAdmin } from "@/lib/supabase/server";

interface RegisterDeal {
  platform: Platform;
  productName: string;
  imageUrl?: string;
  productUrl: string;
  affiliateUrl?: string;
  salePrice: number;
  discountRate?: number;
  dealEndAt?: string; // ISO
  isSoldout?: boolean;
}

// 등록(추가)
export async function POST(request: Request): Promise<Response> {
  const sb = getSupabaseAdmin();
  if (!sb) {
    return Response.json(
      { ok: false, error: "Supabase service_role 미설정 (SUPABASE_SERVICE_ROLE_KEY)" },
      { status: 500 }
    );
  }

  let deals: RegisterDeal[] = [];
  try {
    const b = await request.json();
    deals = Array.isArray(b?.deals) ? b.deals : [];
  } catch {
    return Response.json({ ok: false, error: "잘못된 요청" }, { status: 400 });
  }

  const valid = deals.filter(
    (d) => d && d.platform && d.productName?.trim() && d.productUrl?.trim() && d.salePrice > 0
  );
  if (valid.length === 0) {
    return Response.json({ ok: false, error: "등록할 항목이 없어요 (플랫폼·상품명·URL·판매가 필수)." }, { status: 400 });
  }

  // 현재 최대 display_order 뒤에 이어붙임
  let base = 0;
  try {
    const { data } = await sb
      .from("deals")
      .select("display_order")
      .order("display_order", { ascending: false })
      .limit(1);
    base = (data?.[0]?.display_order as number) ?? 0;
  } catch {
    base = 0;
  }

  const rows = valid.map((d, i) => ({
    platform: d.platform,
    product_name: d.productName.trim(),
    image_url: d.imageUrl?.trim() || null,
    product_url: d.productUrl.trim(),
    affiliate_url: d.affiliateUrl?.trim() || null,
    discount_rate: d.discountRate ?? null,
    sale_price: d.salePrice,
    deal_end_at: d.dealEndAt ?? null,
    is_soldout: d.isSoldout ?? false,
    display_order: base + i + 1,
  }));

  const ins = await sb.from("deals").insert(rows);
  if (ins.error) return Response.json({ ok: false, error: ins.error.message }, { status: 500 });

  return Response.json({ ok: true, count: rows.length });
}

// 목록
export async function GET(): Promise<Response> {
  const sb = getSupabaseAdmin();
  if (!sb) return Response.json({ ok: false, deals: [], error: "Supabase 미설정" }, { status: 500 });

  const { data, error } = await sb
    .from("deals")
    .select("*")
    .order("display_order", { ascending: true });
  if (error) return Response.json({ ok: false, deals: [], error: error.message }, { status: 500 });

  const deals = (data ?? []).map((r: Record<string, unknown>) => ({
    id: String(r.id),
    platform: r.platform as Platform,
    productName: String(r.product_name ?? ""),
    imageUrl: (r.image_url as string) || undefined,
    salePrice: Number(r.sale_price ?? 0),
    discountRate: r.discount_rate != null ? Number(r.discount_rate) : undefined,
    dealEndAt: (r.deal_end_at as string) || undefined,
    isSoldout: Boolean(r.is_soldout),
  }));
  return Response.json({ ok: true, deals });
}

// 삭제 (?id=)
export async function DELETE(request: Request): Promise<Response> {
  const sb = getSupabaseAdmin();
  if (!sb) return Response.json({ ok: false, error: "Supabase 미설정" }, { status: 500 });

  const id = new URL(request.url).searchParams.get("id");
  if (!id) return Response.json({ ok: false, error: "id 필요" }, { status: 400 });

  const { error } = await sb.from("deals").delete().eq("id", id);
  if (error) return Response.json({ ok: false, error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}
