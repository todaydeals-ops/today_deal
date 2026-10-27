// 통합 검색 순위 — 서버(/search)와 브라우저(홈 검색창)가 같은 함수를 쓴다(순수 함수, 서버 전용 import 금지).
// 시안: 공백으로 나눈 단어 중 하나라도 포함하면 일치. 실제 구현에서는 일치한 단어 수가 많은 순 → 제목에 든 것 → 색인 순서(최신순)로 정렬한다.
export interface SearchItem {
  t: string; // 유형 라벨: 팩트체크·스마트가이드·트렌드랩·AS 셀프체크·생활백과
  title: string;
  href: string;
  kw?: string; // 제목에 없는 검색어(별칭·분야·태그)
}

const norm = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();

export function rankSearch(index: SearchItem[], q: string, limit = 6): SearchItem[] {
  const terms = norm(q).split(" ").filter(Boolean);
  if (!terms.length) return [];
  const scored: { it: SearchItem; score: number; i: number }[] = [];
  index.forEach((it, i) => {
    const title = norm(it.title);
    const hay = it.kw ? `${title} ${norm(it.kw)}` : title;
    let hits = 0, inTitle = 0;
    for (const t of terms) {
      if (hay.includes(t)) hits++;
      if (title.includes(t)) inTitle++;
    }
    if (hits > 0) scored.push({ it, score: hits * 100 + inTitle * 10, i });
  });
  scored.sort((a, b) => b.score - a.score || a.i - b.i);
  return scored.slice(0, limit).map((s) => s.it);
}
