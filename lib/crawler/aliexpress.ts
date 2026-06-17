// 알리익스프레스 Affiliate API 수집기 (서버 전용).
// 키(ALIEXPRESS_APP_KEY/SECRET/TRACKING_ID) 없으면 빈 배열 반환 → 파이프라인이 기존 보존.
// ⚠️ 서명/응답 매핑은 승인 후 실제 키로 검증 필요 (api-sg.aliexpress.com/sync, sha256).
import crypto from "crypto";
import type { CollectedDeal } from "./types";

const GATEWAY = "https://api-sg.aliexpress.com/sync";

// api-sg 시스템 서명: 모든 파라미터 key 오름차순 정렬 → k+v 연결 → HMAC-SHA256(secret) → hex 대문자
function sign(params: Record<string, string>, secret: string): string {
  const sorted = Object.keys(params).sort();
  const base = sorted.map((k) => k + params[k]).join("");
  return crypto.createHmac("sha256", secret).update(base).digest("hex").toUpperCase();
}

export async function collectAliexpress(): Promise<CollectedDeal[]> {
  const appKey = process.env.ALIEXPRESS_APP_KEY;
  const appSecret = process.env.ALIEXPRESS_APP_SECRET;
  const trackingId = process.env.ALIEXPRESS_TRACKING_ID;
  if (!appKey || !appSecret || !trackingId) return []; // 키 미발급 → 수집 보류

  const params: Record<string, string> = {
    method: "aliexpress.affiliate.hotproduct.query",
    app_key: appKey,
    timestamp: String(Date.now()),
    sign_method: "sha256",
    // business params
    tracking_id: trackingId,
    target_currency: "KRW",
    target_language: "KO",
    ship_to_country: "KR",
    page_size: "12",
    page_no: "1",
    // category_ids / keywords 로 "타임딜" 근사 (승인 후 조정)
  };
  params.sign = sign(params, appSecret);

  try {
    const url = `${GATEWAY}?${new URLSearchParams(params).toString()}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return [];
    const json = await res.json();
    // 응답 경로: aliexpress_affiliate_hotproduct_query_response.resp_result.result.products.product[]
    const products: unknown[] =
      json?.aliexpress_affiliate_hotproduct_query_response?.resp_result?.result?.products?.product ?? [];
    return products.slice(0, 12).map((it, i) => {
      const p = it as Record<string, unknown>;
      const sale = Number(String(p.target_sale_price ?? p.sale_price ?? "0").replace(/[^0-9.]/g, ""));
      const orig = Number(String(p.target_original_price ?? p.original_price ?? "0").replace(/[^0-9.]/g, ""));
      const discount = orig > 0 && sale > 0 ? Math.round((1 - sale / orig) * 100) : undefined;
      return {
        platform: "ali" as const,
        productName: String(p.product_title ?? ""),
        imageUrl: (p.product_main_image_url as string) || undefined,
        productUrl: String(p.product_detail_url ?? ""),
        affiliateUrl: (p.promotion_link as string) || undefined,
        discountRate: discount,
        salePrice: Math.round(sale),
        originalPrice: orig ? Math.round(orig) : undefined,
        isSoldout: false,
        displayOrder: i + 1,
      } satisfies CollectedDeal;
    }).filter((d) => d.productName && d.salePrice > 0);
  } catch {
    return [];
  }
}
