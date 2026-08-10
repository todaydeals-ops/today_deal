// 성분연구소 고유 콘텐츠 분류 — "그 성분이 무엇을 하겠다는 건가"로 나눈 6분류.
// 미백·주름은 식약처 기능성화장품 분류(미백/주름개선/자외선차단)와 결을 맞춘 묶음이다.
// 다이어트·바디는 체중감량 마케팅 성분 담당 — 근육·수행력(크레아틴·BCAA·HMB)은 알약연구소 소관이라 겹치지 않는다.
// ★새 글을 적재하면 반드시 여기 slugs에 등록해야 분류 페이지·관련글이 동작한다.
//   등록 누락은 `node scripts/magazine-catcheck.mjs`로 잡는다.
export interface BeautyCategory {
  key: string; // URL용 ASCII
  label: string; // 메뉴 라벨
  en: string; // 영문 서브
  color: string; // 점·강조색
  angle: string; // 핵심 앵글(목적 중심 설명)
  slugs: string[]; // 이 분류에 속한 글
}

export const BEAUTY_CATEGORIES: BeautyCategory[] = [
  {
    key: "barrier", label: "보습·장벽", en: "BARRIER", color: "#4a7c8a", angle: "건조함과 피부 장벽",
    slugs: ["ceramide-barrier","hyaluronic-acid-topical","skin-barrier-basics","panthenol-madecassoside","moisturizer-occlusive-humectant","centella-wound-repair","glycerin-humectant","squalane-moisturizer","ceramide-vs-cholesterol-ratio"],
  },
  {
    key: "renew", label: "미백·주름", en: "RENEW", color: "#8a7a3a", angle: "색소와 노화 개선",
    slugs: ["retinol-wrinkle","niacinamide-tone","vitamin-c-serum","tranexamic-azelaic-pigment","peptide-skincare","caffeine-eye-puffiness","retinaldehyde-retinoid","arbutin-whitening","vitamin-e-tocopherol-skin","ferulic-acid-antioxidant","resveratrol-topical"],
  },
  {
    key: "clear", label: "트러블·모공", en: "CLEAR", color: "#5a7a5a", angle: "여드름과 피지",
    slugs: ["bha-salicylic-pore","benzoyl-peroxide-acne","aha-pha-exfoliant","zinc-pca-sebum","azelaic-acid-acne-redness","adapalene-otc-retinoid"],
  },
  {
    key: "shield", label: "자외선·환경", en: "SHIELD", color: "#7a6a9a", angle: "자외선 차단과 외부 자극",
    slugs: ["sunscreen-spf-pa-science","physical-vs-chemical-sunscreen","sunscreen-reapplication-reality"],
  },
  {
    key: "hair", label: "두피·모발", en: "HAIR", color: "#6a5a4a", angle: "탈모와 두피 관리",
    slugs: ["minoxidil-hairloss","hairloss-shampoo-ingredient","scalp-care-dandruff","ketoconazole-scalp","rosemary-oil-hairloss"],
  },
  {
    key: "body", label: "다이어트·바디", en: "BODY", color: "#9a5a6a", angle: "체중감량과 바디케어",
    slugs: ["garcinia-weight","cla-body-fat","carnitine-fat-burn","green-tea-egcg","chromium-blood-sugar","dietary-fiber-satiety","glucomannan-appetite","capsaicin-thermogenesis"],
  },
];

const SLUG_TO_CAT: Record<string, BeautyCategory> = {};
for (const c of BEAUTY_CATEGORIES) for (const s of c.slugs) SLUG_TO_CAT[s] = c;

export function beautyCategoryOf(slug: string): BeautyCategory | undefined {
  return SLUG_TO_CAT[slug];
}
export function beautyCategoryByKey(key?: string): BeautyCategory | undefined {
  return BEAUTY_CATEGORIES.find((c) => c.key === key);
}
