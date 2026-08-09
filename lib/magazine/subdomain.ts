// 서브 미디어 링크 — 언제나 서브도메인 절대 URL로 만든다.
//
// 세 서브도메인이 모두 붙기 전에는 호스트를 감지해 www에서는 "/pill?cat=" 같은
// 경로 링크를 내보냈다. 이제 goodsleep·pill·beauty 전부 살아 있으므로
// 어디서 렌더되든 정본 주소 하나만 쓴다. www의 /pill·/beauty 경로는 살려두되
// (rewrite 대상이라 직접 접근은 계속 동작한다) 링크로는 노출하지 않는다.
//
// ★새 서브 미디어를 추가하면 SUB_ORIGIN에 한 줄만 넣는다.
export const SUB_ORIGIN = {
  sleep: "https://goodsleep.todaydeals.co.kr",
  pill: "https://pill.todaydeals.co.kr",
  beauty: "https://beauty.todaydeals.co.kr",
} as const;

export type SubKey = keyof typeof SUB_ORIGIN;

export function subHref(key: SubKey, cat?: string, page?: number): string {
  const q = new URLSearchParams();
  if (cat) q.set("cat", cat);
  if (page && page > 1) q.set("page", String(page));
  const s = q.toString();
  return s ? `${SUB_ORIGIN[key]}/?${s}` : `${SUB_ORIGIN[key]}/`;
}

export const sleepHref = (cat?: string, page?: number) => subHref("sleep", cat, page);
export const pillHref = (cat?: string, page?: number) => subHref("pill", cat, page);
export const beautyHref = (cat?: string, page?: number) => subHref("beauty", cat, page);
