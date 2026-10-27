// 생활백과 항목 상세의 화면 본체 - 시안(오늘의딜 생활백과 상세.dc.html)을 그대로 옮긴다.
// 서버 컴포넌트(훅 없음). 날짜에 따라 바뀌는 상태·D-day 는 클라이언트 섬(InfoCard)이, 준비물 체크는 PrepChecklist 가 맡는다.
// 메타데이터·JSON-LD·정적 생성은 app/wiki/[slug]/page.tsx 가 그대로 맡고, 이 파일은 보이는 부분만 그린다.
import Link from "next/link";
import { WIKI_GROUPS, WIKI_TYPE_LABEL, type Block, type WikiEntry } from "@/lib/wiki/types";
import { scheduleOf, whenText } from "@/lib/wiki/status";
import { imagesOf, IMAGE_CAPTION } from "@/lib/wiki/images";
import s from "@/app/wiki/[slug]/wiki-detail.module.css";
import H from "./H";
import InfoCard from "./InfoCard";
import PrepChecklist from "./PrepChecklist";
import { pickCta } from "./cta";
import { glanceTiles, isGlanceHeading, isPrepHeading, prepTitle } from "./sections";

const fmt = (d: string) => d.replace(/-/g, ".");
const hostOf = (u: string) => {
  try {
    return new URL(u).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
};
// "1:23" -> 83초 (유튜브 t= 파라미터용)
const toSec = (t: string) => t.split(":").reduce((a, x) => a * 60 + Number(x), 0);

export interface RelArticle {
  title: string;
  href: string;
}

/** 일반 블록 - 문단 / 목록 / 단계(36px 다크 번호) / 주의 콜아웃 / 표 */
function BlockView({ b }: { b: Block }) {
  if ("p" in b) return <p><H s={b.p} /></p>;
  if ("list" in b) return <ul className={s.list}>{b.list.map((x, i) => <li key={i}><H s={x} /></li>)}</ul>;
  // 시안 03 신청 순서: 36px 다크 번호 + 본문. 우리 단계는 한 문장(제목·본문 분리 없음)이라 본문만 둔다.
  if ("steps" in b) {
    return (
      <ol className={s.steps}>
        {b.steps.map((x, i) => (
          <li key={i}>
            <span className={s.stepNo} aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>
            <span className={s.stepText}><H s={x} /></span>
          </li>
        ))}
      </ol>
    );
  }
  // 시안 05 주의: 주황 경고 콜아웃(! 아이콘). 색만으로 전하지 않도록 아이콘 + 스크린리더용 "주의" 라벨을 함께 둔다.
  if ("note" in b) {
    return (
      <div className={s.note} role="note">
        <span className={s.noteIcon} aria-hidden="true">!</span>
        <span className={s.noteText}><span className={s.srOnly}>주의: </span><H s={b.note} /></span>
      </div>
    );
  }
  // 표 - 좁은 화면에서는 CSS 가 스택 카드로 바꾼다(칸마다 data-label). 표 의미가 사라지지 않게 role 을 명시한다.
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

export default function WikiDetailView({
  e,
  relEntries,
  relArticles,
}: {
  e: WikiEntry;
  relEntries: WikiEntry[];
  relArticles: RelArticle[];
}) {
  const im = imagesOf(e.slug);
  const typeLabel = WIKI_TYPE_LABEL[e.type];
  const grp = e.group ? WIKI_GROUPS.find((g) => g.label === e.group) : undefined;
  const sch = scheduleOf(e);
  const cta = pickCta(e);

  // 출처 배지 - 공식이 전부면 "출처 N곳 · 공식", 일부면 "공식 K곳", 없으면 수만
  const officialN = e.sources.filter((x) => x.kind === "공식").length;
  const srcBadge =
    `출처 ${e.sources.length}곳` +
    (officialN === e.sources.length ? " · 공식" : officialN > 0 ? ` · 공식 ${officialN}곳` : "");

  // 월 단위로만 확정된 일정(예: 2026-10 ~ 2026-11)은 status.ts 가 "발표 전"으로 보지만, 알려진 월은 카드에 그대로 보여 준다
  const next = e.type === "apply" ? e.apply?.next : e.type === "sale" ? e.sale : undefined;
  const monthNote =
    next && next.status === "확정" && sch.kind !== "dated" && next.start
      ? !next.end || next.end === next.start ? fmt(next.start) : `${fmt(next.start)} ~ ${fmt(next.end)}`
      : undefined;

  // 목차 - 시안 번호 규칙: 핵심 요약·FAQ·근거 자료는 "·", 섹션은 01부터
  const toc: { no: string; label: string; href: string }[] = [{ no: "·", label: "핵심 요약", href: "#w0" }];
  if (e.video) toc.push({ no: "·", label: "원본 영상", href: "#wv" });
  e.sections.forEach((sec, i) => toc.push({ no: String(i + 1).padStart(2, "0"), label: sec.h, href: `#w${i + 1}` }));
  if (e.faq.length) toc.push({ no: "·", label: "자주 묻는 질문", href: "#wfaq" });
  toc.push({ no: "·", label: "근거 자료", href: "#wsrc" });

  const catOf = (r: WikiEntry) => `${WIKI_TYPE_LABEL[r.type]}${r.group ? ` · ${r.group}` : ""}`;

  return (
    <main className={`rn-wrap ${s.root}`}>
      {/* 헤드: 브레드크럼 / H1 / 메타 */}
      <section className={s.head} aria-label="항목 머리">
        <nav className={s.crumbs} aria-label="현재 위치">
          <Link href="/wiki">생활백과</Link>
          <span aria-hidden="true">›</span>
          <Link href={`/wiki#${e.type}`}>{typeLabel}</Link>
          {e.group && (
            <>
              <span aria-hidden="true">›</span>
              <Link href={grp ? `/wiki#${e.type}-${grp.id}` : `/wiki#${e.type}`}>{e.group}</Link>
            </>
          )}
        </nav>
        <h1 className={s.title}>{e.seoTitle}</h1>
        <div className={s.meta}>
          <span>오늘의딜 생활백과 편집팀</span>
          <span>최종 확인 {fmt(e.updated)}</span>
          <span className={s.badge}>{srcBadge}</span>
        </div>
      </section>

      {/* 본문(760px) + 우측 정보 카드. 좁은 화면에서는 정보 카드가 본문 위로 */}
      <div className={s.layout}>
        <article className={s.article}>
          {im && (
            <figure className={s.fig}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className={s.figImg} src={im.hero} alt={im.alt} width={960} height={540} loading="eager" fetchPriority="high" decoding="async" />
              <figcaption>{IMAGE_CAPTION}</figcaption>
            </figure>
          )}

          {/* 핵심 요약(초록 박스) */}
          <section id="w0" className={s.conclusion} aria-label="핵심 요약">
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

          {/* 원본 영상 - 영상 속 그 제품 전용(시안에 없는 블록이라 디자인 언어만 따른다) */}
          {e.video && (
            <section id="wv" className={s.video} aria-label="원본 영상">
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
                <b className={`${s.ad} ${e.video.paidAd === "없음" ? s.adNone : ""}`}>{e.video.paidAd}</b>
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

          {/* 본문 섹션 - 우리 데이터 순서 그대로. 한눈에 보기 표는 타일로, 준비물 목록은 체크 리스트로 도출한다 */}
          {e.sections.map((sec, i) => {
            const glance = isGlanceHeading(sec.h);
            const prep = isPrepHeading(sec.h);
            return (
              <section key={i} id={`w${i + 1}`} className={s.sec}>
                <div className={s.secHead}>
                  <span className={s.secNo} aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>
                  <h2 className={s.h2}>{sec.h}</h2>
                </div>
                <div className={s.prose}>
                  {sec.blocks.map((b, j) => {
                    const tiles = glance ? glanceTiles(b) : null;
                    if (tiles) {
                      return (
                        <div key={j} className={s.glanceWrap}>
                          {tiles.caption && <p className={s.glanceCap}>{tiles.caption}</p>}
                          <dl className={`${s.tiles} ${tiles.wide ? s.tilesWide : ""}`}>
                            {tiles.items.map((t, k) => (
                              <div className={s.tile} key={k}>
                                <dt><H s={t.k} /></dt>
                                <dd><H s={t.v} /></dd>
                              </div>
                            ))}
                          </dl>
                        </div>
                      );
                    }
                    if (prep && "list" in b) {
                      return <PrepChecklist key={j} slug={e.slug} group={`s${i}-${j}`} title={prepTitle(sec.h)} items={b.list} />;
                    }
                    return <BlockView key={j} b={b} />;
                  })}
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
            );
          })}

          {/* FAQ 아코디언(네이티브 details - 마크업은 항상 DOM 에 있다) */}
          {e.faq.length > 0 && (
            <section id="wfaq" className={s.faq} aria-label="자주 묻는 질문">
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

          {/* 근거 자료([공식] 등 배지) + 정정 정책 문구 */}
          <section id="wsrc" className={s.src} aria-label="근거 자료">
            <h2 className={s.secTitle}>근거 자료</h2>
            <ol className={s.srcList}>
              {e.sources.map((src, i) => {
                const host = hostOf(src.url);
                return (
                  <li key={i}>
                    <a href={src.url} target="_blank" rel="noopener nofollow">
                      <span className={s.srcNo}>[{i + 1}]</span>
                      <span className={`${s.srcTag} ${src.kind === "공식" ? "" : s.srcTagAlt}`}>{src.kind}</span>
                      <span>
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

        {/* 사이드바: 정보 카드 + 목차 카드 */}
        <aside className={s.aside} aria-label="항목 정보와 목차">
          <InfoCard kindLabel={typeLabel} title={e.title} noun={e.type === "sale" ? "행사" : "신청"} schedule={sch} monthNote={monthNote} cta={cta}>
            {e.infobox.map((r, i) => (
              <div className={s.cardRow} key={i}>
                <dt>{r.label}</dt>
                <dd><H s={r.value} /></dd>
              </div>
            ))}
          </InfoCard>
          <nav className={s.tocCard} aria-label="이 항목의 순서">
            <span className={s.tocTitle}>이 항목의 순서</span>
            <ol className={s.tocList}>
              {toc.map((t, i) => (
                <li key={i}>
                  <a href={t.href} className={s.tocLink}>
                    <span className={s.tocNo} aria-hidden="true">{t.no}</span>
                    <span>{t.label}</span>
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        </aside>
      </div>

      {/* 함께 찾아보는 항목(+ 더 깊이 읽기) */}
      {(relEntries.length > 0 || relArticles.length > 0) && (
        <section className={s.related} aria-label="함께 찾아보는 항목">
          {relEntries.length > 0 && (
            <>
              <h2 className={s.relTitle}>함께 찾아보는 항목</h2>
              <div className={s.relGrid}>
                {relEntries.map((r) => {
                  const when = whenText(scheduleOf(r));
                  return (
                    <Link key={r.slug} href={`/wiki/${r.slug}`} className={s.relCard}>
                      <span className={s.relTop}>
                        <span className={s.relCat}>{catOf(r)}</span>
                        {when && <span className={s.relWhen}>{when}</span>}
                      </span>
                      <span className={s.relName}>{r.title}</span>
                    </Link>
                  );
                })}
              </div>
            </>
          )}
          {relArticles.length > 0 && (
            <>
              <h2 className={`${s.relTitle} ${relEntries.length > 0 ? s.relTitleGap : ""}`}>더 깊이 읽기</h2>
              <div className={s.relGrid}>
                {relArticles.map((a) => (
                  <a key={a.href} href={a.href} className={s.relCard}>
                    <span className={s.relTop}><span className={s.relCat}>매거진</span></span>
                    <span className={s.relName}>{a.title}</span>
                  </a>
                ))}
              </div>
            </>
          )}
        </section>
      )}
    </main>
  );
}
