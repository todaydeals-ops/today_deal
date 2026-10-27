// 통합 검색 색인(서버 전용) — 매거진 가이드(AS 셀프체크 포함) + 생활백과 항목.
// 홈 검색창은 /api/search-index 를 처음 포커스할 때 한 번 받아 브라우저에서 거른다(시안: 입력 즉시 클라이언트 필터, 실제 구현은 150~200ms 디바운스).
import { fetchMagazineList } from "@/lib/data/magazine";
import { allEntries } from "@/lib/wiki/load";
import { cornerOf } from "@/lib/magazine/corners";
import type { SearchItem } from "@/lib/search-rank";

export async function buildSearchIndex(): Promise<SearchItem[]> {
  // light: 본문을 빼고 제목·분류만(색인에는 이미지가 필요 없다). all: 서브 미디어 격리를 끄고 전부.
  const mags = await fetchMagazineList({ all: true, light: true, limit: 1000 });
  const guides: SearchItem[] = mags.map((a) => ({
    t: a.corner === "repair" ? "AS 셀프체크" : cornerOf(a.corner).name,
    title: a.title,
    href: `/magazine/${a.slug}`,
    kw: [a.field, a.subtitle].filter(Boolean).join(" ") || undefined,
  }));
  const wiki: SearchItem[] = allEntries().map((e) => ({
    t: "생활백과",
    title: e.title,
    href: `/wiki/${e.slug}`,
    kw: [...e.aliases, e.seoTitle].join(" "),
  }));
  // 생활백과를 앞에 둔다 — 같은 점수면 신청·환급·세일 항목이 먼저 나온다(찾는 사람이 많은 쪽)
  return [...wiki, ...guides];
}
