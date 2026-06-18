import type { MetadataRoute } from "next";

const SITE = "https://todaydeals.co.kr";

// 매 요청 시 최신 날짜로 (딜은 자주 갱신됨)
export const dynamic = "force-dynamic";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: `${SITE}/`, lastModified: now, changeFrequency: "hourly", priority: 1 },
    { url: `${SITE}/recommended`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${SITE}/giveaway`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${SITE}/terms`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
    { url: `${SITE}/privacy`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
    { url: `${SITE}/partnership`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
  ];
}
