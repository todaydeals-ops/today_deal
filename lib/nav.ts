// 대메뉴 4개 × 소메뉴 3개 — 헤더 메뉴와 홈 메뉴 칸(CornerIndex)이 같은 데이터를 쓴다.
//
// ★2026-10-26 사장님 제안으로 재편(세 번에 걸쳐 확정):
//   ① 대메뉴 4개: 생활백과 · AS 셀프체크 · 건강·뷰티(수면·영양제·뷰티 성분) · 매거진(팩트체크·스마트가이드·트렌드랩)
//      근거: AS 셀프체크가 검색 유입 대부분인데 드롭다운 안에 묻혀 있었고, 코너 3개는 주제가 아니라 형식이었다.
//   ② "생활백과·셀프체크도 서브 메뉴가 있을텐데" → 4개 모두 소메뉴
//   ③ "서브메뉴를 3가지로 구분 — 대메뉴 4개에 각 서브메뉴 3단" → 4×3 로 통일
//      - AS 9분류는 3묶음×3분류(가전·디지털·헬스·통신·자동차). AS 만 3단계(대메뉴 › 묶음 › 분류)다.
//      - 가전 에러코드 사전은 AS 로 옮겼다 — 고장 난 사람이 찾는 곳이고, 사전 자체가 AS 글로 보내는 색인이다(주소는 /wiki/error-codes 그대로).
// ★URL 은 하나도 바꾸지 않았다(색인 보호). 묶음은 메뉴에서만 생긴다 — 묶음 전용 페이지는 없다.
// ★메뉴를 바꿀 땐 여기 한 곳만 고친다.
import { BRANDS, type BrandKey } from "@/lib/brands";
import { CORNERS, CORNER_SHORT } from "@/lib/magazine/corners";
import { B4AS_CATEGORIES } from "@/lib/magazine/b4asCategories";

export interface NavItem {
  label: string;
  href?: string; // 묶음 머리(AS 의 가전·디지털 등)는 페이지가 없어 비운다
  color: string;
  desc?: string;
  children?: NavItem[]; // 3단계(AS 묶음 › 분류)
}

export interface NavGroup {
  key: string;
  label: string;
  en: string;
  desc: string;
  color: string;
  href?: string; // 묶음 홈(있으면 드롭다운 맨 위 "전체 보기", 홈 메뉴 칸 제목 링크)
  extras?: NavItem[]; // 소메뉴 3개와 별도로 맨 위에 두는 바로가기(AS 의 에러코드 사전)
  items: NavItem[]; // 소메뉴 3개
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
// AS 제품유형 분류 하나. 분류 페이지 주소 규칙은 labHref 와 같다(/b4as?cat=<key>).
const asCat = (k: string): NavItem => {
  const c = B4AS_CATEGORIES.find((x) => x.key === k)!;
  return { label: c.label, href: `${b4as.href}?cat=${k}`, color: c.color, desc: c.angle };
};

export const NAV: NavGroup[] = [
  {
    key: "wiki", label: "생활백과", en: "WIKI", href: "/wiki", match: ["/wiki"], color: "#ff5a3c",
    desc: "세일 일정·영상 속 그 제품·가전 에러코드, 찾아보는 정본",
    // 생활백과 홈(app/wiki/page.tsx)의 종류별 섹션 id 로 바로 간다.
    // ★성분은 10-26 뺐다(사장님 "뷰티 성분·영양제 부분하고 중첩") — 항목 4개는 분야 글로 301(proxy.ts WIKI_MERGED).
    //   빈 셋째 칸에 에러코드 사전을 다시 넣었다. AS 메뉴의 바로가기와 겹쳐 두 메뉴에 다 있다(사전은 찾아보는 정본이자 AS 색인).
    items: [
      { label: "세일 달력", href: "/wiki#sale", color: "#c4553a", desc: "행사별 날짜·혜택, 확인 날짜까지" },
      { label: "영상 속 그 제품", href: "/wiki#video-pick", color: "#7a5f8a", desc: "영상에 나온 그 제품, 어느 회사 것인지" },
      { label: "가전 에러코드 사전", href: "/wiki/error-codes", color: "#38539a", desc: "브랜드·제품별 에러 표시 뜻" },
    ],
  },
  {
    key: "b4as", label: "AS 셀프체크", en: "SELF CHECK", href: b4as.href, match: ["/b4as", "/wiki/error-codes"], color: b4as.color,
    desc: b4as.desc!,
    extras: [{ label: "가전 에러코드 사전", href: "/wiki/error-codes", color: "#38539a", desc: "브랜드·제품별 에러 표시 뜻" }],
    // 9분류를 3묶음×3분류로. 글 수(10-26): 가전 66 · 디지털 61 · 헬스·통신·자동차 51
    items: [
      { label: "가전", color: "#3f7a6a", children: [asCat("major"), asCat("kitchen"), asCat("living")] },
      { label: "디지털", color: "#38539a", children: [asCat("mobile"), asCat("pc"), asCat("av")] },
      { label: "헬스·통신·자동차", color: "#8a5a3a", children: [asCat("wellness"), asCat("service"), asCat("car")] },
    ],
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
