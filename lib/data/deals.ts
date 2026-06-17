// 타임딜 데이터 접근. Supabase 설정 시 실DB, 아니면 mock 폴백.
import type { Deal, Platform } from "@/lib/types";
import { PLATFORM_ORDER } from "@/lib/types";
import { getDealsByPlatform } from "@/data/mockDeals";
import { getSupabaseServer } from "@/lib/supabase/server";

interface DealRow {
  id: string;
  platform: Platform;
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
        return groupByPlatform((data as DealRow[]).map(mapDeal));
      }
    } catch {
      // 폴백
    }
  }
  return mockByPlatform();
}
