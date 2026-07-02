import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/admin", "/api"] },
    ],
    sitemap: [
      "https://www.todaydeals.co.kr/sitemap.xml",
      "https://www.todaydeals.co.kr/magazine-sitemap.xml",
    ],
    host: "https://www.todaydeals.co.kr",
  };
}
