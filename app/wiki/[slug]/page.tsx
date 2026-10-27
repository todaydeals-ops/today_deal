// 생활백과 항목 페이지 — content/wiki/<slug>.json 을 빌드 때 정적으로 굽는다.
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import MediaFooter from "@/components/MediaFooter";
import { allEntries, entryBySlug, wikiUrl, WIKI_BASE } from "@/lib/wiki/load";
import { WIKI_TYPE_LABEL, type WikiEntry } from "@/lib/wiki/types";
import { imagesOf } from "@/lib/wiki/images";
import { fetchMagazineList } from "@/lib/data/magazine";
import { canonicalArticleUrl } from "@/lib/magazine/owner";
import WikiDetailView from "@/components/wiki/detail/WikiDetailView";

export const dynamicParams = false;

export function generateStaticParams() {
  return allEntries().map((e) => ({ slug: e.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const e = entryBySlug((await params).slug);
  if (!e) return {};
  const im = imagesOf(e.slug);
  return {
    title: `${e.seoTitle} | 오늘의딜 생활백과`,
    description: e.description,
    alternates: { canonical: wikiUrl(e.slug) },
    keywords: [e.title, ...e.aliases],
    openGraph: {
      title: e.seoTitle, description: e.description, url: wikiUrl(e.slug), type: "article", siteName: "오늘의딜 생활백과",
      ...(im ? { images: [{ url: `https://www.todaydeals.co.kr${im.og}`, width: 1200, height: 630, alt: im.alt }] } : {}),
    },
    ...(im ? { twitter: { card: "summary_large_image" as const, title: e.seoTitle, description: e.description, images: [`https://www.todaydeals.co.kr${im.og}`] } } : {}),
  };
}

function ld(e: WikiEntry) {
  const graph: Record<string, unknown>[] = [
    {
      "@type": "Article",
      headline: e.seoTitle,
      description: e.description,
      inLanguage: "ko-KR",
      datePublished: e.created,
      dateModified: e.updated,
      keywords: [e.title, ...e.aliases].join(", "),
      mainEntityOfPage: wikiUrl(e.slug),
      ...(imagesOf(e.slug) ? { image: [`https://www.todaydeals.co.kr${imagesOf(e.slug)!.og}`] } : {}),
      author: { "@type": "Organization", name: "오늘의딜 생활백과 편집팀" },
      publisher: { "@type": "Organization", name: "오늘의딜", url: "https://www.todaydeals.co.kr" },
      citation: e.sources.map((s) => s.url),
      // GEO — 표제어와 다른 이름(애사비·강민경 탈취제 등)을 한 대상으로 묶고, 3줄 요약을 즉답 후보로 준다
      about: { "@type": "Thing", name: e.title, alternateName: e.aliases },
      abstract: e.summary.join(" "),
      ...(e.people?.length ? { mentions: e.people.map((name) => ({ "@type": "Person", name })) } : {}),
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "생활백과", item: WIKI_BASE },
        { "@type": "ListItem", position: 2, name: WIKI_TYPE_LABEL[e.type], item: `${WIKI_BASE}#${e.type}` },
        { "@type": "ListItem", position: 3, name: e.title, item: wikiUrl(e.slug) },
      ],
    },
  ];
  if (e.faq.length) {
    graph.push({
      "@type": "FAQPage",
      mainEntity: e.faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
    });
  }
  if (e.video) {
    graph.push({
      "@type": "VideoObject",
      name: e.video.title,
      description: `${e.video.channel} · ${e.title}`,
      uploadDate: e.video.published,
      thumbnailUrl: `https://i.ytimg.com/vi/${e.video.id}/hqdefault.jpg`,
      embedUrl: `https://www.youtube-nocookie.com/embed/${e.video.id}`,
      contentUrl: `https://www.youtube.com/watch?v=${e.video.id}`,
    });
  }
  // 날짜(일 단위)가 확정된 세일만 SaleEvent 로 낸다. 미발표 행사에 날짜를 넣으면 검색엔진에 거짓 일정을 주는 것이다.
  // "2026-10" 처럼 월 단위로만 아는 행사(여행가는 달 등)는 일정이 정해진 것이 아니라서 구조화 데이터로 내지 않는다(화면 표시는 그대로).
  const FULL_DATE = /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/;
  if (e.sale?.status === "확정" && e.sale.start && e.sale.end && FULL_DATE.test(e.sale.start) && FULL_DATE.test(e.sale.end)) {
    graph.push({
      "@type": "SaleEvent",
      name: e.title,
      description: e.description,
      startDate: e.sale.start,
      endDate: e.sale.end,
      eventStatus: "https://schema.org/EventScheduled",
      eventAttendanceMode: "https://schema.org/OnlineEventAttendanceMode",
      location: { "@type": "VirtualLocation", url: wikiUrl(e.slug) },
      organizer: { "@type": "Organization", name: e.sale.organizer },
    });
  }
  return { "@context": "https://schema.org", "@graph": graph };
}

export default async function WikiEntryPage({ params }: { params: Promise<{ slug: string }> }) {
  const e = entryBySlug((await params).slug);
  if (!e) notFound();

  const relEntries = (e.related?.entries ?? []).map(entryBySlug).filter((x): x is WikiEntry => !!x);
  const relArticles = e.related?.articles?.length
    ? (await fetchMagazineList({ slugs: e.related.articles, all: true, light: true, limit: 12 })).map((a) => ({
        title: a.title,
        href: canonicalArticleUrl(a.slug),
      }))
    : [];

  return (
    <div className="rn-page">
      <Header />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld(e)) }} />
      <WikiDetailView e={e} relEntries={relEntries} relArticles={relArticles} />
      <MediaFooter />
    </div>
  );
}
