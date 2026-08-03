// 잠자리연구소 고유 콘텐츠 분류 — "잠이 주는 결과"로 나눈 6분류. (오늘의딜 코너와 별개)
export interface SleepCategory {
  key: string; // URL용 ASCII
  label: string; // 메뉴 라벨
  en: string; // 영문 서브(모노 라벨)
  color: string; // 점·강조색(저채도)
  angle: string; // 핵심 앵글(설명)
  slugs: string[]; // 이 분류에 속한 글
}

export const SLEEP_CATEGORIES: SleepCategory[] = [
  {
    key: "growth", label: "성장하는 잠", en: "GROWTH", color: "#4a7c59", angle: "우리 아이 성장 발달",
    slugs: ["baby-sleep-cycle-development", "baby-sleep-through-night", "sleep-training-methods-compare", "toddler-nap-night-sleep", "baby-sleep-environment-safety", "baby-sleep-regression-by-age", "toddler-separation-anxiety-sleep", "night-terror-vs-nightmare", "baby-swaddle-when-stop", "wake-window-by-age"],
  },
  {
    key: "study", label: "공부잘하는 잠", en: "FOCUS", color: "#3f6a8a", angle: "수험생 집중·기억력",
    slugs: ["sleep-academic-achievement", "teen-melatonin-phase-delay", "school-start-time-grades", "sleep-growth-hormone-height", "teen-bluelight-sleep", "teen-sleep-deprivation-mood", "allnighter-memory-consolidation", "cramming-vs-regular-sleep", "caffeine-halflife-sleep", "power-nap-cognition", "exam-anxiety-insomnia", "teen-morning-person-transition", "dream-memory-learning", "sleep-paralysis"],
  },
  {
    key: "work", label: "일잘하는 잠", en: "PERFORM", color: "#8a6a3a", angle: "직장인 피로와 생산성",
    slugs: ["sleep-debt-cognitive-performance", "sleep-deprivation-judgment", "shift-work-circadian", "social-jetlag-monday", "post-lunch-dip-coffee-nap", "burnout-insomnia-cycle", "business-trip-jetlag", "remote-work-sleep-rhythm", "microsleep-danger", "drowsy-driving-prevention", "exercise-timing-sleep", "alcohol-sleep-quality", "sleep-weight-appetite"],
  },
  {
    key: "harmony", label: "조화로운 잠", en: "BALANCE", color: "#9a5a7a", angle: "생체 리듬과 호르몬",
    slugs: ["menstrual-cycle-sleep", "pregnancy-sleep-position", "menopause-insomnia-night-sweats", "postpartum-sleep-deprivation", "breastfeeding-caffeine-sleep", "birth-control-pill-sleep", "pregnancy-early-fatigue", "pregnancy-late-insomnia"],
  },
  {
    key: "ageless", label: "늙지않는 잠", en: "AGELESS", color: "#5a7a6a", angle: "부모님 항노화·케어",
    slugs: ["aging-sleep-architecture", "senior-napping", "long-term-sleeping-pills", "sleep-dementia-risk", "nocturia-sleep", "parkinson-rbd", "sleep-apnea-snoring", "restless-legs-syndrome", "seasonal-oversleep-winter", "sleep-immune-function", "sleep-blood-sugar", "bruxism-teeth-grinding", "melatonin-supplement-truth"],
  },
  {
    key: "gear", label: "잠자리장비학", en: "GEAR", color: "#556070", angle: "침구·가전 과학 분석",
    slugs: ["daybed-family-bed-safety", "sleep-tracker-accuracy", "wake-up-light-effect", "bedroom-temp-humidity", "insomnia-sleep-hygiene"],
  },
];

const SLUG_TO_CAT: Record<string, SleepCategory> = {};
for (const c of SLEEP_CATEGORIES) for (const s of c.slugs) SLUG_TO_CAT[s] = c;

export function sleepCategoryOf(slug: string): SleepCategory | undefined {
  return SLUG_TO_CAT[slug];
}
export function sleepCategoryByKey(key?: string): SleepCategory | undefined {
  return SLEEP_CATEGORIES.find((c) => c.key === key);
}
