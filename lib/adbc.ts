// ADBC CPS 딥링크 생성. 상품 URL을 redirect= 에 인코딩해 트래킹 링크로.
// (2026-06-24 직접 검증: redirect= 가 딥링크 파라미터 — 상품 페이지로 정확히 랜딩 + 클릭 추적)
const ADBC_MEDIA = "959081531";
const ADBC_AFF_ID = "app1"; // 오늘의딜 매체 식별값

// 머천트별 캠페인 ID (퀀텀비트 발급 CPS)
export const ADBC_CAMPAIGN = {
  ssg: "1259629521", // SSG.COM 3.00%
  emart: "450322980", // 이마트몰 3.00%
  ohou: "378130879", // 오늘의집 3.60%
  kurly: "1356118765", // 마켓컬리 3.60%
} as const;
export type AdbcMerchant = keyof typeof ADBC_CAMPAIGN;

// 상품 URL → ADBC 딥링크. sub1 = 우리 식별값(상품/회원/클릭ID).
export function adbcDeeplink(merchant: AdbcMerchant, productUrl: string, sub1: string): string {
  const cmp = ADBC_CAMPAIGN[merchant];
  return `https://adbc.io/${cmp}/${ADBC_MEDIA}?sub1=${encodeURIComponent(sub1)}&aff_id=${ADBC_AFF_ID}&redirect=${encodeURIComponent(productUrl)}`;
}
