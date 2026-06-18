// 딜 스냅샷(deal_archive) 한줄평(summary) 백필 — summary 없는 것만 일부 생성(상품당 1회).
// 크롤러가 매 실행 시 트리거 → 시간이 지나며 전부 채워짐. ANTHROPIC_API_KEY 없으면 그냥 0건.
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { generateBlurb } from "@/lib/blurb";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function authorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  if (request.headers.get("authorization") === `Bearer ${secret}`) return true;
  return new URL(request.url).searchParams.get("key") === secret;
}

const BATCH = 12;

export async function GET(request: Request): Promise<Response> {
  if (!authorized(request)) return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const sb = getSupabaseAdmin();
  if (!sb) return Response.json({ ok: false, error: "Supabase 미설정" }, { status: 500 });

  const { data, error } = await sb
    .from("deal_archive")
    .select("slug, product_name, sale_price")
    .is("summary", null)
    .limit(BATCH);
  if (error) return Response.json({ ok: false, error: error.message }, { status: 500 });
  if (!data || data.length === 0) return Response.json({ ok: true, updated: 0, done: true });

  let updated = 0;
  for (const r of data as Array<{ slug: string; product_name: string; sale_price: number }>) {
    const blurb = await generateBlurb({ productName: r.product_name, price: r.sale_price ?? undefined });
    if (blurb) {
      await sb.from("deal_archive").update({ summary: blurb }).eq("slug", r.slug);
      updated++;
    }
  }
  return Response.json({ ok: true, updated, scanned: data.length });
}
