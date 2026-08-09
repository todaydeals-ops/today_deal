// 알약연구소 고유 콘텐츠 분류 — "몸의 어디에 쓰는 알약이냐"로 나눈 6분류. (오늘의딜 코너·잠자리연구소와 별개)
// ★새 글을 적재하면 반드시 여기 slugs에 등록해야 분류 페이지·관련글이 동작한다(누락 시 오늘의딜 코너명으로 폴백).
export interface PillCategory {
  key: string; // URL용 ASCII
  label: string; // 메뉴 라벨
  en: string; // 영문 서브
  color: string; // 점·강조색
  angle: string; // 핵심 앵글(대상 중심 설명)
  slugs: string[]; // 이 분류에 속한 글
}

export const PILL_CATEGORIES: PillCategory[] = [
  {
    key: "eye", label: "눈 건강", en: "EYE", color: "#4a7c59", angle: "눈 피로와 황반",
    slugs: ["dry-eye-omega-supplement","lutein-eye-supplement","astaxanthin-eye-fatigue","bilberry-anthocyanin-eye","vitamin-a-night-blindness","blue-light-supplement-claim","macular-degeneration-prevention"],
  },
  {
    key: "joint", label: "관절·뼈", en: "JOINT", color: "#8a6a3a", angle: "무릎·허리와 뼈",
    slugs: ["msm-joint-supplement","vitamin-d-deficiency-korea","vitamin-k2-bone","boswellia-arthritis","glucosamine-knee","muscle-cramp-magnesium","turmeric-curcumin","chondroitin-joint","hyaluronic-acid-oral","collagen-joint-vs-skin","osteoporosis-supplement","hmb-sarcopenia"],
  },
  {
    key: "vital", label: "피로·간", en: "VITAL", color: "#3f6a8a", angle: "만성피로와 간",
    slugs: ["coq10-energy","red-ginseng-ginsenoside","nmn-nad-antiaging","vitamin-b-complex-fatigue","milk-thistle-liver","adrenal-fatigue-myth"],
  },
  {
    key: "shield", label: "면역·장", en: "SHIELD", color: "#5a7a6a", angle: "면역력과 장 건강",
    slugs: ["probiotics-strain-guide","propolis-throat","gut-leaky-gut-claim","beta-glucan-immune","melatonin-vs-sleep-supplement","zinc-immune","multivitamin-worth-it"],
  },
  {
    key: "flow", label: "혈관·심장", en: "FLOW", color: "#9a5a5a", angle: "혈행과 콜레스테롤",
    slugs: ["policosanol-hdl","berberine-blood-sugar","omega3-form-rtg-ee","ginkgo-circulation","nattokinase-blood-clot","red-yeast-rice-cholesterol"],
  },
  {
    key: "care", label: "여성·남성", en: "CARE", color: "#9a5a7a", angle: "성별 맞춤 영양",
    slugs: ["iron-supplement-anemia","folate-pregnancy","soy-isoflavone-menopause","saw-palmetto-prostate","cranberry-uti","evening-primrose-gla","biotin-hair-nail"],
  },
];

const SLUG_TO_CAT: Record<string, PillCategory> = {};
for (const c of PILL_CATEGORIES) for (const s of c.slugs) SLUG_TO_CAT[s] = c;

export function pillCategoryOf(slug: string): PillCategory | undefined {
  return SLUG_TO_CAT[slug];
}
export function pillCategoryByKey(key?: string): PillCategory | undefined {
  return PILL_CATEGORIES.find((c) => c.key === key);
}
