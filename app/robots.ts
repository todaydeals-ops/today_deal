import type { MetadataRoute } from "next";

// robots.txt — www 하나만 운영한다(2026-10-17 중앙 집중).
//
// 예전엔 서브도메인마다 자기 robots·사이트맵을 냈다. 이제 옛 서브도메인은 proxy.ts 가
// 전부 www 로 301 하므로(robots.txt 요청 포함) 여기서는 www 기준 하나만 낸다.
//   sitemap.xml          딜·정적 페이지
//   magazine-sitemap.xml 아티클 전체(연구소 글 포함, 정본 www)
//   sub-sitemap.xml      연구소 5곳의 홈·분류 페이지
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/api"] }],
    sitemap: [
      "https://www.todaydeals.co.kr/sitemap.xml",
      "https://www.todaydeals.co.kr/magazine-sitemap.xml",
      "https://www.todaydeals.co.kr/sub-sitemap.xml",
    ],
    host: "https://www.todaydeals.co.kr",
  };
}
