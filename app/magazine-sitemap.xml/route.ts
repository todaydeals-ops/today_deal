import { fetchMagazineList } from "@/lib/data/magazine";
import { fetchReportList } from "@/lib/data/magazine-report";

export const revalidate = 3600; // 1시간 CDN 캐시 — 하루 2편 발행분이 사이트맵에 빨리 반영되도록(콜드스타트 부담 적음)
const SITE = "https://www.todaydeals.co.kr";

export async function GET() {
  const [articles, reports] = await Promise.all([
    fetchMagazineList({ limit: 1000 }),
    fetchReportList(200),
  ]);

  const urls = [
    // 매거진 홈
    `<url><loc>${SITE}/magazine</loc><changefreq>daily</changefreq><priority>0.9</priority></url>`,
    // 개별 아티클
    ...articles.map((a) =>
      `<url><loc>${SITE}/magazine/${a.slug}</loc><lastmod>${a.createdAt.slice(0, 10)}</lastmod><changefreq>monthly</changefreq><priority>0.8</priority></url>`
    ),
    // 리포트
    ...reports.map((r) =>
      `<url><loc>${SITE}/magazine/report/${r.slug}</loc><lastmod>${r.createdAt.slice(0, 10)}</lastmod><changefreq>monthly</changefreq><priority>0.8</priority></url>`
    ),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}
