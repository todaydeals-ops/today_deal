// 외부 크롤러용 타임딜 자동 수집 엔드포인트 (머신-투-머신).
// 인증: CRON_SECRET (Authorization: Bearer <secret> 또는 body.secret).
//
// 입력 2가지 (둘 다 가능):
//  1) deals[]  — 크롤러(실제 브라우저)가 이미 추출한 완성 데이터. 서버는 페이지를 안 읽음.
//                ★ 지마켓 등 Cloudflare 차단 사이트는 반드시 이 방식(헤드리스 크롤러)으로.
//  2) urls[]   — 차단 안 되는 소스용. 서버가 OG 메타를 직접 fetch.
import type { Platform } from "@/lib/types";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { fetchUrlMeta, detectPlatform, affiliateForPlatform } from "@/lib/urlMeta";

interface FullRecord {
  platform?: Platform;
  productName?: string;
  imageUrl?: string;
  productUrl?: string;
  salePrice?: number;
  price?: number; // 별칭 허용
  discountRate?: number;
  dealEndAt?: string;
  isSoldout?: boolean;
}

interface IngestBody {
  secret?: string;
  deals?: FullRecord[];
  urls?: string[];
  endHours?: number;
  replace?: boolean;
}

interface SkipInfo {
  url: string;
  reason: string;
}

interface Row {
  platform: Platform;
  product_name: string;
  image_url: string | null;
  product_url: string;
  affiliate_url: string | null;
  discount_rate: number | null;
  sale_price: number;
  deal_end_at: string;
  is_soldout: boolean;
}

const MAX = 80;
const PLATFORMS: Platform[] = ["gmarket", "11st", "ali"];

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
  if ((bearer || body.secret) !== cronSecret) {
    return Response.json({ ok: false, error: "인증 실패" }, { status: 401 });
  }

  const sb = getSupabaseAdmin();
  if (!sb) return Response.json({ ok: false, error: "Supabase service_role 미설정" }, { status: 500 });

  const endHours = Number(body.endHours) > 0 ? Number(body.endHours) : 12;
  const dealEndAt = new Date(Date.now() + endHours * 3600 * 1000).toISOString();
  const skipped: SkipInfo[] = [];
  const rows: Row[] = [];

  // (1) 완성 데이터 (크롤러 추출분) — 서버 fetch 없음
  const records = Array.isArray(body.deals) ? body.deals.slice(0, MAX) : [];
  for (const d of records) {
    const platform = d.platform;
    const url = (d.productUrl ?? "").trim();
    const price = Number(d.salePrice ?? d.price ?? 0);
    if (!platform || !PLATFORMS.includes(platform)) {
      skipped.push({ url: url || d.productName || "", reason: "미지원 플랫폼" });
      continue;
    }
    if (!d.productName?.trim() || !url) {
      skipped.push({ url: url || d.productName || "", reason: "상품명/URL 부족" });
      continue;
    }
    if (!(price > 0)) {
      skipped.push({ url, reason: "가격 없음" });
      continue;
    }
    rows.push({
      platform,
      product_name: d.productName.trim(),
      image_url: d.imageUrl?.trim() || null,
      product_url: url,
      affiliate_url: affiliateForPlatform(platform, url),
      discount_rate: d.discountRate ?? null,
      sale_price: price,
      deal_end_at: d.dealEndAt ?? dealEndAt,
      is_soldout: !!d.isSoldout,
    });
  }

  // (2) URL 목록 — 서버가 OG 메타 fetch (차단 안 되는 소스용)
  let urls = Array.isArray(body.urls) ? body.urls.map((u) => String(u).trim()).filter(Boolean) : [];
  urls = [...new Set(urls)].filter((u) => /^https?:\/\//i.test(u)).slice(0, MAX);
  if (urls.length > 0) {
    await Promise.all(
      urls.map(async (url) => {
        const detected = detectPlatform(url);
        if (detected === "coupang") return void skipped.push({ url, reason: "쿠팡(추천딜 대상)" });
        if (detected === null) return void skipped.push({ url, reason: "미지원 플랫폼" });
        const platform = detected as Platform;
        const meta = await fetchUrlMeta(url);
        if (!meta.title) return void skipped.push({ url, reason: "상품명 미수집(차단/구조변경)" });
        if (!meta.price || meta.price <= 0) return void skipped.push({ url, reason: "가격 미수집" });
        rows.push({
          platform,
          product_name: meta.title,
          image_url: meta.imageUrl ?? null,
          product_url: url,
          affiliate_url: affiliateForPlatform(platform, url),
          discount_rate: null,
          sale_price: meta.price,
          deal_end_at: dealEndAt,
          is_soldout: false,
        });
      })
    );
  }

  if (rows.length === 0) {
    return Response.json({ ok: true, registered: 0, skipped });
  }

  // replace 모드: 등장한 플랫폼의 기존 딜 제거 후 교체
  if (body.replace) {
    const platforms = [...new Set(rows.map((r) => r.platform))];
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

  const toInsert = rows.map((r, i) => ({ ...r, display_order: base + i + 1 }));
  const ins = await sb.from("deals").insert(toInsert);
  if (ins.error) return Response.json({ ok: false, error: ins.error.message }, { status: 500 });

  return Response.json({
    ok: true,
    registered: toInsert.length,
    skipped,
    byPlatform: toInsert.reduce<Record<string, number>>((acc, r) => {
      acc[r.platform] = (acc[r.platform] ?? 0) + 1;
      return acc;
    }, {}),
  });
}
