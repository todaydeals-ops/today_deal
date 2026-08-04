// 알약연구소 고유 콘텐츠 분류 — "몸의 어디에 쓰는 알약이냐"로 나눈 6분류. (오늘의딜 코너·잠자리연구소와 별개)
// 컬러는 임시(잠자리와 같은 저채도 톤). 브랜드 컬러 확정되면 color만 교체하면 된다.
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
    slugs: ["lutein-eye-supplement"],
  },
  {
    key: "joint", label: "관절·뼈", en: "JOINT", color: "#8a6a3a", angle: "무릎·허리와 뼈",
    slugs: [],
  },
  {
    key: "vital", label: "피로·간", en: "VITAL", color: "#3f6a8a", angle: "만성피로와 간",
    slugs: [],
  },
  {
    key: "shield", label: "면역·장", en: "SHIELD", color: "#5a7a6a", angle: "면역력과 장 건강",
    slugs: [],
  },
  {
    key: "flow", label: "혈관·심장", en: "FLOW", color: "#9a5a5a", angle: "혈행과 콜레스테롤",
    slugs: [],
  },
  {
    key: "care", label: "여성·남성", en: "CARE", color: "#9a5a7a", angle: "성별 맞춤 영양",
    slugs: [],
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
