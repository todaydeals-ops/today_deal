import type { CSSProperties } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import MediaFooter from "@/components/MediaFooter";
import { fetchMagazineList, fetchMagazineCountBy, type MagazineArticle } from "@/lib/data/magazine";
import { labHref } from "@/lib/magazine/subdomain";
import { thumbUrl } from "@/lib/magazine/thumb";
import s from "./hub.module.css";

// 건강·뷰티 허브 공용 화면 — 잠자리연구소(/goodsleep) · 알약연구소(/pill) · 성분(뷰티)연구소(/beauty).
// 2026-10-27 리뉴얼(시안: 오늘의딜 홈·AS 목록의 토큰·섹션 머리·최신 가이드 행·페이저를 그대로 따른다).
// 세 화면은 구조가 같고 이름·카피·분류·데이터 조회 조건만 다르다 — 그 차이는 전부 config 로 받는다.
//
// ★SEO(generateMetadata·canonical)는 각 page.tsx 가 그대로 가진다. 여기서는 그리기와 목록 조회만 한다.
// ★페이징은 DB 에서 끝낸다. 전 편을 받아 메모리에서 자르면 12편 띄우자고 본문 전체(평균 15KB)를 수십 편치 끌어오게 된다.
// ★페이지·분류 링크는 next/link 가 아니라 <a>. 경로가 전부 같고 쿼리(?cat=&page=)만 다르면 라우터 프리페치 캐시가 꼬여
//   클릭해도 목록이 그대로인 사고가 있었다(components/magazine/Pagination.tsx 주석, 홈·b4as 와 같다).

const PER = 12;
const fmtDate = (iso: string) => iso.slice(0, 10).replace(/-/g, ".");
const pad = (n: number) => String(n).padStart(2, "0");

export interface HubCategory {
  key: string; // URL용 ASCII (?cat=)
  label: string;
  en: string; // 영문 서브(Mono 라벨)
  color: string; // 점 색
  angle: string; // 한 줄 설명
  slugs: string[]; // 이 분류에 속한 글
}

export interface HubConfig {
  /** LAB_HOME 키 — 허브 주소·분류·페이지 링크를 만든다 */
  lab: "sleep" | "pill" | "beauty";
  /** 데이터 조회 조건: magazine.field (분야 격리) */
  field: string;
  categories: HubCategory[];
  /** 히어로 위 Mono 영문 라벨 */
  eyebrow: string;
  /** 브레드크럼에 쓰는 허브 이름(예: 수면) */
  crumb: string;
  /** 분류 미선택 H1 = [앞, 강조(녹색), 뒤] */
  headline: [string, string, string];
  lead: string;
  /** 분류 페이지 설명: `${cat.angle}을(를) 중심으로, ${catLeadTail}` */
  catLeadTail: string;
  /** 분류 미선택 목록 제목 */
  listTitle: string;
  /** 대표 글 버튼 문구(예: 칼럼 읽기) */
  readLabel: string;
  /** 글이 0편일 때 */
  emptyText: string;
  /** 어느 분류에도 못 들어간 글의 라벨(목록용 짧은 이름) */
  shortLabel: string;
}

// 라이선스 표기가 필요한 이미지(Openverse CC)는 카드(전체가 링크)에 표기를 실을 수 없어 쓰지 않는다 -> 빈 박스.
// (아티클 상세 app/magazine/[slug]/page.tsx 의 thumbOf 와 같은 방침)
function imgOf(a: MagazineArticle, w: number): string | undefined {
  const im = a.image;
  if (!im?.url || /^openverse/i.test(im.source ?? "")) return undefined;
  return thumbUrl(im.url, w);
}

