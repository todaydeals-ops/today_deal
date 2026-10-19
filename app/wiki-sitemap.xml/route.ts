// 생활백과 사이트맵 — 허브 + 항목 전부. 항목은 content/wiki 의 JSON 이라 빌드 때 확정된다.
import { allEntries, wikiUrl, WIKI_BASE } from "@/lib/wiki/load";

export const dynamic = "force-static";

export function GET(): Response {
  const entries = allEntries();
  const newest = entries[0]?.updated ?? new Date().toISOString().slice(0, 10);
  const urls = [
    `<url><loc>${WIKI_BASE}</loc><lastmod>${newest}</lastmod><changefreq>daily</changefreq><priority>0.9</priority></url>`,
    `<url><loc>${WIKI_BASE}/error-codes</loc><changefreq>daily</changefreq><priority>0.9</priority></url>`,
    ...entries.map((e) => `<url><loc>${wikiUrl(e.slug)}</loc><lastmod>${e.updated}</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>`),
  ];
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>`,
    { headers: { "Content-Type": "application/xml; charset=utf-8" } },
  );
}
