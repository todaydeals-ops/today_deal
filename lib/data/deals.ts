// 타임딜 데이터 접근. Supabase 설정 시 실DB, 아니면 mock 폴백.
import type { Deal, Platform, DealBadge } from "@/lib/types";
import { PLATFORM_ORDER, BADGE_META } from "@/lib/types";
import { getDealsByPlatform } from "@/data/mockDeals";
import { getSupabaseServer } from "@/lib/supabase/server";

interface DealRow {
  id: string;
  platform: Platform;
  badge: string | null;
  product_name: string;
  image_url: string | null;
  product_url: string;
  affiliate_url: string | null;
  discount_rate: number | null;
  sale_price: number;
  original_price: number | null;
  free_shipping: boolean | null;
  deal_end_at: string | null;
  is_soldout: boolean | null;
}

function mapDeal(r: DealRow): Deal {
  return {
    id: r.id,
    platform: r.platform,
    badge: (r.badge as DealBadge) ?? undefined,
    productName: r.product_name,
    imageUrl: r.image_url ?? undefined,
    productUrl: r.product_url,
    affiliateUrl: r.affiliate_url ?? undefined,
    discountRate: r.discount_rate ?? 0,
    salePrice: r.sale_price,
    originalPrice: r.original_price ?? undefined,
    freeShipping: r.free_shipping ?? undefined,
    dealEndAt: r.deal_end_at ?? new Date().toISOString(),
    isSoldout: r.is_soldout ?? false,
  };
}

export function tierOf(d: Deal): number {
  return d.badge && BADGE_META[d.badge] ? BADGE_META[d.badge].tier : 2;
}

// 만료 딜 제외 — deal_end_at이 지난 카드는 타이머가 00:00:00으로 박제되므로 노출하지 않음.
// (deal_end_at이 비어 있으면 상시 노출로 간주.) 갱신이 지연돼도 죽은 타이머가 안 보임.
function isLiveRow(r: DealRow): boolean {
  if (!r.deal_end_at) return true;
  const end = new Date(r.deal_end_at).getTime();
  return Number.isNaN(end) || end > Date.now();
}

// 영구 딜 스냅샷 (개별 페이지·sitemap용)
export interface ArchiveDeal {
  slug: string;
  badge?: DealBadge;
  platform: Platform;
  productName: string;
  imageUrl?: string;
  affiliateUrl?: string;
  productUrl?: string;
  salePrice: number;
  discountRate: number;
  summary?: string;
  lastSeen?: string;
}

export async function fetchArchiveBySlug(slug: string): Promise<ArchiveDeal | null> {
  const sb = getSupabaseServer();
  if (!sb) return null;
  try {
    const { data, error } = await sb.from("deal_archive").select("*").eq("slug", slug).maybeSingle();
    if (error || !data) return null;
    const r = data as Record<string, unknown>;
    return {
      slug: String(r.slug),
      badge: (r.badge as DealBadge) ?? undefined,
      platform: r.platform as Platform,
      productName: String(r.product_name ?? ""),
      imageUrl: (r.image_url as string) || undefined,
      affiliateUrl: (r.affiliate_url as string) || undefined,
      productUrl: (r.product_url as string) || undefined,
      salePrice: Number(r.sale_price ?? 0),
      discountRate: Number(r.discount_rate ?? 0),
      summary: (r.summary as string) || undefined,
      lastSeen: (r.last_seen as string) || undefined,
    };
  } catch {
    return null;
  }
}

// 아카이브 브라우즈용 — 최근 스냅샷(이름·이미지 포함). 롱테일 딜 페이지 내부링크 허브.
export async function fetchArchiveRecent(limit = 120): Promise<ArchiveDeal[]> {
  const sb = getSupabaseServer();
  if (!sb) return [];
  try {
    const { data, error } = await sb
      .from("deal_archive")
      .select("*")
      .order("last_seen", { ascending: false })
      .limit(limit);
    if (error || !data) return [];
    return (data as Record<string, unknown>[]).map((r) => ({
      slug: String(r.slug),
      badge: (r.badge as DealBadge) ?? undefined,
      platform: r.platform as Platform,
      productName: String(r.product_name ?? ""),
      imageUrl: (r.image_url as string) || undefined,
      affiliateUrl: (r.affiliate_url as string) || undefined,
      productUrl: (r.product_url as string) || undefined,
      salePrice: Number(r.sale_price ?? 0),
      discountRate: Number(r.discount_rate ?? 0),
      summary: (r.summary as string) || undefined,
      lastSeen: (r.last_seen as string) || undefined,
    }));
  } catch {
    return [];
  }
}

export async function fetchArchiveSlugs(limit = 5000): Promise<string[]> {
  const sb = getSupabaseServer();
  if (!sb) return [];
  try {
    const { data } = await sb
      .from("deal_archive")
      .select("slug")
      .order("last_seen", { ascending: false })
      .limit(limit);
    return (data ?? []).map((d) => String((d as Record<string, unknown>).slug));
  } catch {
    return [];
  }
}

// 통합 피드: MD가 정한 순서(display_order) 그대로. 할인율 정렬 안 함. Supabase 없으면 mock 폴백.
export async function fetchUnifiedDeals(): Promise<Deal[]> {
  const sb = getSupabaseServer();
  if (sb) {
    try {
      const { data, error } = await sb
        .from("deals")
        .select("*")
        .order("display_order", { ascending: true });
      if (!error && data && data.length > 0) {
        return (data as DealRow[]).filter(isLiveRow).map(mapDeal);
      }
    } catch {
      // 폴백
    }
  }
  return PLATFORM_ORDER.flatMap((p) => getDealsByPlatform(p));
}

function groupByPlatform(deals: Deal[]): Record<Platform, Deal[]> {
  return Object.fromEntries(
    PLATFORM_ORDER.map((p) => [p, deals.filter((d) => d.platform === p)])
  ) as Record<Platform, Deal[]>;
}

function mockByPlatform(): Record<Platform, Deal[]> {
  return Object.fromEntries(
    PLATFORM_ORDER.map((p) => [p, getDealsByPlatform(p)])
  ) as Record<Platform, Deal[]>;
}

export async function fetchDealsByPlatform(): Promise<Record<Platform, Deal[]>> {
  const sb = getSupabaseServer();
  if (sb) {
    try {
      const { data, error } = await sb
        .from("deals")
        .select("*")
        .order("display_order", { ascending: true });
      if (!error && data && data.length > 0) {
        return groupByPlatform((data as DealRow[]).filter(isLiveRow).map(mapDeal));
      }
    } catch {
      // 폴백
    }
  }
  return mockByPlatform();
}
