// 대메뉴 4개 — 헤더 메뉴와 홈 메뉴 칸(CornerIndex)이 같은 데이터를 쓴다.
//
// ★2026-10-26 사장님 제안으로 재편: 생활백과 · AS 셀프체크 · 건강·뷰티(수면·영양제·뷰티 성분)
//   · 매거진(팩트체크·스마트가이드·트렌드랩). 그 전엔 코너 3개가 대메뉴, 분야 5개가 드롭다운이었다.
//   근거: AS 셀프체크가 검색 유입 대부분인데 드롭다운 안에 묻혀 있었고, 코너 3개는 주제가 아니라 형식이라 따로 세울 이유가 약했다.
//   같은 날 "생활백과·셀프체크도 서브 메뉴가 있을텐데"로 4개 모두 소메뉴를 단다 — 생활백과=항목 종류, AS=제품유형 9분류.
// ★URL 은 하나도 바꾸지 않았다(색인 보호). 묶음은 메뉴에서만 생긴다 — 건강·뷰티·매거진은 묶음 전용 페이지가 없다.
// ★메뉴를 바꿀 땐 여기 한 곳만 고친다.
import { BRANDS, type BrandKey } from "@/lib/brands";
import { CORNERS, CORNER_SHORT } from "@/lib/magazine/corners";
import { B4AS_CATEGORIES } from "@/lib/magazine/b4asCategories";

export interface NavItem {
  label: string;
  href: string;
  color: string;
  desc?: string;
}

export interface NavGroup {
  key: string;
  label: string;
  en: string;
  desc: string;
  color: string;
  href?: string; // 묶음 홈(있으면 드롭다운 맨 위 "전체 보기", 홈 메뉴 칸 제목 링크)
  items: NavItem[];
  match: string[]; // 이 경로로 시작하면 지금 보는 메뉴
}

const brand = (k: BrandKey): NavItem => {
  const b = BRANDS.find((x) => x.key === k)!;
  return { label: b.name, href: new URL(b.url).pathname, color: b.color, desc: b.desc };
};
const corner = (k: string): NavItem => {
  const c = CORNERS.find((x) => x.key === k)!;
  return { label: c.name, href: `/?corner=${k}`, color: c.color, desc: CORNER_SHORT[k] ?? c.desc };
};
const b4as = brand("b4as");

export const NAV: NavGroup[] = [
  {
    key: "wiki", label: "생활백과", en: "WIKI", href: "/wiki", match: ["/wiki"], color: "#ff5a3c",
    desc: "세일 일정·성분·에러코드·영상 속 그 제품, 찾아보는 정본",
    // 생활백과 홈(app/wiki/page.tsx)의 종류별 섹션 id 로 바로 간다. 에러코드는 사전 페이지가 따로 있다.
    items: [
      { label: "세일 달력", href: "/wiki#sale", color: "#c4553a", desc: "행사별 날짜·혜택, 확인 날짜까지" },
      { label: "영상 속 그 제품", href: "/wiki#video-pick", color: "#7a5f8a", desc: "영상에 나온 그 제품, 어느 회사 것인지" },
      { label: "성분", href: "/wiki#ingredient", color: "#4a7c59", desc: "성분 하나를 한 화면 정본으로" },
      { label: "가전 에러코드 사전", href: "/wiki/error-codes", color: "#38539a", desc: "브랜드·제품별 에러 표시 뜻" },
    ],
  },
  {
    key: "b4as", label: "AS 셀프체크", en: "SELF CHECK", href: b4as.href, match: ["/b4as"], color: b4as.color,
    desc: b4as.desc!,
    // 제품유형 9분류(b4asCategories). 분류 페이지 주소 규칙은 labHref 와 같다(/b4as?cat=<key>).
    items: B4AS_CATEGORIES.map((c) => ({ label: c.label, href: `${b4as.href}?cat=${c.key}`, color: c.color })),
  },
  {
    key: "health", label: "건강·뷰티", en: "HEALTH & BEAUTY", match: ["/goodsleep", "/pill", "/beauty"], color: brand("sleep").color,
    desc: "잠·영양제·화장품 성분, 근거부터 확인",
    items: [brand("sleep"), brand("pill"), brand("beauty")],
  },
  {
    key: "magazine", label: "매거진", en: "MAGAZINE", match: [], color: corner("factcheck").color,
    desc: "가전·리빙·디지털, 사기 전에 볼 기준",
    items: [corner("factcheck"), corner("smartguide"), corner("trendlab")],
  },
];
