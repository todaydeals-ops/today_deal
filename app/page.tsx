import Link from "next/link";
import { preload } from "react-dom";
import Header from "@/components/Header";
import MediaFooter from "@/components/MediaFooter";
import HomeSearch from "@/components/home/HomeSearch";
import AsModule, { type AsGroupData } from "@/components/home/AsModule";
import { fetchMagazineList, fetchMagazineCount } from "@/lib/data/magazine";
import { fetchReportList } from "@/lib/data/magazine-report";
import { allEntries } from "@/lib/wiki/load";
import { WIKI_TYPE_LABEL } from "@/lib/wiki/types";
import { isCorner, cornerOf } from "@/lib/magazine/corners";
import { NAV } from "@/lib/nav";
import { upcomingDeadlines } from "@/lib/home-schedule";
import { HOME_CHIPS, PILLARS, AS_ITEMS, AS_IMG_ALT, CORNER_TABS, REPORT_COVER_SLUGS } from "@/lib/home-content";
import styles from "./home.module.css";

// ★2026-10-21 개편(사장님 지시): 오늘의딜은 정보성 콘텐츠(매거진·생활백과) 채널이다.
// 타임딜·추천딜·핫딜글은 폐지했고(라우트는 proxy.ts 가 410/301), 홈은 더 이상 딜을 읽지 않는다.
// ★2026-10-27 홈페이지 리뉴얼: 디자인 핸드오프(.tmp/renewal) 기준으로 화면을 다시 짰다 — 검색 중심 히어로, 4개 축, AS 셀프체크 모듈,
//   피처드, 최신 가이드(코너 탭), 생활백과 새 항목, 큐레이션 리포트. 데이터·SEO 는 그대로(구조화 데이터·canonical·코너/페이지 쿼리).
export const revalidate = 600;

const SITE = "https://www.todaydeals.co.kr";
const fmtDate = (iso: string) => iso.slice(0, 10).replace(/-/g, ".");
const ROWS = 9; // 최신 가이드 한 페이지 목록 수(1페이지는 피처드 1편 + 9편)

// 오늘의 "새 항목" 6개 — 최근 한 달 안에 만든 항목 가운데 하루 단위로 돌려 가며 보여 준다(같은 날 수백 개가 쌓여도 매번 같은 6개만 나오지 않게).
function pickNewWiki(n = 6) {
  const all = allEntries();
  const cutoff = Date.now() - 45 * 86400000;
  const fresh = all.filter((e) => Date.parse(e.created) >= cutoff).sort((a, b) => a.slug.localeCompare(b.slug));
  const pool = fresh.length >= n ? fresh : all;
  let seed = Math.floor((Date.now() + 9 * 3600000) / 86400000) >>> 0;
  const rnd = () => { seed = (seed + 0x6d2b79f5) >>> 0; let t = seed; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const arr = [...pool];
  for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; }
  return { picks: arr.slice(0, n), total: all.length };
}

