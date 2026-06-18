// 추천딜 데이터 접근. Supabase 설정 시 실DB, 아니면 mock 폴백.
import type { CuratedDeal, CuratedCategory } from "@/lib/types";
import { getActiveCurated } from "@/data/mockCurated";
import { getSupabaseServer } from "@/lib/supabase/server";

interface CuratedRow {
  id: string;
  seq: number;
  slug: string | null;
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

function mapCurated(r: CuratedRow): CuratedDeal {
  return {
    id: r.id,
    seq: r.seq,
    slug: r.slug ?? undefined,
    productName: r.product_name,
    category: r.category,
    imageUrl: r.image_url ?? undefined,
    affiliateUrl: r.affiliate_url,
    discountRate: r.discount_rate ?? undefined,
    salePrice: r.sale_price,
    adminNote: r.admin_note ?? undefined,
    videoUrl: r.video_url ?? undefined,
    isActive: r.is_active,
  };
}

export async function fetchActiveCurated(): Promise<CuratedDeal[]> {
  const sb = getSupabaseServer();
  if (sb) {
    try {
      const { data, error } = await sb
        .from("curated_deals")
        .select("*")
        .eq("is_active", true)
        .order("seq", { ascending: false });
      if (!error && data && data.length > 0) {
        return (data as CuratedRow[]).map(mapCurated);
      }
    } catch {
      // 폴백
    }
  }
  return getActiveCurated();
}

// 개별 추천딜 페이지용 — slug 1건
export async function fetchCuratedBySlug(slug: string): Promise<CuratedDeal | null> {
  const sb = getSupabaseServer();
  if (sb) {
    try {
      const { data, error } = await sb
        .from("curated_deals")
        .select("*")
        .eq("slug", slug)
        .limit(1)
        .maybeSingle();
      if (!error && data) return mapCurated(data as CuratedRow);
    } catch {
      // 폴백
    }
  }
  // mock 폴백 (slug 없는 mock은 매칭 안 됨 → null)
  return getActiveCurated().find((d) => d.slug === slug) ?? null;
}

// 사이트맵용 — 활성 추천딜 slug 목록
export async function fetchCuratedSlugs(limit = 2000): Promise<string[]> {
  const sb = getSupabaseServer();
  if (sb) {
    try {
      const { data, error } = await sb
        .from("curated_deals")
        .select("slug")
        .eq("is_active", true)
        .not("slug", "is", null)
        .order("seq", { ascending: false })
        .limit(limit);
      if (!error && data) {
        return (data as { slug: string | null }[])
          .map((r) => r.slug)
          .filter((s): s is string => !!s);
      }
    } catch {
      // 폴백
    }
  }
  return [];
}
