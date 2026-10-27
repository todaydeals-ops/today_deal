import { buildSearchIndex } from "@/lib/search-index";

// 홈 검색창이 처음 포커스될 때 받아 가는 통합 검색 색인(JSON). 10분 캐시.
export const revalidate = 600;

export async function GET() {
  const index = await buildSearchIndex();
  return Response.json(index, { headers: { "Cache-Control": "public, s-maxage=600, stale-while-revalidate=3600" } });
}
