// 나눔이벤트 데이터 접근. Supabase 설정 시 실DB, 아니면 mock 폴백.
import type { Giveaway, GiveawayType } from "@/lib/types";
import { mockGiveaways } from "@/data/mockGiveaways";
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
  };
}

export async function fetchGiveaways(): Promise<Giveaway[]> {
  const sb = getSupabaseServer();
  if (sb) {
    try {
      const { data, error } = await sb
        .from("giveaways")
        .select("*")
        .order("start_at", { ascending: false });
      if (!error && data && data.length > 0) {
        return (data as GiveawayRow[]).map(mapGiveaway);
      }
    } catch {
      // 폴백
    }
  }
  return mockGiveaways;
}
