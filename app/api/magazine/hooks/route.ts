// 매거진 후킹 데이터 — 딜 사이트 팝업이 호출(5분 캐시). 발행 글의 {slug, corner, hook}만.
import { NextResponse } from "next/server";
import { fetchMagazineList } from "@/lib/data/magazine";
import { hookFor } from "@/lib/magazine/hooks";

export const revalidate = 300;

export async function GET() {
  const list = await fetchMagazineList({ limit: 30 });
  const items = list.map((a) => ({ slug: a.slug, corner: a.corner, hook: hookFor(a) }));
  return NextResponse.json({ items });
}
