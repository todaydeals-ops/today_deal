// 외부 크롤러용 타임딜 자동 수집 엔드포인트 (머신-투-머신).
// 크롤러는 URL 목록만 POST → 서버가 플랫폼감지·OG메타·제휴링크변환·DB저장까지 자동.
// 인증: CRON_SECRET (Authorization: Bearer <secret> 또는 body.secret). Basic Auth(브라우저)와 별개.
import type { Platform } from "@/lib/types";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import {
  fetchUrlMeta,
  detectPlatform,
  affiliateForPlatform,
} from "@/lib/urlMeta";

interface IngestBody {
  secret?: string;
  urls?: string[];
  endHours?: number; // 마감까지 시간(기본 12). 크롤러가 정확한 종료시각을 모를 때.
  replace?: boolean; // true면 등장한 플랫폼의 기존 딜을 비우고 교체(크롤러 방식). 기본 append.
}

interface SkipInfo {
  url: string;
  reason: string;
}

const MAX_URLS = 50;

export async function POST(request: Request): Promise<Response> {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return Response.json({ ok: false, error: "CRON_SECRET 미설정 — 서버에 시크릿을 먼저 등록하세요." }, { status: 500 });
  }

  let body: IngestBody = {};
  try {
    body = (await request.json()) as IngestBody;
  } catch {
    return Response.json({ ok: false, error: "잘못된 요청" }, { status: 400 });
  }

  const bearer = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const provided = bearer || body.secret;
  if (provided !== cronSecret) {
    return Response.json({ ok: false, error: "인증 실패" }, { status: 401 });
  }

  const sb = getSupabaseAdmin();
  if (!sb) {
    return Response.json({ ok: false, error: "Supabase service_role 미설정" }, { status: 500 });
  }

  let urls = Array.isArray(body.urls)
    ? body.urls.map((u) => String(u).trim()).filter(Boolean)
    : [];
  urls = [...new Set(urls)].filter((u) => /^https?:\/\//i.test(u)).slice(0, MAX_URLS);
  if (urls.length === 0) {
    return Response.json({ ok: false, error: "urls 비어 있음" }, { status: 400 });
  }

  const endHours = Number(body.endHours) > 0 ? Number(body.endHours) : 12;
  const dealEndAt = new Date(Date.now() + endHours * 3600 * 1000).toISOString();

  const skipped: SkipInfo[] = [];
  const candidates: {
    platform: Platform;
    product_name: string;
    image_url: string | null;
    product_url: string;
    affiliate_url: string | null;
    sale_price: number;
    deal_end_at: string;
    is_soldout: boolean;
  }[] = [];

  await Promise.all(
    urls.map(async (url) => {
      const detected = detectPlatform(url);
      if (detected === "coupang") return skipped.push({ url, reason: "쿠팡(추천딜 대상)" });
      if (detected === null) return skipped.push({ url, reason: "미지원 플랫폼" });

      const platform = detected as Platform;
      const meta = await fetchUrlMeta(url);
      if (!meta.title) return skipped.push({ url, reason: "상품명 미수집(차단/구조 변경)" });
      if (!meta.price || meta.price <= 0) return skipped.push({ url, reason: "가격 미수집" });

      candidates.push({
        platform,
        product_name: meta.title,
        image_url: meta.imageUrl ?? null,
        product_url: url,
        affiliate_url: affiliateForPlatform(platform, url),
        sale_price: meta.price,
        deal_end_at: dealEndAt,
        is_soldout: false,
      });
    })
  );

  if (candidates.length === 0) {
    return Response.json({ ok: true, registered: 0, skipped });
  }

  // replace 모드: 등장한 플랫폼의 기존 딜 제거 후 교체
  if (body.replace) {
    const platforms = [...new Set(candidates.map((c) => c.platform))];
    for (const p of platforms) {
      const del = await sb.from("deals").delete().eq("platform", p);
      if (del.error) return Response.json({ ok: false, error: del.error.message }, { status: 500 });
    }
  }

  // display_order: 현재 최대 뒤에 이어붙임
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

  const rows = candidates.map((c, i) => ({ ...c, display_order: base + i + 1 }));
  const ins = await sb.from("deals").insert(rows);
  if (ins.error) return Response.json({ ok: false, error: ins.error.message }, { status: 500 });

  return Response.json({
    ok: true,
    registered: rows.length,
    skipped,
    byPlatform: rows.reduce<Record<string, number>>((acc, r) => {
      acc[r.platform] = (acc[r.platform] ?? 0) + 1;
      return acc;
    }, {}),
  });
}
