// 협찬연구소 고유 분류 — "협찬이 어디로 흘러 들어오는가"로 나눈 6분류.
//
// 다른 버티컬은 주제(수면·성분·기기)로 나누지만 여기는 **경로**로 나눈다.
// 낮 시간대 프로그램은 외주제작사가 제작비를 자체 조달하는 구조라 협찬이 불가피하고,
// 그 돈이 들어오는 통로가 곧 분류다.
//
// ★새 글을 적재하면 반드시 여기 slugs에 등록해야 분류 페이지·관련글이 동작한다.
//   등록 누락은 `node scripts/magazine-catcheck.mjs`로 잡는다.
export interface SponsorCategory {
  key: string; // URL용 ASCII
  label: string; // 메뉴 라벨
  en: string; // 영문 서브
  color: string; // 점·강조색
  angle: string; // 핵심 앵글
  slugs: string[]; // 이 분류에 속한 글
}

export const SPONSOR_CATEGORIES: SponsorCategory[] = [
  {
    key: "linked", label: "연계편성", en: "LINKED", color: "#3f5a7a",
    angle: "정보 프로그램과 홈쇼핑 판매의 시각 대조",
    slugs: ["linked-programming-basics","linked-programming-numbers"],
  },
  {
    key: "health", label: "건강정보와 전문가", en: "EXPERT", color: "#4a7c59",
    angle: "전문가 출연이 신뢰 장치로 쓰이는 구조",
    slugs: ["health-food-broadcast-sanctions"],
  },
  {
    key: "place", label: "맛집과 업체 소개", en: "PLACE", color: "#8a6a3a",
    angle: "낮 정보 프로그램의 업체·병원 노출",
    slugs: [],
  },
  {
    key: "product", label: "생활용품과 렌털", en: "PRODUCT", color: "#7a5f8a",
    angle: "리빙 제품·렌털·상조의 방송 노출",
    slugs: [],
  },
  {
    key: "rule", label: "제도와 규제", en: "RULE", color: "#8a4a4a",
    angle: "실태조사·심의 제재·협찬 고지 제도",
    slugs: ["sponsorship-disclosure-gap","youtube-vs-broadcast-adrule"],
  },
  {
    key: "basics", label: "편성표 읽는 법", en: "BASICS", color: "#5b6470",
    angle: "협찬고지·간접광고·PPL 구분과 편성표 보는 법",
    slugs: [],
  },
];

const SLUG_TO_CAT: Record<string, SponsorCategory> = {};
for (const c of SPONSOR_CATEGORIES) for (const s of c.slugs) SLUG_TO_CAT[s] = c;

export function sponsorCategoryOf(slug: string): SponsorCategory | undefined {
  return SLUG_TO_CAT[slug];
}
export function sponsorCategoryByKey(key?: string): SponsorCategory | undefined {
  return SPONSOR_CATEGORIES.find((c) => c.key === key);
}
