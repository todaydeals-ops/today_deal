// 생활백과 허브 검색 — 순수 함수(서버·클라이언트 어디서나). 예전 WikiSearch 와 같은 규칙을 유지한다.
// 표제어 · 다른 이름(aliases) · 인물(people) · seoTitle 을 공백 무시·대소문자 무시로 찾고,
// 표제어가 검색어로 시작하면 3 · 다른 필드가 시작하면 2 · 포함하면 1 점이다.
// 시안의 규칙(공백으로 나눈 단어 중 하나라도 제목·요약·소분류에 들어 있으면 찾는다)은 1점 미만 보조 점수로 얹는다
// ("연말정산 숙박세일"처럼 두 주제를 같이 쳐도 결과가 나온다).
import type { HubItem } from "./types";

export const norm = (t: string) => t.toLowerCase().replace(/\s+/g, "");

export interface IndexRow {
  it: HubItem;
  /** [표제어, ...보조어] 정규화 */
  f: string[];
  /** 요약 정규화 */
  d: string;
  /** 소분류 이름 정규화 */
  g: string;
}

export function buildIndex(items: HubItem[], groupLabel: (it: HubItem) => string): IndexRow[] {
  return items.map((it) => ({ it, f: [it.title, ...it.kw].map(norm), d: norm(it.sum), g: norm(groupLabel(it)) }));
}

export function searchItems(index: IndexRow[], query: string): HubItem[] {
  const k = norm(query);
  if (k.length < 1) return [];
  const terms = query.trim().split(/\s+/).map(norm).filter(Boolean);
  const scored: { it: HubItem; score: number; i: number }[] = [];
  index.forEach((row, i) => {
    let score = 0;
    if (row.f[0].startsWith(k)) score = 3;
    else if (row.f.some((f) => f.startsWith(k))) score = 2;
    else if (row.f.some((f) => f.includes(k))) score = 1;
    else {
      const hit = terms.filter((t) => row.f.some((f) => f.includes(t)) || row.g.includes(t) || row.d.includes(t)).length;
      if (hit > 0) score = (0.9 * hit) / terms.length;
    }
    if (score > 0) scored.push({ it: row.it, score, i });
  });
  scored.sort((a, b) => b.score - a.score || a.i - b.i);
  return scored.map((x) => x.it);
}
