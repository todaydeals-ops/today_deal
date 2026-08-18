import { fetchMagazineList } from "@/lib/data/magazine";
import { fetchReportList } from "@/lib/data/magazine-report";
import { canonicalArticleUrl } from "@/lib/magazine/owner";

export const revalidate = 3600; // 1시간 CDN 캐시 — 하루 2편 발행분이 사이트맵에 빨리 반영되도록(콜드스타트 부담 적음)
const SITE = "https://www.todaydeals.co.kr";

export async function GET() {
  const [articles, reports] = await Promise.all([
    // light — 여기서 쓰는 건 slug 와 createdAt 뿐이다. 본문까지 받으면 486편에 7.3MB다.
    fetchMagazineList({ limit: 1000, all: true, light: true }),
    fetchReportList(200),
  ]);

  const urls = [
    // ※ 매거진 홈(/magazine)은 넣지 않는다 — 307 로 "/" 로 접히는 URL이라
    //   사이트맵에 리디렉션을 제출하는 셈이 된다(2026-08-18 GSC 경고).
    //   "/" 자체는 www/sitemap.xml 이 이미 담당한다.
    // 개별 아티클
    ...articles.map((a) =>
      `<url><loc>${canonicalArticleUrl(a.slug)}</loc><lastmod>${a.createdAt.slice(0, 10)}</lastmod><changefreq>monthly</changefreq><priority>0.8</priority></url>`
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
