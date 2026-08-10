// 서브 미디어 사이트맵 — 호스트별로 자기 홈·분류 페이지를 낸다.
//
// 왜 따로 두나: 아티클의 canonical 은 www/magazine/<slug> 라서 www 사이트맵이 담당한다.
// 하지만 각 서브도메인의 **홈과 분류 페이지**는 그 호스트에만 존재하는 URL이라
// www 사이트맵에 넣을 수 없다(다른 호스트 URL은 교차 제출 취급을 받는다).
// 그래서 요청 호스트를 보고 그 브랜드의 URL만 내보낸다.
//
// robots.txt 가 호스트별로 이 경로를 Sitemap 으로 가리킨다.
import { headers } from "next/headers";
import { SLEEP_CATEGORIES } from "@/lib/magazine/sleepCategories";
import { PILL_CATEGORIES } from "@/lib/magazine/pillCategories";
import { BEAUTY_CATEGORIES } from "@/lib/magazine/beautyCategories";
import { B4AS_CATEGORIES } from "@/lib/magazine/b4asCategories";
import { SUB_ORIGIN } from "@/lib/magazine/subdomain";

export const revalidate = 3600;

type Cat = { key: string };
const MEDIA: Record<string, { origin: string; cats: Cat[] }> = {
  goodsleep: { origin: SUB_ORIGIN.sleep, cats: SLEEP_CATEGORIES },
  pill: { origin: SUB_ORIGIN.pill, cats: PILL_CATEGORIES },
  beauty: { origin: SUB_ORIGIN.beauty, cats: BEAUTY_CATEGORIES },
  b4as: { origin: SUB_ORIGIN.b4as, cats: B4AS_CATEGORIES },
};

export async function GET(): Promise<Response> {
  const host = ((await headers()).get("host") || "").toLowerCase();
  const key = Object.keys(MEDIA).find((k) => host.startsWith(k + "."));
  const m = key ? MEDIA[key] : undefined;

  // 서브도메인이 아닌 곳(www 등)에서 부르면 빈 사이트맵을 준다 — 교차 제출 방지.
  const urls = m
    ? [
        `<url><loc>${m.origin}/</loc><changefreq>daily</changefreq><priority>1.0</priority></url>`,
        ...m.cats.map((c) => `<url><loc>${m.origin}/?cat=${c.key}</loc><changefreq>weekly</changefreq><priority>0.8</priority></url>`),
      ]
    : [];

  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>`,
    { headers: { "Content-Type": "application/xml; charset=utf-8" } },
  );
}
