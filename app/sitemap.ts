import type { MetadataRoute } from "next";
// fetchArchiveSlugs 제거 — /deal/[slug]는 noindex이므로 사이트맵 불포함
import { fetchCuratedSlugs } from "@/lib/data/curated";
import { fetchMagazineList } from "@/lib/data/magazine";
import { fetchReportList } from "@/lib/data/magazine-report";
import { canonicalArticleUrl } from "@/lib/magazine/owner";

const SITE = "https://www.todaydeals.co.kr";

// ★2026-09-15 긴급 수정 — 이 라우트가 Supabase egress 한도 초과의 주범이었다.
// force-dynamic + fetchMagazineList({ all:true }, select("*")) 조합이라, 크롤러가
// /sitemap.xml 을 때릴 때마다 매거진 최대 1000행의 본문(RAIL 이미지 포함, 평균 15KB)을
// 캐시 없이 매번 새로 읽었다. 오늘 구글·네이버에 사이트맵을 여러 개 재제출해 크롤
// 빈도가 늘면서 한도를 넘겼고, Supabase 가 프로젝트를 402 로 통째로 막아 사이트 전체
// (홈·매거진·딜·게시판) 가 실제 방문자에게도 빈 화면을 보여주고 있었다.
// "딜이 자주 바뀌니 항상 최신"이라는 이유로 force-dynamic 이었지만, 사이트맵의
// lastmod 정밀도가 그 정도로 급할 이유는 없다 — 1시간 캐시로 바꾼다.
export const revalidate = 3600;

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


  // 매거진 글. 실제 발행일을 lastmod 로.
  // ★light:true — 본문(RAIL 이미지 포함)을 받지 않는다. 그래서 image 사이트맵 확장을
  // 여기서는 못 넣는다(이미지는 magazine-sitemap.xml 이 아니라 이 라우트에만 없던 것도
  // 아니고 애초에 이 파일에만 있었다). egress 사고 이후 1시간 캐시가 붙었으니 완전히
  // 손해는 아니지만, 이미지 확장이 필요해지면 별도의 가벼운 컬럼(예: cover_image_url)을
  // 추가해 body_html 없이 뽑는 방법을 검토할 것 — 지금은 본문 전체를 다시 읽는 대가가 더 크다.
  const mag = await fetchMagazineList({ limit: 1000, all: true, light: true });
  const magazinePages: MetadataRoute.Sitemap = mag.map((a) => ({
    url: canonicalArticleUrl(a.slug),
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

  return [...base, ...reportPages, ...magazinePages, ...curatedPages];
}
