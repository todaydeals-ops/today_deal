import type { MetadataRoute } from "next";
import { fetchArchiveSlugs } from "@/lib/data/deals";
import { fetchCuratedSlugs } from "@/lib/data/curated";
import { fetchBoardSlugs } from "@/lib/data/board";

const SITE = "https://www.todaydeals.co.kr";

// 매 요청 시 최신 (딜·스냅샷이 계속 늘어남)
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const base: MetadataRoute.Sitemap = [
    { url: `${SITE}/`, lastModified: now, changeFrequency: "hourly", priority: 1 },
    { url: `${SITE}/deals`, lastModified: now, changeFrequency: "hourly", priority: 0.9 },
    { url: `${SITE}/deals/gmarket`, lastModified: now, changeFrequency: "hourly", priority: 0.9 },
    { url: `${SITE}/deals/11st`, lastModified: now, changeFrequency: "hourly", priority: 0.9 },
    { url: `${SITE}/deals/coupang`, lastModified: now, changeFrequency: "hourly", priority: 0.9 },
    { url: `${SITE}/deals/ali`, lastModified: now, changeFrequency: "hourly", priority: 0.8 },
    { url: `${SITE}/recommended`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${SITE}/board`, lastModified: now, changeFrequency: "hourly", priority: 0.8 },
    { url: `${SITE}/board?type=overseas`, lastModified: now, changeFrequency: "daily", priority: 0.7 },
    { url: `${SITE}/board?type=free`, lastModified: now, changeFrequency: "daily", priority: 0.7 },
    { url: `${SITE}/board?type=coupon`, lastModified: now, changeFrequency: "daily", priority: 0.7 },
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

  // 추천딜 콘텐츠 페이지 (쇼츠 연결·영구) — 우선순위 높게
  const curated = await fetchCuratedSlugs(2000);
  const curatedPages: MetadataRoute.Sitemap = curated.map((s) => ({
    url: `${SITE}/recommended/${s}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  // 제보딜 게시판 페이지
  const board = await fetchBoardSlugs(2000);
  const boardPages: MetadataRoute.Sitemap = board.map((s) => ({
    url: `${SITE}/board/${s}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  return [...base, ...curatedPages, ...boardPages, ...dealPages];
}