export default async function Home({ searchParams }: { searchParams: Promise<{ corner?: string; page?: string }> }) {
  const sp = await searchParams;
  const corner = isCorner(sp.corner) ? sp.corner : undefined;
  const page = Math.max(1, Number(sp.page) || 1);

  preload("/renewal/home-hero.jpg", { as: "image", fetchPriority: "high" });

  // 1페이지: 피처드 1편 + 목록 9편(limit 10) / 2페이지부터: 앞 1+9(n-1)편을 건너뛴 9편
  const offset = page === 1 ? 0 : 1 + (page - 1) * ROWS;
  const limit = page === 1 ? ROWS + 1 : ROWS;
  const [magList, total, reports] = await Promise.all([
    fetchMagazineList({ corner, offset, limit }),
    fetchMagazineCount(corner),
    corner || page > 1 ? Promise.resolve([]) : fetchReportList(6),
  ]);
  const totalPages = Math.max(1, Math.ceil(Math.max(0, total - 1) / ROWS));
  const featured = page === 1 ? magList[0] : undefined;
  const rows = page === 1 ? magList.slice(1) : magList;
  const rowBase = page === 1 ? 0 : (page - 1) * ROWS;

  const deadlines = upcomingDeadlines(3);
  const { picks: wikiPicks, total: wikiTotal } = pickNewWiki(6);

  // AS 모듈: 탭 3개(가전/디지털/헬스·통신·자동차) × 카테고리 3개 — lib/nav.ts 의 3단계 구조를 그대로 쓴다
  const asNav = NAV.find((g) => g.key === "b4as")!;
  const asGroups: AsGroupData[] = asNav.items.map((grp) => ({
    label: grp.label,
    cats: (grp.children ?? []).map((c) => {
      const key = new URL(c.href!, SITE).searchParams.get("cat") ?? "";
      return { key, name: c.label, href: c.href!, img: `/renewal/as-${key}.jpg`, alt: AS_IMG_ALT[key] ?? c.label, items: AS_ITEMS[key] ?? [] };
    }),
  }));

  // 정보 채널 홈 — 최신 글 목록을 모음 페이지로 알린다(예전엔 타임딜 상품 ItemList 였다)
  const ld = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        name: "오늘의딜 — 사기 전에, 고치기 전에 보는 정보",
        url: SITE,
        inLanguage: "ko-KR",
        mainEntity: {
          "@type": "ItemList",
          itemListElement: magList.map((a, i) => ({ "@type": "ListItem", position: i + 1, url: `${SITE}/magazine/${a.slug}`, name: a.title })),
        },
      },
    ],
  };

  const href = (p: number, c = corner) => {
    const q = new URLSearchParams();
    if (c) q.set("corner", c);
    if (p > 1) q.set("page", String(p));
    const s = q.toString();
    return `${s ? `/?${s}` : "/"}#guides`;
  };

  // 페이지 번호 윈도우(5개) — 페이지 링크는 <a>(프리페치 캐시 꼬임 방지: components/magazine/Pagination.tsx 주석 참고)
  const win = 5;
  const end = Math.min(totalPages, Math.max(page + 2, win));
  const start = Math.max(1, end - win + 1);
  const nums: number[] = [];
  for (let p = start; p <= end; p++) nums.push(p);

  return (
    <div className="rn-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <Header />

      <main className="rn-wrap">
        {/* 1. Hero — 검색으로 바로 답 찾기 */}
        <section className={styles.hero} aria-label="오늘의딜 소개와 검색">
          <div className={styles.heroText}>
            <div className="rn-eyebrow">NEUTRAL SHOPPING GUIDE</div>
            <h1 className={styles.h1}>사기 전에, 고치기 전에<br />기준부터 확인하세요.</h1>
            <p className={styles.lead}>고르는 법·성분 근거·고장 셀프체크·세일 일정까지. 오늘의딜은 고려해야 할 기준과 숫자를 출처와 함께 정리합니다.</p>
            <HomeSearch chips={HOME_CHIPS} />
          </div>

          <div className={styles.heroRight}>
            <div className={styles.heroImg}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/renewal/home-hero.jpg" alt="밝은 거실에서 공기청정기와 생활 가전을 고르는 장면" width={1600} height={1400} fetchPriority="high" decoding="async" />
            </div>
            {deadlines.length > 0 && (
              <aside className={styles.deadlines} aria-label="다가오는 일정">
                <div className={styles.dlHead}>
                  <strong>다가오는 일정</strong>
                  <Link href="/wiki#sale">달력 전체 →</Link>
                </div>
                <div className={styles.dlGrid}>
                  {deadlines.map((d) => (
                    <Link key={d.href} href={d.href} className={styles.dl}>
                      <span className={styles.dlTop}><span>{d.d}</span> <span className={styles.dlDate}>{d.date}</span></span>
                      <span className={styles.dlTitle}>{d.title}</span>
                    </Link>
                  ))}
                </div>
              </aside>
            )}
          </div>
        </section>

        {/* 2. 4개 축 카드 */}
        {!corner && page === 1 && (
          <section className={styles.pillars} aria-label="오늘의딜 4개 분야">
            {PILLARS.map((p) => (
              <div key={p.no} className={styles.pillar}>
                <Link href={p.href} className={styles.pillarImg} tabIndex={-1} aria-hidden="true">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.img} alt="" width={1200} height={800} loading="lazy" decoding="async" />
                </Link>
                <div className={styles.pillarNo}>{p.no}<span className={styles.pillarEn}> · {p.en}</span></div>
                <div className={styles.pillarBody}>
                  <Link href={p.href} className={styles.pillarTitle}>{p.title}<span className={styles.pillarArrow}> →</span></Link>
                  <span className={styles.pillarDesc}>{p.desc}</span>
                </div>
                <div className={styles.pillarLinks}>
                  {p.links.map((l, i) => (
                    <Link key={l} href={p.hrefs[i] ?? p.href}><span>{l}</span><span>›</span></Link>
                  ))}
                </div>
              </div>
            ))}
          </section>
        )}

        {/* 3. AS 셀프체크 모듈 */}
        {!corner && page === 1 && (
          <section id="as" className="rn-sec" aria-labelledby="as-title">
            <div className="rn-sec-head">
              <div className="rn-sec-title">
                <span className="rn-eyebrow">SELF CHECK</span>
                <h2 id="as-title">AS 부르기 전, 5분 셀프체크</h2>
              </div>
            </div>
            <AsModule groups={asGroups} />
          </section>
        )}

        {/* 4. 피처드 아티클 */}
        {featured && (
          <section className={styles.featured} aria-label="대표 가이드">
            <Link href={`/magazine/${featured.slug}`} className={styles.featImg} tabIndex={-1} aria-hidden="true">
              {featured.image?.url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={featured.image.url} alt="" loading="lazy" decoding="async" />
              )}
            </Link>
            <div className={styles.featBox}>
              <div className={styles.featBadges}>
                <span className={styles.featBadge}>FEATURED</span>
                <span className={styles.featCat}>{cornerOf(featured.corner).name}{featured.field ? ` · ${featured.field}` : ""}</span>
              </div>
              <h2 className={styles.featTitle}>{featured.title}</h2>
              {featured.excerpt && <p className={styles.featLead}>{featured.excerpt}</p>}
              <div className={styles.featRow}>
                <Link href={`/magazine/${featured.slug}`} className={styles.featCta}>가이드 읽기 →</Link>
                <span className={styles.featMeta}>편집국 · {fmtDate(featured.createdAt)}{featured.readMin ? ` · 읽기 ${featured.readMin}분` : ""}</span>
              </div>
            </div>
          </section>
        )}

        {/* 5. 최신 가이드 */}
        <section id="guides" className="rn-sec" aria-labelledby="guides-title">
          <div className="rn-sec-head">
            <div className="rn-sec-title">
              <span className="rn-eyebrow">LATEST</span>
              <h2 id="guides-title">최신 가이드</h2>
            </div>
            <nav className={styles.tabs} aria-label="코너">
              {CORNER_TABS.map((t) => {
                const on = (t.corner ?? undefined) === corner;
                return <a key={t.label} href={href(1, t.corner)} className={`rn-pill ${on ? "on" : ""}`} aria-current={on ? "true" : undefined}>{t.label}</a>;
              })}
            </nav>
          </div>
          {magList.length === 0 ? (
            <div className={styles.empty}>
              <strong>가이드를 준비하고 있어요.</strong>
              <span>사기 전에 확인할 것들로 곧 채워집니다.</span>
            </div>
          ) : (
            <div className={styles.guides}>
              {rows.map((a, i) => (
                <Link key={a.id} href={`/magazine/${a.slug}`} className={styles.guide}>
                  <span className={styles.guideNo}>{String(rowBase + i + 1).padStart(2, "0")}</span>
                  <span className={styles.guideText}>
                    <span className={styles.guideCorner}>{cornerOf(a.corner).name}{a.field ? <span> · {a.field}</span> : null}</span>
                    <span className={styles.guideTitle}>{a.title}</span>
                  </span>
                  <span className={styles.guideThumb}>
                    {a.image?.url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={a.image.url} alt="" width={96} height={72} loading="lazy" decoding="async" />
                    )}
                  </span>
                </Link>
              ))}
            </div>
          )}
          {totalPages > 1 && (
            <nav className="rn-pager" aria-label="가이드 페이지">
              {page > 1 ? <a href={href(1)} aria-label="처음">«</a> : <span className="off">«</span>}
              {page > 1 ? <a href={href(page - 1)}>‹ 이전</a> : <span className="off">‹ 이전</span>}
              {nums.map((p) => (p === page ? <span key={p} className="cur" aria-current="page">{p}</span> : <a key={p} href={href(p)}>{p}</a>))}
              {page < totalPages ? <a href={href(page + 1)}>다음 ›</a> : <span className="off">다음 ›</span>}
              {page < totalPages ? <a href={href(totalPages)} aria-label="마지막">»</a> : <span className="off">»</span>}
            </nav>
          )}
        </section>

        {/* 6. 생활백과 새 항목 */}
        {!corner && page === 1 && (
          <section id="wiki" className="rn-sec" aria-labelledby="wiki-title">
            <div className="rn-sec-head">
              <div className="rn-sec-title">
                <span className="rn-eyebrow">WIKI</span>
                <h2 id="wiki-title">생활백과 새 항목</h2>
              </div>
              <Link href="/wiki" className={styles.wikiAll}>전체 {wikiTotal}개 →</Link>
            </div>
            <div className={styles.wikiGrid}>
              {wikiPicks.map((w) => (
                <Link key={w.slug} href={`/wiki/${w.slug}`} className={styles.wikiCard}>
                  <span className={styles.wikiTag}>{WIKI_TYPE_LABEL[w.type]}</span>
                  <span className={styles.wikiTitle}>{w.title}</span>
                  <span className={styles.wikiSub}>{w.summary[0]}</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* 7. 이슈별 큐레이션 리포트 */}
        {reports.length > 0 && (
          <section className={styles.reports} aria-labelledby="report-title">
            <div className={styles.reportsHead}>
              <h2 id="report-title">이슈별 큐레이션 리포트</h2>
              <span>REPORT · 각 5편 묶음</span>
            </div>
            <div className={styles.reportRow}>
              {reports.map((r) => (
                <Link key={r.slug} href={`/magazine/report/${r.slug}`} className={styles.report}>
                  <span className={styles.reportCover}>
                    {REPORT_COVER_SLUGS.includes(r.slug) && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={`/renewal/report-${r.slug}.jpg`} alt="" width={900} height={1200} loading="lazy" decoding="async" />
                    )}
                  </span>
                  <span className={styles.reportText}>
                    <span className={styles.reportCat}>{r.topic.split(" ")[0]} · 5편</span>
                    <span className={styles.reportTitle}>{r.title}</span>
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>

      <MediaFooter variant="home" />
    </div>
  );
}

export const metadata = {
  title: "오늘의딜 · 사기 전에, 고치기 전에 찾아보는 생활 정보",
  description: "고르는 법·비교·팩트체크부터 수면·영양제·뷰티 성분 근거, 고장 셀프체크, 세일 일정까지. 오늘의딜은 고려해야 할 기준과 숫자를 출처와 함께 정리해 드립니다.",
  alternates: { canonical: SITE },
};
