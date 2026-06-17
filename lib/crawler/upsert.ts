// 수집 결과를 Supabase deals 테이블에 반영 (서버 전용, service_role).
// 플랫폼별 "교체" 방식: 기존 삭제 후 새로 삽입 (플랫폼 노출 순서 신뢰, 재정렬 없음 — 기획안 3.1).
// ⚠️ 빈 결과(수집 실패)면 삭제하지 않고 기존 유지 → 사이트가 빈 화면이 되거나 틀린 정보가 뜨는 걸 방지.
import { getSupabaseAdmin } from "@/lib/supabase/server";
import type { Platform } from "@/lib/types";
import type { CollectedDeal } from "./types";

export interface UpsertResult {
  platform: Platform;
  ok: boolean;
  count: number;
  skipped?: boolean;
  error?: string;
}

export async function replaceDeals(
  platform: Platform,
  deals: CollectedDeal[]
): Promise<UpsertResult> {
  const sb = getSupabaseAdmin();
  if (!sb) return { platform, ok: false, count: 0, error: "Supabase service_role 미설정" };

  // 수집 0건이면 보존 (덮어쓰지 않음)
  if (deals.length === 0) return { platform, ok: true, count: 0, skipped: true };

  const del = await sb.from("deals").delete().eq("platform", platform);
  if (del.error) return { platform, ok: false, count: 0, error: del.error.message };

  const rows = deals.map((d) => ({
    platform: d.platform,
    product_name: d.productName,
    image_url: d.imageUrl ?? null,
    product_url: d.productUrl,
    affiliate_url: d.affiliateUrl ?? null,
    discount_rate: d.discountRate ?? null,
    sale_price: d.salePrice,
    original_price: d.originalPrice ?? null,
    deal_end_at: d.dealEndAt ?? null,
    is_soldout: d.isSoldout ?? false,
    display_order: d.displayOrder,
  }));

  const ins = await sb.from("deals").insert(rows);
  if (ins.error) return { platform, ok: false, count: 0, error: ins.error.message };

  return { platform, ok: true, count: rows.length };
}
