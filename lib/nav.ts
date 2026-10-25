// 대메뉴 4개 — 헤더 메뉴와 홈 메뉴 칸(CornerIndex)이 같은 데이터를 쓴다.
//
// ★2026-10-26 사장님 제안으로 재편: 생활백과 · AS 셀프체크 · 건강·뷰티(수면·영양제·뷰티 성분)
//   · 매거진(팩트체크·스마트가이드·트렌드랩). 그 전엔 코너 3개가 대메뉴, 분야 5개가 드롭다운이었다.
//   근거: AS 셀프체크가 검색 유입 대부분인데 드롭다운 안에 묻혀 있었고, 코너 3개는 주제가 아니라 형식이라 따로 세울 이유가 약했다.
// ★URL 은 하나도 바꾸지 않았다(색인 보호). 묶음은 메뉴에서만 생긴다 — 묶음 전용 페이지는 없다.
// ★메뉴를 바꿀 땐 여기 한 곳만 고친다.
import { BRANDS, type BrandKey } from "@/lib/brands";
import { CORNERS, CORNER_SHORT } from "@/lib/magazine/corners";

export interface NavItem {
  label: string;
  href: string;
  color: string;
  desc: string;
}

export interface NavGroup {
  key: string;
  label: string;
  en: string;
  desc: string;
  color: string;
  href?: string; // 단독 메뉴(바로 이동)
  items?: NavItem[]; // 묶음 메뉴(드롭다운)
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

export const NAV: NavGroup[] = [
  {
    key: "wiki", label: "생활백과", en: "WIKI", href: "/wiki", match: ["/wiki"], color: "#ff5a3c",
    desc: "세일 일정·성분·에러코드·영상 속 그 제품, 찾아보는 정본",
  },
  {
    key: "b4as", label: "AS 셀프체크", en: "SELF CHECK", href: brand("b4as").href, match: ["/b4as"], color: brand("b4as").color,
    desc: brand("b4as").desc,
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
