import { redirect } from "next/navigation";

// 매거진 목록은 홈(/)으로 통합됨 — 코너 필터는 쿼리 유지하며 리다이렉트.
// (개별 글 /magazine/[slug], 리포트 /magazine/report/[slug]는 그대로 유지)
export default async function MagazineIndex({ searchParams }: { searchParams: Promise<{ corner?: string; page?: string }> }) {
  const sp = await searchParams;
  const q = new URLSearchParams();
  if (sp.corner) q.set("corner", sp.corner);
  if (sp.page) q.set("page", sp.page);
  const s = q.toString();
  redirect(s ? `/?${s}` : "/");
}