export default async function HubPage({ config, cat, page }: { config: HubConfig; cat?: HubCategory; page: number }) {
  const { lab, field, categories } = config;
  const where = { field, slugs: cat?.slugs };
  const [total, pageList] = await Promise.all([
    fetchMagazineCountBy(where),
    fetchMagazineList({ ...where, offset: (page - 1) * PER, limit: PER }),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PER));
  const featured = page === 1 ? pageList[0] : undefined;
  const rows = page === 1 ? pageList.slice(1) : pageList;
  const showIndex = !cat && page === 1;
  // 대표 글 한 편뿐인 첫 페이지는 목록이 비므로 목록 섹션을 그리지 않는다. 범위를 벗어난 페이지는 안내와 페이저를 보여 준다.
  const showList = rows.length > 0 || !featured;

  const hubHref = labHref(lab);
  const pageHref = (p: number) => labHref(lab, cat?.key, p);

  // slug -> 분류(뒤에 나온 분류가 이긴다: 기존 sleepCategoryOf 와 같은 규칙)
  const catBySlug = new Map<string, HubCategory>();
  for (const c of categories) for (const sl of c.slugs) catBySlug.set(sl, c);

  // 페이지 번호 윈도우(5개)
  const win = 5;
  const end = Math.min(totalPages, Math.max(page + 2, win));
  const start = Math.max(1, end - win + 1);
  const nums: number[] = [];
  for (let p = start; p <= end; p++) nums.push(p);

  const fCat = featured ? catBySlug.get(featured.slug) : undefined;
  const fImg = featured ? imgOf(featured, 760) : undefined;
  const colsStyle = { "--cols": categories.length, "--cols-md": categories.length > 6 ? 4 : 3 } as CSSProperties;

  return (
    <div className={`rn-page ${s.root}`}>
      <Header />

      <main className="rn-wrap">
        {/* 히어로: 브레드크럼 -> Mono 아이브로 -> H1 -> 설명 */}
        <section className={s.hero}>
          <nav className={s.crumb} aria-label="현재 위치">
            <Link href="/">오늘의딜</Link>
            <span aria-hidden="true">›</span>
            {cat ? (
              <>
                <a href={hubHref}>{config.crumb}</a>
                <span aria-hidden="true">›</span>
                <span aria-current="page">{cat.label}</span>
              </>
            ) : (
              <span aria-current="page">{config.crumb}</span>
            )}
          </nav>

          <div className={s.heroText}>
            <div className="rn-eyebrow">{config.eyebrow}{cat ? ` · ${cat.en}` : ""}</div>
            <div className={s.h1Row}>
              <a className={s.back} href={cat ? hubHref : "/"} aria-label={cat ? `${config.crumb} 전체로` : "홈으로"}>‹</a>
              {cat ? (
                <h1 className={s.h1}>{cat.label}</h1>
              ) : (
                <h1 className={s.h1}>{config.headline[0]}<em>{config.headline[1]}</em>{config.headline[2]}</h1>
              )}
            </div>
            <p className={s.lead}>{cat ? `${cat.angle}을(를) 중심으로, ${config.catLeadTail}` : config.lead}</p>
          </div>
        </section>

        {/* 분류: 허브 첫 화면은 카드, 분류·2페이지 이후는 칩(다른 분류로 바로 건너가게) */}
        {showIndex ? (
          <section className={s.cats} style={colsStyle} aria-label={`${config.crumb} 분류`}>
            {categories.map((c, i) => (
              <a key={c.key} className={s.cat} href={labHref(lab, c.key)}>
                <span className={s.catTop}>
                  <span className={s.catNo}>{pad(i + 1)}</span>
                  <span className={s.catDot} style={{ background: c.color }} aria-hidden="true" />
                </span>
                <span className={s.catName}>{c.label}</span>
                <span className={s.catEn}>{c.en}</span>
                <span className={s.catDesc}>{c.angle}</span>
              </a>
            ))}
          </section>
        ) : (
          <nav className={s.chips} aria-label={`${config.crumb} 분류`}>
            <a className={`rn-pill ${s.chip} ${!cat ? "on" : ""}`} href={hubHref} aria-current={!cat ? "true" : undefined}>전체</a>
            {categories.map((c) => {
              const on = cat?.key === c.key;
              return <a key={c.key} className={`rn-pill ${s.chip} ${on ? "on" : ""}`} href={labHref(lab, c.key)} aria-current={on ? "true" : undefined}>{c.label}</a>;
            })}
          </nav>
        )}

        {total === 0 ? (
          <section className={s.empty}>
            <strong>{config.emptyText}</strong>
            {cat && <a href={hubHref}>다른 분류 보러 가기 →</a>}
          </section>
        ) : (
          <>
            {featured && (
              <section className={s.featured} aria-label="대표 글">
                <Link href={`/magazine/${featured.slug}`} className={s.featImg} tabIndex={-1} aria-hidden="true">
                  {fImg && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={fImg} alt={`${featured.title}, ${fCat?.label ?? config.shortLabel} | 오늘의딜`} width={760} height={497} loading="eager" fetchPriority="high" decoding="async" />
                  )}
                </Link>
                <div className={s.featBox}>
                  <div className={s.featBadges}>
                    <span className={s.featBadge}>FEATURED</span>
                    <span className={s.featCat}>
                      <span className={s.dot} style={{ background: fCat?.color ?? "var(--rn-subtle)" }} aria-hidden="true" />
                      {fCat?.label ?? featured.field ?? config.shortLabel}
                    </span>
                  </div>
                  <h2 className={s.featTitle}>{featured.title}</h2>
                  {featured.excerpt && <p className={s.featLead}>{featured.excerpt}</p>}
                  <div className={s.featRow}>
                    <Link href={`/magazine/${featured.slug}`} className={s.featCta} aria-label={`${config.readLabel}: ${featured.title}`}>{config.readLabel} →</Link>
                    <span className={s.featMeta}>오늘의딜 · {fmtDate(featured.createdAt)}{featured.readMin ? ` · 읽기 ${featured.readMin}분` : ""}</span>
                  </div>
                </div>
              </section>
            )}

            {showList && (
            <section className={`rn-sec ${s.listSec}`} aria-labelledby="hub-list-title">
              <div className="rn-sec-head">
                <div className="rn-sec-title">
                  <span className="rn-eyebrow">LATEST</span>
                  <h2 id="hub-list-title">{cat ? cat.label : config.listTitle}</h2>
                </div>
                <span className={s.count}>{total}편</span>
              </div>

              {rows.length > 0 ? (
                <div className={s.guides}>
                  {rows.map((a, i) => {
                    const rc = catBySlug.get(a.slug);
                    const img = imgOf(a, 240);
                    return (
                      <Link key={a.id} href={`/magazine/${a.slug}`} className={s.guide}>
                        <span className={s.guideNo}>{pad((page - 1) * PER + (page === 1 ? i + 2 : i + 1))}</span>
                        <span className={s.guideText}>
                          <span className={s.guideCat}>
                            <span className={s.dot} style={{ background: rc?.color ?? "var(--rn-subtle)" }} aria-hidden="true" />
                            {rc?.label ?? config.shortLabel}
                          </span>
                          <span className={s.guideTitle}>{a.title}</span>
                        </span>
                        <span className={s.guideThumb}>
                          {img && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={img} alt="" width={96} height={72} loading="lazy" decoding="async" />
                          )}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <p className={s.note}>이 페이지에는 글이 없어요. <a href={pageHref(1)}>첫 페이지로 돌아가기 →</a></p>
              )}

              {totalPages > 1 && (
                <div className={s.pagerWrap}>
                  <nav className="rn-pager" aria-label={`${config.crumb} 글 페이지`}>
                    {page > 1 ? <a href={pageHref(1)} aria-label="처음">«</a> : <span className="off">«</span>}
                    {page > 1 ? <a href={pageHref(page - 1)} rel="prev">‹ 이전</a> : <span className="off">‹ 이전</span>}
                    {nums.map((p) => (p === page ? <span key={p} className="cur" aria-current="page">{p}</span> : <a key={p} href={pageHref(p)}>{p}</a>))}
                    {page < totalPages ? <a href={pageHref(page + 1)} rel="next">다음 ›</a> : <span className="off">다음 ›</span>}
                    {page < totalPages ? <a href={pageHref(totalPages)} aria-label="마지막">»</a> : <span className="off">»</span>}
                  </nav>
                </div>
              )}
            </section>
            )}
          </>
        )}
      </main>

      <MediaFooter />
    </div>
  );
}
