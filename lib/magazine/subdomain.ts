// 연구소 홈 주소 — 언제나 www 아래 경로로 만든다.
//
// ★2026-10-17 중앙 집중(사장님 지시). 연구소 5곳을 서브도메인으로 빼 두었던 구조를 접었다.
// 아티클 정본은 이미 www 였고(owner.ts), 서브도메인에 남아 있던 건 홈·분류 페이지뿐이었다.
// 그 홈들이 네이버 웹문서에 0건이었다(2026-10-17 실측) — 쌓인 게 없어 옮겨도 잃을 게 없고,
// 서치어드바이저·서치콘솔 등록이 www 하나로 끝난다. 옛 서브도메인은 proxy.ts 가 www 로 301 한다.
//
// ★주소는 반드시 labHref()로 만든다. `${LAB_HOME.x}/` 처럼 슬래시를 붙이면
//   /goodsleep/ 가 되어 Next 가 다시 308 으로 접는다(canonical 이 리다이렉트 주소를 가리키게 된다).
// ★새 연구소를 추가하면 LAB_HOME 에 한 줄만 넣는다.
const WWW = "https://www.todaydeals.co.kr";

export const LAB_HOME = {
  sleep: `${WWW}/goodsleep`,
  pill: `${WWW}/pill`,
  beauty: `${WWW}/beauty`,
  b4as: `${WWW}/b4as`,
  // sponsor(방송 협찬)는 10-26 폐지 — /sponsor 와 옛 서브도메인은 proxy.ts 가 홈으로 301 한다.
} as const;

export type SubKey = keyof typeof LAB_HOME;

/** 옛 서브도메인 접두어 → 연구소 키. proxy 의 301 판별에만 쓴다. */
export const LEGACY_SUBDOMAIN: Record<string, SubKey> = {
  goodsleep: "sleep",
  pill: "pill",
  beauty: "beauty",
  b4as: "b4as",
};

export function labHref(key: SubKey, cat?: string, page?: number): string {
  const q = new URLSearchParams();
  if (cat) q.set("cat", cat);
  if (page && page > 1) q.set("page", String(page));
  const s = q.toString();
  return s ? `${LAB_HOME[key]}?${s}` : LAB_HOME[key];
}

export const sleepHref = (cat?: string, page?: number) => labHref("sleep", cat, page);
export const pillHref = (cat?: string, page?: number) => labHref("pill", cat, page);
export const beautyHref = (cat?: string, page?: number) => labHref("beauty", cat, page);
export const b4asHref = (cat?: string, page?: number) => labHref("b4as", cat, page);
