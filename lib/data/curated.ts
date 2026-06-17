// 추천딜 데이터 접근. Supabase 설정 시 실DB, 아니면 mock 폴백.
import type { CuratedDeal, CuratedCategory } from "@/lib/types";
import { getActiveCurated } from "@/data/mockCurated";
import { getSupabaseServer } from "@/lib/supabase/server";

interface CuratedRow {
  id: string;
  seq: number;
  product_name: string;
  category: CuratedCategory;
  image_url: string | null;
  affiliate_url: string;
  discount_rate: number | null;
  sale_price: number;
  admin_note: string | null;
  is_active: boolean;
}

function mapCurated(r: CuratedRow): CuratedDeal {
  return {
    id: r.id,
    seq: r.seq,
    productName: r.product_name,
    category: r.category,
    imageUrl: r.image_url ?? undefined,
    affiliateUrl: r.affiliate_url,
    discountRate: r.discount_rate ?? undefined,
    salePrice: r.sale_price,
    adminNote: r.admin_note ?? undefined,
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
