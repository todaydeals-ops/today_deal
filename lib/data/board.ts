// 제보딜 게시판(에이전트 큐레이션) 데이터 접근.
import { getSupabaseAdmin } from "@/lib/supabase/server";

// 4종 보드
export const BOARD_TYPES = [
  { key: "hot", label: "핫딜", desc: "실시간 상품 특가·할인" },
  { key: "overseas", label: "해외직구", desc: "알리·아마존·아이허브 등 직구 딜" },
  { key: "free", label: "무료/이벤트", desc: "공짜·사은품·체험단·이벤트" },
  { key: "coupon", label: "쿠폰/적립", desc: "할인쿠폰·적립·프로모코드" },
] as const;
export type BoardType = (typeof BOARD_TYPES)[number]["key"];
export function boardTypeLabel(t?: string): string {
  return BOARD_TYPES.find((x) => x.key === t)?.label ?? "핫딜";
}
export function isBoardType(t?: string): t is BoardType {
  return BOARD_TYPES.some((x) => x.key === t);
}

export const BOARD_CATEGORIES = [
  "전자/IT",
  "생활/주방",
  "식품",
  "뷰티/패션",
  "패션잡화",
  "유아동",
  "스포츠/취미",
  "기타",
] as const;
export type BoardCategory = (typeof BOARD_CATEGORIES)[number];

export interface BoardDeal {
  id: string;
  slug?: string;
  boardType: string;
  title: string;
  shop?: string;
  category?: string;
  price?: number;
  shipping?: string;
  imageUrl?: string;
  sourceUrl: string;
  affiliateUrl?: string;
  author?: string;
  body?: string;
  votes: number;
  createdAt?: string;
}

interface Row {
  id: string;
  slug: string | null;
  board_type: string | null;
  title: string;
  shop: string | null;
  category: string | null;
  price: number | null;
  shipping: string | null;
  image_url: string | null;
  source_url: string;
  affiliate_url: string | null;
  author: string | null;
  body: string | null;
  votes: number;
  is_published: boolean;
  created_at: string;
}

function map(r: Row): BoardDeal {
  return {
    id: r.id,
    slug: r.slug ?? undefined,
    boardType: r.board_type ?? "hot",
    title: r.title,
    shop: r.shop ?? undefined,
    category: r.category ?? undefined,
    price: r.price ?? undefined,
    shipping: r.shipping ?? undefined,
    imageUrl: r.image_url ?? undefined,
    sourceUrl: r.source_url,
    affiliateUrl: r.affiliate_url ?? undefined,
    author: r.author ?? undefined,
    body: r.body ?? undefined,
    votes: r.votes ?? 0,
    createdAt: r.created_at,
  };
}

export async function fetchBoardDeals(
  limit = 60,
  opts?: { type?: string; category?: string }
): Promise<BoardDeal[]> {
  const sb = getSupabaseAdmin();
  if (!sb) return [];
  try {
    let q = sb.from("board_deals").select("*").eq("is_published", true).order("created_at", { ascending: false }).limit(limit);
    if (opts?.type && isBoardType(opts.type)) q = q.eq("board_type", opts.type);
    if (opts?.category && opts.category !== "전체") q = q.eq("category", opts.category);
    const { data, error } = await q;
    if (error || !data) return [];
    return (data as Row[]).map(map);
  } catch {
    return [];
  }
}

export async function fetchBoardBySlug(slug: string): Promise<BoardDeal | null> {
  const sb = getSupabaseAdmin();
  if (!sb) return null;
  try {
    const { data, error } = await sb.from("board_deals").select("*").eq("slug", slug).limit(1).maybeSingle();
    if (error || !data) return null;
    return map(data as Row);
  } catch {
    return null;
  }
}

export async function fetchBoardSlugs(limit = 2000): Promise<string[]> {
  const sb = getSupabaseAdmin();
  if (!sb) return [];
  try {
    const { data } = await sb
      .from("board_deals")
      .select("slug")
      .eq("is_published", true)
      .not("slug", "is", null)
      .order("created_at", { ascending: false })
      .limit(limit);
    return ((data as { slug: string | null }[]) ?? []).map((r) => r.slug).filter((s): s is string => !!s);
  } catch {
    return [];
  }
}
