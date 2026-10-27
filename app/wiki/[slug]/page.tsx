// 생활백과 항목 페이지 — content/wiki/<slug>.json 을 빌드 때 정적으로 굽는다.
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import MediaFooter from "@/components/MediaFooter";
import { allEntries, entryBySlug, wikiUrl, WIKI_BASE } from "@/lib/wiki/load";
import { WIKI_TYPE_LABEL, type Block, type WikiEntry } from "@/lib/wiki/types";
import { imagesOf, IMAGE_CAPTION } from "@/lib/wiki/images";
import { fetchMagazineList } from "@/lib/data/magazine";
import { canonicalArticleUrl } from "@/lib/magazine/owner";
import "../../magazine/magazine.css";
import "../wiki.css";

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

// 원고는 일반 텍스트다. **굵게** 만 허용하고 나머지는 전부 이스케이프한다.
function inline(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
}
const H = ({ s }: { s: string }) => <span dangerouslySetInnerHTML={{ __html: inline(s) }} />;

function BlockView({ b }: { b: Block }) {
  if ("p" in b) return <p><H s={b.p} /></p>;
  if ("list" in b) return <ul>{b.list.map((x, i) => <li key={i}><H s={x} /></li>)}</ul>;
  if ("steps" in b) return <ol>{b.steps.map((x, i) => <li key={i}><H s={x} /></li>)}</ol>;
  if ("note" in b) return <div className="wk-note"><H s={b.note} /></div>;
  return (
    <div className="wk-tablewrap">
      <table className="wk-table">
        <thead><tr>{b.table.head.map((h, i) => <th key={i}>{h}</th>)}</tr></thead>
        <tbody>{b.table.rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j}><H s={c} /></td>)}</tr>)}</tbody>
      </table>
    </div>
  );
}

