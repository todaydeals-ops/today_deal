// 제보딜 게시판(에이전트 큐레이션) 데이터 접근.
import { getSupabaseAdmin } from "@/lib/supabase/server";

// 3종 보드 (해외직구는 핫딜 하위 카테고리로 강등)
export const BOARD_TYPES = [
  { key: "hot", label: "핫딜", desc: "실시간 상품 특가·할인" },
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

// 카테고리 통합(8→6) + 해외직구를 카테고리로
export const BOARD_CATEGORIES = ["전자/IT", "식품", "생활/주방", "패션/뷰티", "해외직구", "기타"] as const;
export type BoardCategory = (typeof BOARD_CATEGORIES)[number];

// ── 활성 연출 헬퍼 (사람 많아 보이게) ──
const NICKS = [
  "지름신", "알뜰왕", "핫딜요정", "득템각", "오늘도지름", "세일헌터", "가성비탐험대", "장바구니요정",
  "폭탄세일", "핫딜브로", "아껴쓰자", "직구러", "쿠폰마스터", "최저가사냥꾼", "지갑방어실패", "쟁여요",
  "오늘의호구", "특가알리미", "월급요정", "텅장지킴이",
];
function hash(seed: string, salt = 31): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * salt + seed.charCodeAt(i)) >>> 0;
  return h;
}
// 자동수집 글의 표시 닉네임(작성자 미상인 봇 시딩 글의 표기용 — 고정).
export function nickFor(seed: string): string {
  return NICKS[hash(seed) % NICKS.length];
}
// 조회수·추천수·보는중은 더 이상 연출하지 않음 — 모두 실제 데이터만 노출(정직성·표시광고법).

export interface BoardDeal {
  id: string;
  slug?: string;
  boardType: string;
  title: string;
  shop?: string;
  category?: string;
  views?: number;
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
  views: number | null;
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
    views: r.views ?? 0,
    createdAt: r.created_at,
  };
}

// 조회수 +1 (post 페이지 렌더 시 — best effort)
export async function bumpBoardView(slug: string): Promise<void> {
  const sb = getSupabaseAdmin();
  if (!sb) return;
  try {
    await sb.rpc("bump_board_view", { p_slug: slug });
  } catch {
    // 무시
  }
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
