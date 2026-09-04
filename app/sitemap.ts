import type { MetadataRoute } from "next";
// fetchArchiveSlugs 제거 — /deal/[slug]는 noindex이므로 사이트맵 불포함
import { fetchCuratedSlugs } from "@/lib/data/curated";
import { fetchMagazineList } from "@/lib/data/magazine";
import { fetchReportList } from "@/lib/data/magazine-report";
import { canonicalArticleUrl } from "@/lib/magazine/owner";

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
    // ★게시판은 사이트맵에서 제외한다(2026-09-04 · 사장님 결정 A안).
    //
    // 서치콘솔 실측: 제출 2,078건 중 "발견됨 · 현재 색인이 생성되지 않음" 1,178건.
    // sitemap.xml 1,532건의 구성이 /board 1,007 + /magazine 514 였다.
    // 게시판 발행글 4,914건의 본문은 중앙값 27자(공백 제외), 전량 1,000자 미만이고
    // 본문이 0자인 것도 있다. 구글이 크롤할 가치를 못 느껴 대기열에 쌓아둔 상태였고,
    // 그 사이 매거진 514편이 같은 크롤 예산을 두고 밀렸다.
    //
    // 사이트맵은 "이걸 크롤해달라"는 요청이다. 27자짜리 수천 건을 요청하면 예산이
    // 그쪽으로 간다. 페이지는 그대로 두므로(삭제 아님) 내부 링크로는 여전히 도달하고,
    // 게시물의 숨은 태그 SEO 자산도 유지된다. 크롤 요청만 거둔 것이다.
    //
    // 되돌리려면 이 블록과 아래 boardPages 를 복원하면 된다.
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


  // 매거진 글. 실제 발행일을 lastmod 로
  const mag = await fetchMagazineList({ limit: 1000, all: true });
  const magazinePages: MetadataRoute.Sitemap = mag.map((a) => ({
    url: canonicalArticleUrl(a.slug),
    lastModified: new Date(a.createdAt),
    changeFrequency: "monthly",
    priority: 0.7,
    ...(a.image?.url ? { images: [a.image.url.split("?")[0]] } : {}), // 쿼리스트링(&) 제거 — Next가 image:loc을 XML 이스케이프 안 해 파싱오류 방지
  }));

  // 매거진 리포트 (5편 묶음 롱폼 SEO) — 우선순위 높게
  const reports = await fetchReportList(200);
  const reportPages: MetadataRoute.Sitemap = reports.map((r) => ({
    url: `${SITE}/magazine/report/${r.slug}`,
    lastModified: new Date(r.createdAt),
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  return [...base, ...reportPages, ...magazinePages, ...curatedPages];
}