// "1:23" → 83초 (유튜브 t= 파라미터용)
const toSec = (t: string) => t.split(":").reduce((s, x) => s * 60 + Number(x), 0);

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
  // 날짜가 확정된 세일만 SaleEvent 로 낸다. 미발표 행사에 날짜를 넣으면 검색엔진에 거짓 일정을 주는 것이다.
  if (e.sale?.status === "확정" && e.sale.start && e.sale.end) {
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

const fmt = (d: string) => d.replace(/-/g, ".");

export default async function WikiEntryPage({ params }: { params: Promise<{ slug: string }> }) {
  const e = entryBySlug((await params).slug);
  if (!e) notFound();

  const im = imagesOf(e.slug);
  const relEntries = (e.related?.entries ?? []).map(entryBySlug).filter((x): x is WikiEntry => !!x);
  const relArticles = e.related?.articles?.length
    ? await fetchMagazineList({ slugs: e.related.articles, all: true, light: true, limit: 12 })
    : [];

  return (
    <>
      <Header />
      <div className="mz-page">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld(e)) }} />
        <div className="mz-wrap" style={{ paddingTop: 44, paddingBottom: 80 }}>
          <div className="wk-kicker">
            <Link href="/wiki">생활백과</Link>
            <span style={{ opacity: 0.5 }}>›</span>
            <Link href={`/wiki#${e.type}`} className="wk-type">{WIKI_TYPE_LABEL[e.type]}</Link>
            <span style={{ opacity: 0.5 }}>›</span>
            <span>{e.title}</span>
          </div>
          <h1 className="wk-h1">{e.seoTitle}</h1>
          <div className="wk-meta">
            오늘의딜 생활백과 편집팀 · 최종 확인 {fmt(e.updated)} · 출처 {e.sources.length}곳
          </div>

          {im && (
            <figure className="wk-fig wk-fig-hero">
              <img src={im.hero} alt={im.alt} width={1200} height={675} fetchPriority="high" decoding="async" />
              <figcaption>{IMAGE_CAPTION}</figcaption>
            </figure>
          )}

          <section className="wk-summary" aria-label="핵심 요약">
            <div className="wk-summary-h">핵심 요약</div>
            <ol>{e.summary.map((s, i) => <li key={i}><span>{String(i + 1).padStart(2, "0")}</span><H s={s} /></li>)}</ol>
          </section>

          {e.video && (
            <section className="wk-video" aria-label="원본 영상">
              <div className="wk-video-frame">
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${e.video.id}`}
                  title={e.video.title}
                  loading="lazy"
                  allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
              <div className="wk-video-cap">
                원본 영상 · {e.video.channel} 「{e.video.title}」 ({fmt(e.video.published)}) · 유료광고 표기{" "}
                <b>{e.video.paidAd}</b>
              </div>
              {e.video.quotes.length > 0 && (
                <div className="wk-quotes">
                  {e.video.quotes.map((q, i) => (
                    <div className="wk-quote" key={i}>
                      <a href={`https://www.youtube.com/watch?v=${e.video!.id}&t=${toSec(q.t)}s`} target="_blank" rel="noopener">{q.t}</a>
                      <span>“{q.text}”</span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          <div className="wk-grid">
            <main className="wk-main">
              {e.sections.map((s, i) => (
                <section key={i}>
                  <h2>{s.h}</h2>
                  {s.blocks.map((b, j) => <BlockView key={j} b={b} />)}
                  {/* 본문 이미지는 둘째 섹션 끝에(섹션이 3개 이상일 때) */}
                  {im?.body && i === 1 && e.sections.length >= 3 && (
                    <figure className="wk-fig">
                      <img src={im.body} alt={`${im.alt}(본문)`} width={960} height={540} loading="lazy" decoding="async" />
                      <figcaption>{IMAGE_CAPTION}</figcaption>
                    </figure>
                  )}
                </section>
              ))}

              {e.faq.length > 0 && (
                <section>
                  <h2>자주 묻는 질문</h2>
                  <div className="wk-faq">
                    {e.faq.map((f, i) => (
                      <details key={i} open={i === 0}>
                        <summary>{f.q}</summary>
                        <p><H s={f.a} /></p>
                      </details>
                    ))}
                  </div>
                </section>
              )}

              <section>
                <h2>근거 자료</h2>
                <ul className="wk-src">
                  {e.sources.map((s, i) => (
                    <li key={i}>
                      <span className="k">{s.kind}</span>
                      <a href={s.url} target="_blank" rel="noopener nofollow">{s.label}</a>
                    </li>
                  ))}
                </ul>
                <p style={{ fontSize: 13.5, color: "#9a9286" }}>
                  가격·일정은 확인일 기준입니다. 바뀐 내용을 발견하면 확인 후 이 항목을 고칩니다.
                </p>
              </section>
            </main>

            <aside className="wk-rail">
              {e.infobox.length > 0 && (
                <div className="wk-box">
                  <div className="wk-box-h">{e.title}</div>
                  <table className="wk-info">
                    <tbody>
                      {e.sale && (
                        <tr>
                          <th>2026 일정</th>
                          <td>
                            {e.sale.status === "확정" ? (
                              <span className="wk-pill" style={{ color: "#2f7d4f" }}>확정 {fmt(e.sale.start!)}~{fmt(e.sale.end!)}</span>
                            ) : (
                              <span className="wk-pill" style={{ color: "#b0661a" }}>미발표</span>
                            )}
                          </td>
                        </tr>
                      )}
                      {e.apply && (
                        <tr>
                          <th>{e.apply.next.label ?? "다음 회차"}</th>
                          <td>
                            {e.apply.next.status === "확정" ? (
                              <span className="wk-pill" style={{ color: "#2f7d4f" }}>확정 {fmt(e.apply.next.start!)}~{fmt(e.apply.next.end!)}</span>
                            ) : e.apply.next.status === "상시" ? (
                              <span className="wk-pill" style={{ color: "#38539a" }}>연중 상시</span>
                            ) : (
                              <span className="wk-pill" style={{ color: "#b0661a" }}>공고 전</span>
                            )}
                          </td>
                        </tr>
                      )}
                      {e.infobox.map((r, i) => <tr key={i}><th>{r.label}</th><td><H s={r.value} /></td></tr>)}
                    </tbody>
                  </table>
                </div>
              )}

              {relEntries.length > 0 && (
                <div className="wk-box">
                  <div className="wk-box-h">함께 찾아보는 항목</div>
                  <div className="wk-rel">
                    {relEntries.map((r) => (
                      <Link key={r.slug} href={`/wiki/${r.slug}`}>{r.title}<small>{WIKI_TYPE_LABEL[r.type]}</small></Link>
                    ))}
                  </div>
                </div>
              )}

              {relArticles.length > 0 && (
                <div className="wk-box">
                  <div className="wk-box-h">더 깊이 읽기</div>
                  <div className="wk-rel">
                    {relArticles.map((a) => (
                      <a key={a.slug} href={canonicalArticleUrl(a.slug)}>{a.title}</a>
                    ))}
                  </div>
                </div>
              )}
            </aside>
          </div>
        </div>
      </div>
      <MediaFooter />
    </>
  );
}
