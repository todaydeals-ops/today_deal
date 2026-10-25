// 글 하나가 어느 브랜드 소유인지 판별한다. 중복 URL 제거의 기준점이다.
//
// ★왜 필요한가
// 서브도메인 4개가 모두 같은 Next 앱을 서빙해서, /magazine/<slug> 가 www 포함
// 5개 호스트에서 전부 200으로 열렸다. 콘텐츠 468편이 URL 2,340개로 보인 것이다.
// canonical 이 한 곳을 가리켜도, 권위가 없는 신규 도메인에서는 크롤 예산을 5배로
// 낭비하는 순간 색인이 멈춘다("발견됨 · 색인 생성 안 됨").
//
// ★주인은 www 다.
// 2026-08-10 서치콘솔 실측에서 www/magazine/* AS 글들이 이미 색인되고 클릭을 받고
// 있었다. 한때 이 글들을 브랜드 서브도메인이 주인이 되게 바꿨다가 되돌렸다 — 순위가 붙은
// 페이지를 이력 0인 새 호스트로 옮기면 재색인 몇 주 동안 순위를 잃는다.
//
// ★2026-10-17 중앙 집중. 아티클뿐 아니라 연구소 홈·분류까지 www 아래 경로로 모았다
// (lib/magazine/subdomain.ts). 옛 서브도메인은 proxy.ts 가 전부 www 로 301 한다.
// 브랜드 경험은 호스트가 아니라 화면이 만든다 — 아티클 페이지가 field·corner 를 보고
// 헤더·푸터·분류를 갈아끼우므로 www/magazine/<AS글>도 AS연구소 화면으로 렌더된다.
import { SLEEP_CATEGORIES } from "@/lib/magazine/sleepCategories";
import { PILL_CATEGORIES } from "@/lib/magazine/pillCategories";
import { BEAUTY_CATEGORIES } from "@/lib/magazine/beautyCategories";
import { B4AS_CATEGORIES } from "@/lib/magazine/b4asCategories";

export type OwnerKey = "deal" | "sleep" | "pill" | "beauty" | "b4as";

export const WWW_ORIGIN = "https://www.todaydeals.co.kr";

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
  return `${WWW_ORIGIN}/magazine/${slug}`;
}
