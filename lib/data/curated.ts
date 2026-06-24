// 추천딜 데이터 접근 — 실DB(curated_deals)만. (목업 폴백 제거: 등록분만 노출)
import type { CuratedDeal, CuratedCategory } from "@/lib/types";
import { getSupabaseServer, getSupabaseAdmin } from "@/lib/supabase/server";

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
  if (/두유|우유|김\b|간짜장|소시지|즙|차\b|과자|쌀|라면|커피|음료|주스|생수|닭가슴살|간식|오리|장아찌|반찬|유산균|건강식|즉석|밥|만두|떡|견과|갈비|치킨|핫도그|돈까스|돈가스|고기|한우|삼겹|불고기|김치|생선|고등어|오징어|새우|장어|회\b|과일|사과|수박|복숭아|딸기|포도|귤|체리|망고|토마토|채소|야채|나물|두부|계란|달걀|빵|쿠키|초콜릿|아이스크림|국수|파스타|소스|양념|참기름|올리브유|꿀\b|잼\b|시리얼|요거트|치즈|버터|햄\b|어묵|떡볶이|순대|족발|곱창|핫바|만두|핫팩|육포|건어물|젓갈|장류|된장|고추장|식초|설탕|소금|밀가루|식용유|통조림|즉석밥|컵밥|국밥|탕\b|찌개/.test(s)) return "식품";
  return "생활";
}

// 오늘의 AI추천딜 = CPS 제휴몰(마켓컬리·이마트몰 등) 특가. board_deals(board_type=cps)에서 노출.
// (쿠팡 정지 후 그 자리를 ADBC CPS 머천트 딜로 대체 — 카드 클릭 시 ADBC 딥링크로 추적·이동)
export async function fetchActiveCurated(): Promise<CuratedDeal[]> {
  const sb = getSupabaseAdmin(); // board_deals는 RLS로 익명 읽기 차단 → service_role 필요
  if (!sb) return [];
  try {
    const { data, error } = await sb
      .from("board_deals")
      .select("id, title, shop, image_url, affiliate_url, source_url, price, created_at")
      .eq("board_type", "cps")
      .eq("is_published", true)
      .order("created_at", { ascending: false })
      .limit(120);
    if (error || !data) return [];
    const raw = data as Array<{ id: string; title: string; shop: string | null; image_url: string | null; affiliate_url: string | null; source_url: string; price: number | null; created_at: string }>;
    // 몰별로 번갈아 배치(컬리·이마트·컬리·이마트…) — 한 몰이 몰려 나오지 않게
    const groups = new Map<string, typeof raw>();
    for (const r of raw) {
      const k = r.shop ?? "기타";
      if (!groups.has(k)) groups.set(k, []);
      groups.get(k)!.push(r);
    }
    const lists = [...groups.values()];
    const rows: typeof raw = [];
    for (let i = 0; rows.length < raw.length; i++) {
      let any = false;
      for (const l of lists) if (i < l.length) { rows.push(l[i]); any = true; }
      if (!any) break;
    }
    return rows.map((r, i) => ({
      id: r.id,
      seq: rows.length - i, // 위쪽이 큰 번호(최신/상위)
      slug: undefined, // slug 없음 → 카드가 ADBC 딥링크로 바로 이동
      productName: r.title,
      category: inferCategory(r.title),
      imageUrl: r.image_url ?? undefined,
      affiliateUrl: r.affiliate_url || r.source_url,
      discountRate: undefined,
      salePrice: r.price ?? 0,
      adminNote: r.shop ?? undefined, // 몰 이름(마켓컬리/이마트몰)
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
