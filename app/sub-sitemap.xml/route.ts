// 분야 홈·분류 사이트맵 — 수면·영양제·뷰티 성분·AS 셀프체크의 입구 페이지를 www 주소로 낸다.
//
// 아티클은 magazine-sitemap.xml 이 담당한다. 여기는 아티클이 아닌 연구소 홈과 ?cat= 분류만.
// ★2026-10-17 중앙 집중 전에는 서브도메인마다 자기 호스트 URL만 냈다(교차 제출 방지).
//   이제 전부 www 아래 경로라 호스트를 보지 않고 다섯 곳을 한 번에 낸다.
//   경로 이름(sub-sitemap.xml)은 이미 서치콘솔에 제출돼 있어 그대로 둔다.
import { SLEEP_CATEGORIES } from "@/lib/magazine/sleepCategories";
import { PILL_CATEGORIES } from "@/lib/magazine/pillCategories";
import { BEAUTY_CATEGORIES } from "@/lib/magazine/beautyCategories";
import { B4AS_CATEGORIES } from "@/lib/magazine/b4asCategories";
import { labHref, type SubKey } from "@/lib/magazine/subdomain";

export const revalidate = 3600;

const LABS: [SubKey, readonly { key: string }[]][] = [
  ["sleep", SLEEP_CATEGORIES],
  ["pill", PILL_CATEGORIES],
  ["beauty", BEAUTY_CATEGORIES],
  ["b4as", B4AS_CATEGORIES],
  // 방송 협찬(sponsor)은 2026-10-26 폐지
];

const esc = (s: string) => s.replace(/&/g, "&amp;");

export async function GET(): Promise<Response> {
  const urls = LABS.flatMap(([lab, cats]) => [
    `<url><loc>${esc(labHref(lab))}</loc><changefreq>daily</changefreq><priority>0.9</priority></url>`,
    ...cats.map((c) => `<url><loc>${esc(labHref(lab, c.key))}</loc><changefreq>weekly</changefreq><priority>0.7</priority></url>`),
  ]);

  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>`,
    { headers: { "Content-Type": "application/xml; charset=utf-8" } },
  );
}
