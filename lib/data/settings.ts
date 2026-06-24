// 사이트 설정(key-value jsonb). 추천딜 헤더(배너/프로필) 등.
import { getSupabaseAdmin } from "@/lib/supabase/server";

export interface RecHeader {
  mode: "banner" | "profile";
  // 배너 모드
  badge?: string;
  title: string;
  subtitle: string;
  ctaText?: string;
  ctaUrl?: string;
  // 프로필 모드
  name?: string;
  handle?: string;
  tagline?: string;
  instagramUrl?: string;
}

export const DEFAULT_REC_HEADER: RecHeader = {
  mode: "banner",
  badge: "🤖 AI추천",
  title: "AI가 골라낸 오늘의 추천딜",
  subtitle: "마켓컬리·이마트 등 인기몰 특가를 AI가 추려 한곳에 모았어요.",
  ctaText: "",
  ctaUrl: "",
  name: "오늘의딜 큐레이터",
  handle: "@oneuldeal_pick",
  tagline: "인생 꿀템만 직접 써보고 골라 추천해요 🛒",
  instagramUrl: "https://instagram.com/",
};

const KEY = "recommended_header";

export async function getRecommendedHeader(): Promise<RecHeader> {
  const sb = getSupabaseAdmin();
  if (sb) {
    try {
      const { data } = await sb.from("settings").select("value").eq("key", KEY).maybeSingle();
      if (data?.value) return { ...DEFAULT_REC_HEADER, ...(data.value as Partial<RecHeader>) };
    } catch {
      // 폴백
    }
  }
  return DEFAULT_REC_HEADER;
}

export async function saveRecommendedHeader(value: RecHeader): Promise<{ ok: boolean; error?: string }> {
  const sb = getSupabaseAdmin();
  if (!sb) return { ok: false, error: "Supabase service_role 미설정" };
  const { error } = await sb
    .from("settings")
    .upsert({ key: KEY, value, updated_at: new Date().toISOString() }, { onConflict: "key" });
  return error ? { ok: false, error: error.message } : { ok: true };
}
