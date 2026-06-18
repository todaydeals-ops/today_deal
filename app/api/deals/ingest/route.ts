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
  badge?: string; // 출처/코너 뱃지 (gmarket_openrun 등)
  productName?: string;
  imageUrl?: string;
  productUrl?: string;
  affiliateUrl?: string; // 소스가 이미 제휴링크를 줄 때(쿠팡 등)
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
  badge: string | null;
  product_name: string;
  image_url: string | null;
  product_url: string;
  affiliate_url: string | null;
  discount_rate: number | null;
  sale_price: number;
  deal_end_at: string;
  is_soldout: boolean;
}

const MAX = 200;
const PLATFORMS: Platform[] = ["gmarket", "11st", "ali", "coupang"];

// 상품 URL → 영구 슬러그 (상품당 1개, 중복 누적 방지)
function slugFor(platform: string, url: string): string | null {
  const m = url.match(/goodscode=(\d+)/) || url.match(/\/products\/(\d+)/) || url.match(/\/vp\/products\/(\d+)/);
  return m?.[1] ? `${platform}-${m[1]}` : null;
}

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
    // 제휴링크 우선: 소스 제공분(쿠팡) → 승인된 LinkPrice → 둘 다 없으면 원본 URL(클릭 정상, 수수료는 승인 후).
    const affiliate = d.affiliateUrl?.trim() || affiliateForPlatform(platform, url) || url;
    rows.push({
      platform,
      badge: d.badge ?? null,
      product_name: d.productName.trim(),
      image_url: d.imageUrl?.trim() || null,
      product_url: url,
      affiliate_url: affiliate,
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
          badge: null,
          product_name: meta.title,
          image_url: meta.imageUrl ?? null,
          product_url: url,
          affiliate_url: affiliateForPlatform(platform, url) ?? url,
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

  // replace 모드: "코너(badge) 단위"로 교체 → 코너별 독립 갱신(다른 코너 안 건드림).
  // badge 없는 구버전 행은 플랫폼 단위로 교체(badge null인 것만).
  if (body.replace) {
    const badges = [...new Set(rows.map((r) => r.badge).filter((b): b is string => !!b))];
    for (const bdg of badges) {
      const del = await sb.from("deals").delete().eq("badge", bdg);
      if (del.error) return Response.json({ ok: false, error: del.error.message }, { status: 500 });
    }
    const noBadgePlatforms = [...new Set(rows.filter((r) => !r.badge).map((r) => r.platform))];
    for (const p of noBadgePlatforms) {
      const del = await sb.from("deals").delete().eq("platform", p).is("badge", null);
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

  // 영구 스냅샷(deal_archive) — 상품당 1개 upsert. URL 영속(404 방지)·검색/AI 인용용. (테이블 없으면 무시)
  try {
    const seen = new Set<string>();
    const archive = [];
    for (const r of toInsert) {
      const slug = slugFor(r.platform, r.product_url);
      if (!slug || seen.has(slug)) continue;
      seen.add(slug);
      archive.push({
        slug,
        badge: r.badge,
        platform: r.platform,
        product_name: r.product_name,
        image_url: r.image_url,
        affiliate_url: r.affiliate_url,
        product_url: r.product_url,
        sale_price: r.sale_price,
        discount_rate: r.discount_rate,
        last_seen: new Date().toISOString(),
      });
    }
    if (archive.length) await sb.from("deal_archive").upsert(archive, { onConflict: "slug" });
  } catch {
    // deal_archive 미존재 시 패스
  }

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
