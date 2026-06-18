import type { MetadataRoute } from "next";
import { fetchArchiveSlugs } from "@/lib/data/deals";

const SITE = "https://todaydeals.co.kr";

// 매 요청 시 최신 (딜·스냅샷이 계속 늘어남)
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const base: MetadataRoute.Sitemap = [
    { url: `${SITE}/`, lastModified: now, changeFrequency: "hourly", priority: 1 },
    { url: `${SITE}/recommended`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${SITE}/giveaway`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${SITE}/terms`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
    { url: `${SITE}/privacy`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
    { url: `${SITE}/partnership`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
  ];

  // 영구 딜 스냅샷 페이지 전부 포함 (검색엔진 발견용)
  const slugs = await fetchArchiveSlugs(5000);
  const dealPages: MetadataRoute.Sitemap = slugs.map((s) => ({
    url: `${SITE}/deal/${s}`,
    lastModified: now,
    changeFrequency: "daily",
    priority: 0.5,
  }));

  return [...base, ...dealPages];
}
