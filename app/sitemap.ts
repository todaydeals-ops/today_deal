import type { MetadataRoute } from "next";
// fetchArchiveSlugs 제거 — /deal/[slug]는 noindex이므로 사이트맵 불포함
import { fetchCuratedSlugs } from "@/lib/data/curated";
import { fetchBoardSitemap, BOARD_CATEGORIES } from "@/lib/data/board";
import { fetchMagazineList } from "@/lib/data/magazine";
import { fetchReportList } from "@/lib/data/magazine-report";

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
    { url: `${SITE}/board?type=event`, lastModified: now, changeFrequency: "daily", priority: 0.7 },
    // 게시판 카테고리 색인 페이지 ("○○ 핫딜" 키워드)
    ...BOARD_CATEGORIES.map((c) => ({
      url: `${SITE}/board?category=${encodeURIComponent(c)}`,
      lastModified: now,
      changeFrequency: "daily" as const,
      priority: 0.6,
    })),
    { url: `${SITE}/magazine`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${SITE}/giveaway`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${SITE}/terms`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
    { url: `${SITE}/privacy`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
    { url: `${SITE}/partnership`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
  ];

  // 추천딜 콘텐츠 페이지 (쇼츠 연결·영구) — 우선순위 높게
  const curated = await fetchCuratedSlugs(2000);
  const curatedPages: MetadataRoute.Sitemap = curated.map((s) => ({
    url: `${SITE}/recommended/${s}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  // 제보딜 게시판 페이지 — 실제 발행일을 lastmod로
  const board = await fetchBoardSitemap(2000);
  const boardPages: MetadataRoute.Sitemap = board.map((b) => ({
    url: `${SITE}/board/${b.slug}`,
    lastModified: new Date(b.lastmod),
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  // 매거진(중립 쇼핑 가이드) 글 — 실제 발행일을 lastmod로
  const mag = await fetchMagazineList({ limit: 1000 });
  const magazinePages: MetadataRoute.Sitemap = mag.map((a) => ({
    url: `${SITE}/magazine/${a.slug}`,
    lastModified: new Date(a.createdAt),
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  // 매거진 리포트 (5편 묶음 롱폼 SEO) — 우선순위 높게
  const reports = await fetchReportList(200);
  const reportPages: MetadataRoute.Sitemap = reports.map((r) => ({
    url: `${SITE}/magazine/report/${r.slug}`,
    lastModified: new Date(r.createdAt),
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  return [...base, ...reportPages, ...magazinePages, ...curatedPages, ...boardPages];
}
