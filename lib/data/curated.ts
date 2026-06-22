// 추천딜 데이터 접근 — 실DB(curated_deals)만. (목업 폴백 제거: 등록분만 노출)
import type { CuratedDeal, CuratedCategory } from "@/lib/types";
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

// 상품명 → 추천딜 카테고리(5종) 추정
function inferCategory(name: string): CuratedCategory {
  const s = name.toLowerCase();
  if (/tv|청소기|선풍기|에어컨|드라이어|드라이기|이어폰|워치|충전|블루투스|모니터|키보드|마우스|냉온풍|서큘레이터|전기|가전|스피커|면도기/.test(s)) return "가전";
  if (/프라이팬|팬\b|냄비|그릇|식기|텀블러|도시락|주방|칼\b|도마|밀폐|컵\b|수세미|조리|커틀러리|젓가락/.test(s)) return "주방";
  if (/선반|진열장|책상|의자|수납|행거|가구|매트|침대|소파|서랍|옷장/.test(s)) return "가구";
  if (/두유|우유|김\b|간짜장|소시지|즙\b|\b차\b|과자|쌀\b|라면|커피|음료|닭가슴살|간식|오리|장아찌|반찬|유산균|건강식|즉석|밥\b|만두|떡\b|견과/.test(s)) return "식품";
  return "생활";
}

// 추천딜 = 쿠팡 골드박스(특가). curated_deals는 비활성/미사용 — 쿠팡을 추천딜로 노출.
export async function fetchActiveCurated(): Promise<CuratedDeal[]> {
  const sb = getSupabaseServer();
  if (!sb) return [];
  try {
    const { data, error } = await sb
      .from("deals")
      .select("id, product_name, image_url, product_url, affiliate_url, discount_rate, sale_price, display_order")
      .eq("platform", "coupang")
      .order("display_order", { ascending: true });
    if (error || !data) return [];
    const rows = data as Array<{ id: string; product_name: string; image_url: string | null; product_url: string; affiliate_url: string | null; discount_rate: number | null; sale_price: number; display_order: number | null }>;
    return rows.map((r, i) => ({
      id: r.id,
      seq: rows.length - i, // 위쪽이 큰 번호(최신/상위)
      slug: undefined, // slug 없음 → 카드가 쿠팡 제휴링크로 바로 이동
      productName: r.product_name,
      category: inferCategory(r.product_name),
      imageUrl: r.image_url ?? undefined,
      affiliateUrl: r.affiliate_url || r.product_url,
      discountRate: r.discount_rate ?? undefined,
      salePrice: r.sale_price,
      adminNote: undefined,
      videoUrl: undefined,
      isActive: true,
    }));
  } catch {
    // 무시
  }
  return [];
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
      // 무시
    }
  }
  return null;
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
