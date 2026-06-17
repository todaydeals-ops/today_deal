// 링크프라이스 딥링크 변환 (G마켓·11번가 등 승인된 머천트 → 제휴 링크).
// 형식: https://{redirect}/click.php?m={merchant}&a={affiliateId}&l=9999&l_cd1=3&l_cd2=0&tu={encoded target}
// affiliateId는 공개 링크에 그대로 노출되는 값이라 비밀은 아니지만, env로 관리.

const REDIRECT_DOMAIN = "https://bestmore.net/click.php"; // LinkPrice 대표 도메인(선택값)

// LinkPrice 머천트 코드
// G마켓: 'gmarket'(일반 0.6%, 승인완료) / 'gmarket2'(프로모션 2.59%, 승인 시) — env로 전환
export function gmarketMerchant(): string {
  return process.env.LINKPRICE_GMARKET_MERCHANT || "gmarket";
}

// 링크프라이스 머천트 코드 (승인 현황: gmarket✅ / gmarket2·11st·aliexpress 대기)
export const LINKPRICE_MERCHANT = {
  gmarket: "gmarket", // 일반 0.6% (승인완료)
  gmarket2: "gmarket2", // 프로모션 2.59% (승인 시)
  "11st": "11st", // 11번가 1.05% (승인 시)
  aliexpress: "aliexpress", // 알리 6.3% (승인 시) — 알리 링크를 링크프라이스로도 생성 가능
} as const;

export function linkpriceDeeplink(merchant: string, targetUrl: string): string | null {
  const affiliateId = process.env.LINKPRICE_AFFILIATE_ID;
  if (!affiliateId || !targetUrl) return null;
  const params = new URLSearchParams({
    m: merchant,
    a: affiliateId,
    l: "9999",
    l_cd1: "3",
    l_cd2: "0",
    tu: targetUrl, // URLSearchParams가 자동 인코딩
  });
  return `${REDIRECT_DOMAIN}?${params.toString()}`;
}
