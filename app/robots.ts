import type { MetadataRoute } from "next";
import { headers } from "next/headers";

// robots.txt 는 호스트별로 달라야 한다.
//
// 예전에는 모든 서브도메인이 www 사이트맵만 가리켰고 host 도 www 로 못박혀 있었다.
// 그래서 각 서브도메인의 홈·분류 페이지를 크롤러에 알릴 경로가 없었다.
// 아티클은 canonical 이 www 라 www 사이트맵이 담당하고,
// 그 호스트에만 있는 URL(홈·분류)은 /sub-sitemap.xml 이 담당한다.
export default async function robots(): Promise<MetadataRoute.Robots> {
  const host = ((await headers()).get("host") || "").toLowerCase();
  const isSub = /^(goodsleep|pill|beauty|b4as|sponsor)\./.test(host);
  const origin = `https://${host || "www.todaydeals.co.kr"}`;

  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/api"] }],
    sitemap: isSub
      ? [
          `${origin}/sub-sitemap.xml`,                              // 이 브랜드의 홈·분류
          "https://www.todaydeals.co.kr/magazine-sitemap.xml",      // 아티클(canonical 이 www)
        ]
      : [
          "https://www.todaydeals.co.kr/sitemap.xml",
          "https://www.todaydeals.co.kr/magazine-sitemap.xml",
        ],
    // host 지시자는 자기 호스트를 가리켜야 한다. www 로 못박으면 서브도메인이
    // 스스로를 www 의 미러라고 신고하는 셈이 된다.
    host: origin,
  };
}
