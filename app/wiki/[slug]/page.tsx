// 생활백과 항목 페이지 — content/wiki/<slug>.json 을 빌드 때 정적으로 굽는다.
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import MediaFooter from "@/components/MediaFooter";
import { allEntries, entryBySlug, wikiUrl, WIKI_BASE } from "@/lib/wiki/load";
import { WIKI_GROUPS, WIKI_TYPE_LABEL, type Block, type WikiEntry } from "@/lib/wiki/types";
import { imagesOf, IMAGE_CAPTION } from "@/lib/wiki/images";
import { fetchMagazineList } from "@/lib/data/magazine";
import { canonicalArticleUrl } from "@/lib/magazine/owner";
import s from "./wiki-detail.module.css";

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
  // 단계 목록 — 번호(Mono 초록)를 눈에 보이게 따로 그린다(아티클의 td-steps 와 같은 모양)
  if ("steps" in b) {
    return (
      <ol className={s.steps}>
        {b.steps.map((x, i) => (
          <li key={i}>
            <span className={s.stepNo} aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>
            <span><H s={x} /></span>
          </li>
        ))}
      </ol>
    );
  }
  if ("note" in b) return <div className={s.note}><H s={b.note} /></div>;
  // 표 — 좁은 화면에서는 CSS 가 스택 카드로 바꾼다(칸마다 data-label). 표 의미가 사라지지 않게 role 을 명시한다.
  const head = b.table.head;
  return (
    <div className={s.tblWrap}>
      <table className={`${s.tbl} ${head.length === 2 ? s.tbl2 : ""}`} role="table">
        <thead role="rowgroup"><tr role="row">{head.map((h, i) => <th key={i} scope="col" role="columnheader">{h}</th>)}</tr></thead>
        <tbody role="rowgroup">
          {b.table.rows.map((r, i) => (
            <tr key={i} role="row">
              {r.map((c, j) =>
                c.trim() === "" ? (
                  <td key={j} role="cell" className={s.tdEmpty} />
                ) : (
                  <td key={j} role="cell" data-label={j === 0 ? undefined : head[j]}><H s={c} /></td>
                ),
              )}
            </tr>
          ))}
        </tbody>
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

const fmt = (d: string) => d.replace(/-/g, ".");
const hostOf = (u: string) => {
  try {
    return new URL(u).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
};

export default async function WikiEntryPage({ params }: { params: Promise<{ slug: string }> }) {
  const e = entryBySlug((await params).slug);
  if (!e) notFound();

  const im = imagesOf(e.slug);
  const relEntries = (e.related?.entries ?? []).map(entryBySlug).filter((x): x is WikiEntry => !!x);
  const relArticles = e.related?.articles?.length
    ? await fetchMagazineList({ slugs: e.related.articles, all: true, light: true, limit: 12 })
    : [];
  const grp = e.group ? WIKI_GROUPS.find((g) => g.label === e.group) : undefined;

  return (
    <div className="rn-page">
      <Header />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld(e)) }} />

      <main className={`rn-wrap ${s.root}`}>
        {/* ── ① 헤드: 틴트 박스(브레드크럼 · 종류 라벨 · H1 · 메타) ── */}
        <section className={s.head} aria-label="항목 머리">
          <div className={s.headBox}>
            <nav className={s.crumbs} aria-label="현재 위치">
              <Link href="/wiki">생활백과</Link>
              <span aria-hidden="true">›</span>
              <Link href={`/wiki#${e.type}`}>{WIKI_TYPE_LABEL[e.type]}</Link>
              <span aria-hidden="true">›</span>
              <span aria-current="page">{e.title}</span>
            </nav>
            <div className={s.labels}>
              <span className={s.typeTag}>{WIKI_TYPE_LABEL[e.type]}</span>
              {grp && <Link href={`/wiki#${e.type}-${grp.id}`} className={s.groupTag}>{grp.label}</Link>}
            </div>
            <h1 className={s.title}>{e.seoTitle}</h1>
            <div className={s.meta}>
              <span>오늘의딜 생활백과 편집팀</span>
              <span>최종 확인 {fmt(e.updated)}</span>
              <span className={s.badge}>출처 {e.sources.length}곳</span>
            </div>
          </div>
        </section>

        {/* ── ② 본문 + 사이드바 ── */}
        <div className={s.body}>
          <article className={s.article}>
            {im && (
              <figure className={s.fig}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className={s.figImg} src={im.hero} alt={im.alt} width={1200} height={675} loading="eager" fetchPriority="high" decoding="async" />
                <figcaption>{IMAGE_CAPTION}</figcaption>
              </figure>
            )}

            {/* 핵심 요약 — 아티클의 「먼저 결론」과 같은 녹색 박스 */}
            <section className={s.conclusion} aria-label="핵심 요약">
              <span className={s.conclusionLabel}>핵심 요약</span>
              <ol className={s.conclusionList}>
                {e.summary.map((t, i) => (
                  <li key={i}>
                    <span className={s.conclusionNo}>{i + 1}</span>
                    <span><H s={t} /></span>
                  </li>
                ))}
              </ol>
            </section>

            {e.video && (
              <section className={s.video} aria-label="원본 영상">
                <div className={s.videoFrame}>
                  <iframe
                    src={`https://www.youtube-nocookie.com/embed/${e.video.id}`}
                    title={e.video.title}
                    loading="lazy"
                    allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
                <p className={s.videoCap}>
                  원본 영상 · {e.video.channel} 「{e.video.title}」 ({fmt(e.video.published)}) · 유료광고 표기{" "}
                  <b>{e.video.paidAd}</b>
                </p>
                {e.video.quotes.length > 0 && (
                  <div className={s.quotes}>
                    {e.video.quotes.map((q, i) => (
                      <div className={s.quote} key={i}>
                        <a href={`https://www.youtube.com/watch?v=${e.video!.id}&t=${toSec(q.t)}s`} target="_blank" rel="noopener">{q.t}</a>
                        <span>“{q.text}”</span>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}

            {e.sections.map((sec, i) => (
              <section key={i} className={s.sec}>
                <div className={s.secHead}>
                  <span className={s.secNo} aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>
                  <h2 className={s.h2}>{sec.h}</h2>
                </div>
                <div className={s.prose}>
                  {sec.blocks.map((b, j) => <BlockView key={j} b={b} />)}
                  {/* 본문 이미지는 둘째 섹션 끝에(섹션이 3개 이상일 때) */}
                  {im?.body && i === 1 && e.sections.length >= 3 && (
                    <figure className={`${s.fig} ${s.figBody}`}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img className={s.figImg} src={im.body} alt={`${im.alt}(본문)`} width={960} height={540} loading="lazy" decoding="async" />
                      <figcaption>{IMAGE_CAPTION}</figcaption>
                    </figure>
                  )}
                </div>
              </section>
            ))}

            {e.faq.length > 0 && (
              <section className={s.faq} aria-label="자주 묻는 질문">
                <h2 className={s.secTitle}>자주 묻는 질문</h2>
                <div className={s.faqList}>
                  {e.faq.map((f, i) => (
                    <details key={i} className={s.faqItem} open={i === 0}>
                      <summary>{f.q}</summary>
                      <p className={s.faqA}><H s={f.a} /></p>
                    </details>
                  ))}
                </div>
              </section>
            )}

            <section className={s.src} aria-label="근거 자료">
              <h2 className={s.secTitle}>근거 자료</h2>
              <ol className={s.srcList}>
                {e.sources.map((src, i) => {
                  const host = hostOf(src.url);
                  return (
                    <li key={i}>
                      <a href={src.url} target="_blank" rel="noopener nofollow">
                        <span className={s.srcNo}>[{i + 1}]</span>
                        <span>
                          <span className={`${s.srcTag} ${src.kind === "공식" ? "" : s.srcTagAlt}`}>{src.kind}</span>
                          {src.label}
                          {host && <span className={s.srcHost}> · {host}</span>}
                        </span>
                      </a>
                    </li>
                  );
                })}
              </ol>
              <p className={s.srcNote}>가격·일정은 확인일 기준입니다. 바뀐 내용을 발견하면 확인 후 이 항목을 고칩니다.</p>
            </section>
          </article>

          {/* 사이드바: 정보 박스 · 관련 항목 · 더 깊이 읽기. 1000px 이하에서는 본문 아래로 내려온다 */}
          <aside className={s.aside} aria-label="항목 정보와 관련 글">
            {e.infobox.length > 0 && (
              <div className={s.box}>
                <div className={s.boxHead}>{e.title}</div>
                <dl className={s.info}>
                  {e.sale && (
                    <div className={s.infoRow}>
                      <dt>2026 일정</dt>
                      <dd>
                        {e.sale.status === "확정" ? (
                          <span className={`${s.st} ${s.stOk}`}>확정 {fmt(e.sale.start!)}~{fmt(e.sale.end!)}</span>
                        ) : e.sale.status === "상시" ? (
                          <span className={`${s.st} ${s.stAlways}`}>상시 운영</span>
                        ) : (
                          <span className={`${s.st} ${s.stWait}`}>미발표</span>
                        )}
                      </dd>
                    </div>
                  )}
                  {e.apply && (
                    <div className={s.infoRow}>
                      <dt>{e.apply.next.label ?? "다음 회차"}</dt>
                      <dd>
                        {e.apply.next.status === "확정" ? (
                          <span className={`${s.st} ${s.stOk}`}>확정 {fmt(e.apply.next.start!)}~{fmt(e.apply.next.end!)}</span>
                        ) : e.apply.next.status === "상시" ? (
                          <span className={`${s.st} ${s.stAlways}`}>회차 없이 수시 신청</span>
                        ) : (
                          <span className={`${s.st} ${s.stWait}`}>공고 전</span>
                        )}
                      </dd>
                    </div>
                  )}
                  {e.infobox.map((r, i) => (
                    <div className={s.infoRow} key={i}>
                      <dt>{r.label}</dt>
                      <dd><H s={r.value} /></dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}

            {relEntries.length > 0 && (
              <nav className={s.box} aria-label="함께 찾아보는 항목">
                <div className={s.boxLabel}>함께 찾아보는 항목</div>
                <div className={s.relList}>
                  {relEntries.map((r) => (
                    <Link key={r.slug} href={`/wiki/${r.slug}`}>{r.title}<span className={s.relType}>{WIKI_TYPE_LABEL[r.type]}</span></Link>
                  ))}
                </div>
              </nav>
            )}

            {relArticles.length > 0 && (
              <nav className={s.box} aria-label="더 깊이 읽기">
                <div className={s.boxLabel}>더 깊이 읽기</div>
                <div className={s.relList}>
                  {relArticles.map((a) => (
                    <a key={a.slug} href={canonicalArticleUrl(a.slug)}>{a.title}</a>
                  ))}
                </div>
              </nav>
            )}
          </aside>
        </div>
      </main>

      <MediaFooter />
    </div>
  );
}
