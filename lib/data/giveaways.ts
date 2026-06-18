// 나눔이벤트 데이터 접근 — 실DB(giveaways)만. (목업 폴백 제거: 등록분만 노출)
import type { Giveaway, GiveawayType } from "@/lib/types";
import { getSupabaseServer } from "@/lib/supabase/server";

interface GiveawayRow {
  id: string;
  type: GiveawayType;
  title: string;
  prize_name: string;
  prize_image: string | null;
  description: string | null;
  start_at: string;
  end_at: string;
  winner_count: number;
  affiliate_url: string | null;
  draw_at: string | null;
}

function mapGiveaway(r: GiveawayRow): Giveaway {
  return {
    id: r.id,
    type: r.type,
    title: r.title,
    prizeName: r.prize_name,
    prizeImage: r.prize_image ?? undefined,
    description: r.description ?? undefined,
    startAt: r.start_at,
    endAt: r.end_at,
    winnerCount: r.winner_count,
    affiliateUrl: r.affiliate_url ?? undefined,
    drawAt: r.draw_at ?? undefined,
  };
}

export async function fetchGiveaways(): Promise<Giveaway[]> {
  const sb = getSupabaseServer();
  if (!sb) return [];
  try {
    const { data, error } = await sb
      .from("giveaways")
      .select("*")
      .order("start_at", { ascending: false });
    if (!error && data) return (data as GiveawayRow[]).map(mapGiveaway);
  } catch {
    // 무시
  }
  return [];
}
