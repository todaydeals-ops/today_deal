// 글 하나가 어느 브랜드 소유인지 판별한다. 중복 URL 제거의 기준점이다.
//
// ★왜 필요한가
// 서브도메인 4개가 모두 같은 Next 앱을 서빙해서, /magazine/<slug> 가 www 포함
// 5개 호스트에서 전부 200으로 열렸다. 콘텐츠 468편이 URL 2,340개로 보인 것이다.
// canonical 이 한 곳을 가리켜도, 권위가 없는 신규 도메인에서는 크롤 예산을 5배로
// 낭비하는 순간 색인이 멈춘다("발견됨 · 색인 생성 안 됨").
//
// 그래서 **아티클의 주인 호스트를 하나로 정하고 나머지는 301** 로 접는다.
//
// ★주인은 www 다. 서브도메인이 아니다.
// 2026-08-10 서치콘솔 실측에서 www/magazine/* AS 글들이 이미 색인되고 클릭을 받고
// 있었다(정수기·오븐·인덕션·닌텐도, 증상형 롱테일). 한때 이 글들을 브랜드 서브도메인이
// 주인이 되게 바꿨다가 되돌렸다 — 순위가 붙은 페이지를 이력 0인 새 호스트로 옮기면
// 재색인 몇 주 동안 순위를 잃는다. 얻을 것보다 잃을 게 크다.
//
// 브랜드 경험은 호스트로 만들지 않는다. 아티클 페이지가 글의 field·corner 를 보고
// 헤더·푸터·분류를 갈아끼우므로, www/magazine/<AS글>도 AS연구소 화면으로 렌더된다.
// 서브도메인은 브랜드 입구(홈·분류)로 남고, 아티클 링크는 www 로 모은다.
import { SLEEP_CATEGORIES } from "@/lib/magazine/sleepCategories";
import { PILL_CATEGORIES } from "@/lib/magazine/pillCategories";
import { BEAUTY_CATEGORIES } from "@/lib/magazine/beautyCategories";
import { B4AS_CATEGORIES } from "@/lib/magazine/b4asCategories";
import { SUB_ORIGIN } from "@/lib/magazine/subdomain";

export type OwnerKey = "deal" | "sleep" | "pill" | "beauty" | "b4as";

export const OWNER_ORIGIN: Record<OwnerKey, string> = {
  deal: "https://www.todaydeals.co.kr",
  sleep: SUB_ORIGIN.sleep,
  pill: SUB_ORIGIN.pill,
  beauty: SUB_ORIGIN.beauty,
  b4as: SUB_ORIGIN.b4as,
};

/** 서브도메인 접두어 → 브랜드 키. www·기타는 deal. */
export function ownerFromHost(host: string): OwnerKey {
  const h = (host || "").toLowerCase();
  if (h.startsWith("goodsleep.")) return "sleep";
  if (h.startsWith("pill.")) return "pill";
  if (h.startsWith("beauty.")) return "beauty";
  if (h.startsWith("b4as.")) return "b4as";
  return "deal";
}

// 택소노미의 slugs[] 를 그대로 소유권 대장으로 쓴다.
// 어느 택소노미에도 없으면 오늘의딜 매거진 글이다.
const OWN = new Map<string, OwnerKey>();
for (const c of SLEEP_CATEGORIES) for (const s of c.slugs) OWN.set(s, "sleep");
for (const c of PILL_CATEGORIES) for (const s of c.slugs) OWN.set(s, "pill");
for (const c of BEAUTY_CATEGORIES) for (const s of c.slugs) OWN.set(s, "beauty");
for (const c of B4AS_CATEGORIES) for (const s of c.slugs) OWN.set(s, "b4as");

/** 이 slug 의 주인 브랜드. 택소노미에 없으면 오늘의딜 매거진("deal"). */
export function ownerOfSlug(slug: string): OwnerKey {
  return OWN.get(slug) ?? "deal";
}

/** 아티클 정본 URL — 언제나 www. canonical·사이트맵·301 대상이 모두 이걸 쓴다. */
export function canonicalArticleUrl(slug: string): string {
  return `${OWNER_ORIGIN.deal}/magazine/${slug}`;
}

/** www 에서만 의미 있는 내부 경로 → 어느 브랜드 루트로 보낼지. */
export const PATH_TO_OWNER: Record<string, OwnerKey> = {
  "/goodsleep": "sleep",
  "/pill": "pill",
  "/beauty": "beauty",
  "/b4as": "b4as",
};
