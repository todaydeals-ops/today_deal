import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header";
import MediaFooter from "@/components/MediaFooter";
import AsTabsScroll from "@/components/as/AsTabsScroll";
import { fetchMagazineList } from "@/lib/data/magazine";
import { B4AS_CATEGORIES, b4asCategoryByKey, b4asCategoryOf } from "@/lib/magazine/b4asCategories";
import { B4AS_SYMPTOMS, b4asFacetsOf, b4asMatchesQuery, b4asProductChips, b4asQueryTerms, type B4asSymptom } from "@/lib/magazine/b4asFacets";
import { b4asHref } from "@/lib/magazine/subdomain";
import s from "./as-list.module.css";

// AS 셀프체크 목록 - 2026-10-27 리뉴얼(시안: 오늘의딜 AS 목록, 모바일 M4).
// AS는 주제가 아니라 상황이라 field가 아니라 corner="repair"로 격리한다(분류는 lib/magazine/b4asCategories.ts).
//
// ★필터(제품·증상·검색·정렬)는 전부 URL 쿼리(?cat=&product=&symptom=&q=&sort=&page=)와 <a> 링크다. 서버가 그린다.
//   클라이언트 상태가 없어서 크롤·공유·뒤로가기가 그대로 된다. 검색창은 <form method="get">.
// ★이 페이지는 예전부터 searchParams 를 읽어 동적 렌더라 revalidate 는 사실상 안 먹는다(lib/data/cache.ts 주석).
//   DB 왕복은 fetchMagazineList 의 데이터 캐시(10분)가 줄인다.
export const revalidate = 3600;

const PER = 12;
const MAIL = "hello@todaydeals.co.kr";

type SearchParams = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

function parse(sp: SearchParams) {
  const cat = b4asCategoryByKey(one(sp.cat));
  const rawProduct = one(sp.product).trim();
  const rawSymptom = one(sp.symptom).trim();
  const q = one(sp.q).trim().slice(0, 60);
  const rawSort = one(sp.sort).trim();
  // 제품은 고른 분류의 칩에 있는 것만, 증상은 정해진 5개만 받는다(그 밖의 값은 무시).
  const product = cat && b4asProductChips(cat.key).includes(rawProduct) ? rawProduct : undefined;
  const symptom = (B4AS_SYMPTOMS as readonly string[]).includes(rawSymptom) ? (rawSymptom as B4asSymptom) : undefined;
  const sort: "latest" | "short" = rawSort === "short" ? "short" : "latest";
  // 값이 틀려도 필터 쿼리가 붙은 주소는 전부 색인하지 않는다(중복 색인 방지).
  const filtered = Boolean(rawProduct || rawSymptom || q || rawSort);
  const page = Math.max(1, Math.floor(Number(one(sp.page))) || 1);
  return { cat, product, symptom, q, sort, filtered, page };
}

// 분류 페이지의 <title>은 라벨이 아니라 seoTitle을 쓴다(SEO 목적 분리, 사장님 승인).
// 필터가 붙은 주소는 robots noindex,follow + canonical 은 필터 없는 분류 주소.
export async function generateMetadata({ searchParams }: { searchParams: Promise<SearchParams> }): Promise<Metadata> {
  const { cat, filtered } = parse(await searchParams);
  const robots = filtered ? { index: false, follow: true } : undefined;
  if (!cat) {
    return {
      alternates: { canonical: b4asHref() },
      title: "AS 셀프체크 — 기사님 부르기 전 5분 점검 | 오늘의딜",
      description: "고장 같아 보이는 증상의 상당수는 설정·연결·청소로 끝납니다. 기기별 증상별로 무엇을 먼저 확인하고 어디까지 직접 해도 되는지 정리합니다.",
      robots,
    };
  }
  return {
    alternates: { canonical: b4asHref(cat.key) },
    title: `${cat.seoTitle} | AS 셀프체크 · 오늘의딜`,
    description: `${cat.angle} 증상별로 무엇을 먼저 확인하고, 어디까지 직접 해도 되는지, 언제 기사님을 불러야 하는지 순서대로 정리했습니다.`,
    robots,
  };
}

interface Nav { cat?: string; product?: string; symptom?: string; q?: string; sort?: "short"; page?: number }
// 필터 없는 분류·페이지 주소는 b4asHref 규칙 그대로(크롤 경로 보존). 필터가 붙으면 같은 순서의 쿼리로 만든다.
function listHref(n: Nav): string {
  if (!n.product && !n.symptom && !n.q && !n.sort) return b4asHref(n.cat, n.page);
  const p = new URLSearchParams();
  if (n.cat) p.set("cat", n.cat);
  if (n.product) p.set("product", n.product);
  if (n.symptom) p.set("symptom", n.symptom);
  if (n.q) p.set("q", n.q);
  if (n.sort) p.set("sort", n.sort);
  if (n.page && n.page > 1) p.set("page", String(n.page));
  return `/b4as?${p.toString()}`;
}

// 본문 이미지(Pexels 940x650)를 카드(260x160, 모바일 88x88)에 맞는 크기로 줄여 쓴다(83KB → 34KB).
// Pexels 주소가 아니거나 w/h 파라미터가 없으면 원본 그대로.
function thumbSrc(url: string): string {
  try {
    const u = new URL(url);
    if (u.hostname !== "images.pexels.com" || !u.searchParams.has("w") || !u.searchParams.has("h")) return url;
    u.searchParams.set("w", "520");
    u.searchParams.set("h", "340");
    return u.toString();
  } catch {
    return url;
  }
}

const md = (iso: string) => iso.slice(5, 10).replace("-", ".");

function HelpBox({ className }: { className: string }) {
  // 사이트 안에 AS 접수처 안내 화면이 없어서 링크는 만들지 않는다(없는 주소를 지어내지 않는다).
  return (
    <div className={`${s.help} ${className}`}>
      <strong>셀프체크로 안 될 땐</strong>
      <span>제조사 고객센터·보증기간부터 확인하세요. 모델명과 증상을 메모해 두면 접수가 빨라요.</span>
    </div>
  );
}

export default async function B4asHome({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const { cat, product, symptom, q, sort, page: reqPage } = parse(await searchParams);
  const sortParam = sort === "short" ? ("short" as const) : undefined;

  // 분류·제품·증상·검색은 전부 메모리에서 거른다. 재료는 light 목록(본문 제외, 150행 약 64KB, 10분 캐시)이다.
  // ★131행 3.6MB 를 매 요청 받던 사고가 있었다. light 가 아니면 이 목록을 부르지 않는다.
  const all = await fetchMagazineList({ corner: "repair", limit: 1000, light: true });
  const rows = all.map((a) => {
    const c = b4asCategoryOf(a.slug);
    return { a, c, f: b4asFacetsOf(c?.key, a) };
  });
  const inCat = cat ? rows.filter((r) => r.c?.key === cat.key) : rows;
  // 제품 칩은 지금 분류에 글이 한 편이라도 있는 것만(시안 항목 + 글이 2편 이상인 제품). 글이 없는 칩은 눌러도 빈 화면이라 숨긴다.
  const chips = cat ? b4asProductChips(cat.key).filter((p) => inCat.some((r) => r.f.product === p)) : [];
  const terms = b4asQueryTerms(q);
  // 증상별 건수는 지금 고른 분류·제품·검색어 기준(시안과 같다). 증상은 글 하나가 여러 개일 수 있어 합이 전체보다 클 수 있다.
  const narrowed = inCat.filter((r) => (!product || r.f.product === product) && b4asMatchesQuery(terms, r.a, r.f, r.c?.label));
  const counts = Object.fromEntries(B4AS_SYMPTOMS.map((sy) => [sy, narrowed.filter((r) => r.f.symptoms.includes(sy)).length])) as Record<B4asSymptom, number>;
  let items = symptom ? narrowed.filter((r) => r.f.symptoms.includes(symptom)) : narrowed;
  if (sort === "short") items = [...items].sort((x, y) => (x.a.readMin ?? 999) - (y.a.readMin ?? 999)); // 같은 분(分)끼리는 최신순 유지

  const totalPages = Math.max(1, Math.ceil(items.length / PER));
  const page = Math.min(reqPage, totalPages);
  const pageRows = items.slice((page - 1) * PER, page * PER);

  // 대표 이미지는 본문 맨 앞 RAIL 주석에 들어 있어 light 목록엔 없다. 이 페이지에 보이는 12편만 한 편씩 받는다.
  // 편당 캐시라(키=슬러그) 필터 조합이 아무리 많아도 DB 에서 받는 양은 전체 글 수를 못 넘는다.
  const details = await Promise.all(pageRows.map((r) => fetchMagazineList({ corner: "repair", slugs: [r.a.slug], limit: 1 })));
  const imageOf = new Map<string, string>();
  for (const d of details) if (d[0]?.image?.url) imageOf.set(d[0].slug, d[0].image.url);

  const href = (n: Partial<Nav> = {}) => listHref({ cat: cat?.key, product, symptom, q: q || undefined, sort: sortParam, ...n });

  // 페이지 번호 윈도우(5개). 링크는 <a>(프리페치 캐시 꼬임 방지: components/magazine/Pagination.tsx 주석 참고)
  const win = 5;
  const end = Math.min(totalPages, Math.max(page + 2, win));
  const start = Math.max(1, end - win + 1);
  const nums: number[] = [];
  for (let p = start; p <= end; p++) nums.push(p);

  const mailCtx = [cat?.label, product, symptom, q && `검색어 ${q}`].filter(Boolean).join(" / ");
  const mail = `mailto:${MAIL}?subject=${encodeURIComponent(`[AS 셀프체크] 주제 요청${mailCtx ? ` (${mailCtx})` : ""}`)}`;

  return (
    <div className={`rn-page ${s.root}`}>
      <Header />

      <main className="rn-wrap">
        <section className={s.head}>
          <nav className={s.crumb} aria-label="현재 위치">
            {cat ? (
              <>
                <a href={b4asHref()}>AS 셀프체크</a>
                <span aria-hidden="true">›</span>
                <span aria-current="page">{cat.label}</span>
              </>
            ) : (
              <>
                <Link href="/">오늘의딜</Link>
                <span aria-hidden="true">›</span>
                <span aria-current="page">AS 셀프체크</span>
              </>
            )}
          </nav>

          <div className={s.titleRow}>
            <div className={s.titleBox}>
              <div className={s.h1Row}>
                <a className={s.back} href={cat ? b4asHref() : "/"} aria-label={cat ? "AS 셀프체크 전체로" : "홈으로"}>‹</a>
                {/* h1은 라벨이 아니라 seoTitle: "대형가전"으로 검색하는 사람은 없다(사장님 승인) */}
                {cat ? (
                  <h1 className={s.h1}>{cat.seoTitle}</h1>
                ) : (
                  <h1 className={s.h1}>고장 같아 보이는 것의 절반은, <em>5분</em>이면 끝납니다.</h1>
                )}
              </div>
              <p className={s.desc}>
                {cat
                  ? `${cat.angle} · 기사님 부르기 전 5분 확인`
                  : "기사님을 부르기 전에 직접 확인할 수 있는 것들이 있습니다. 증상별로 순서를 정리하고, 여기까지 해봤는데 안 되면 어디에 연락하면 되는지까지 안내합니다."}
              </p>
            </div>

            <form className={s.search} action="/b4as" method="get" role="search">
              {cat && <input type="hidden" name="cat" value={cat.key} />}
              {product && <input type="hidden" name="product" value={product} />}
              {symptom && <input type="hidden" name="symptom" value={symptom} />}
              {sortParam && <input type="hidden" name="sort" value={sortParam} />}
              <button type="submit" className={s.searchBtn} aria-label="검색"><span className={s.mag} aria-hidden="true" /></button>
              <input type="search" name="q" defaultValue={q} placeholder="증상이나 에러코드 (예: 탈수, 4E)" aria-label="증상이나 에러코드 검색" enterKeyHint="search" maxLength={60} autoComplete="off" />
            </form>
          </div>

          {/* 분류 탭 9개 + 전체. 데스크톱은 가로 스크롤(시안), 모바일은 분류를 고르기 전에만 줄바꿈 칩으로 */}
          <AsTabsScroll className={`${s.tabs} ${cat ? s.tabsHide : ""}`} label="분류">
            <a className={s.tab} href={b4asHref()} aria-current={!cat ? "page" : undefined}>전체</a>
            {B4AS_CATEGORIES.map((c) => (
              <a key={c.key} className={s.tab} href={b4asHref(c.key)} aria-current={cat?.key === c.key ? "page" : undefined}>{c.label}</a>
            ))}
          </AsTabsScroll>
        </section>

        <div className={s.body}>
          <aside className={s.aside} aria-label="제품과 증상 필터">
            {chips.length > 0 && (
              <div className={`${s.group} ${s.groupProd}`}>
                <span className={s.groupLabel}>제품</span>
                <div className={s.pills}>
                  <a className={s.pill} href={href({ product: undefined })} aria-current={!product ? "true" : undefined}>전체</a>
                  {chips.map((p) => (
                    <a key={p} className={s.pill} href={href({ product: p })} aria-current={product === p ? "true" : undefined}>{p}</a>
                  ))}
                </div>
              </div>
            )}

            <div className={`${s.group} ${s.groupSym}`}>
              <span className={s.groupLabel}>증상</span>
              <div className={s.symList}>
                <a className={s.sym} href={href({ symptom: undefined })} aria-current={!symptom ? "true" : undefined}>
                  <span>전체</span><span className={s.cnt}>{narrowed.length}</span>
                </a>
                {B4AS_SYMPTOMS.map((sy) =>
                  counts[sy] > 0 || symptom === sy ? (
                    <a key={sy} className={s.sym} href={href({ symptom: sy })} aria-current={symptom === sy ? "true" : undefined}>
                      <span>{sy}</span><span className={s.cnt}>{counts[sy]}</span>
                    </a>
                  ) : (
                    // 건수 0 이면 눌러도 빈 화면이라 링크로 두지 않는다(시안은 0도 링크지만 막다른 길이 된다)
                    <span key={sy} className={`${s.sym} ${s.off}`} aria-disabled="true">
                      <span>{sy}</span><span className={s.cnt}>0</span>
                    </span>
                  ),
                )}
              </div>
            </div>

            <HelpBox className={s.helpD} />
          </aside>

          <section className={s.results} aria-label="셀프체크 목록">
            <div className={s.bar}>
              <span className={s.barL}>
                <span>{symptom ?? "전체 셀프체크"} <b>{items.length}건</b></span>
                {q && (
                  <a className={s.qChip} href={href({ q: undefined })} aria-label={`검색어 ${q} 지우기`}>
                    <span>{q}</span><i aria-hidden="true">×</i>
                  </a>
                )}
              </span>
              <div className={s.seg} role="group" aria-label="정렬">
                <a className={s.segBtn} href={href({ sort: undefined })} aria-current={sort === "latest" ? "true" : undefined}>최신순</a>
                <a className={s.segBtn} href={href({ sort: "short" })} aria-current={sort === "short" ? "true" : undefined}>짧은 순</a>
              </div>
            </div>

            {items.length > 0 ? (
              <>
                <div className={s.grid}>
                  {pageRows.map((r, i) => {
                    const img = imageOf.get(r.a.slug);
                    const meta = [r.a.readMin ? `읽기 ${r.a.readMin}분` : null, `${md(r.a.createdAt)} 확인`].filter(Boolean).join(" · ");
                    return (
                      <Link key={r.a.id} href={`/magazine/${r.a.slug}`} className={s.card}>
                        <span className={`rn-img ${s.thumb}`}>
                          {img && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={thumbSrc(img)} alt="" width={520} height={340} loading={i < 4 ? "eager" : "lazy"} decoding="async" />
                          )}
                        </span>
                        <span className={s.info}>
                          <span className={s.tags}>
                            <span className={s.tagP}>{r.f.product ?? r.c?.label ?? "셀프체크"}</span>
                            {r.f.symptom && <span className={s.tagS}>{r.f.symptom}</span>}
                          </span>
                          <span className={s.title}>{r.a.title}</span>
                          <span className={s.meta}>{meta}</span>
                        </span>
                      </Link>
                    );
                  })}
                </div>

                {totalPages > 1 && (
                  <div className={s.pagerWrap}>
                    <nav className="rn-pager" aria-label="셀프체크 페이지">
                      {page > 1 ? <a href={href({ page: 1 })} aria-label="처음">«</a> : <span className="off">«</span>}
                      {page > 1 ? <a href={href({ page: page - 1 })} rel="prev">‹ 이전</a> : <span className="off">‹ 이전</span>}
                      {nums.map((p) => (p === page ? <span key={p} className="cur" aria-current="page">{p}</span> : <a key={p} href={href({ page: p })}>{p}</a>))}
                      {page < totalPages ? <a href={href({ page: page + 1 })} rel="next">다음 ›</a> : <span className="off">다음 ›</span>}
                      {page < totalPages ? <a href={href({ page: totalPages })} aria-label="마지막">»</a> : <span className="off">»</span>}
                    </nav>
                  </div>
                )}
              </>
            ) : (
              <div className={s.empty}>
                {inCat.length === 0 ? (
                  <>
                    <strong>이 분류의 셀프체크를 준비하고 있어요.</strong>
                    <p>곧 채워 둘게요. 원하는 주제가 있으면 알려 주세요.</p>
                  </>
                ) : (
                  <>
                    <strong>조건에 맞는 셀프체크가 아직 없어요</strong>
                    <p>필터를 줄이거나, 원하는 주제를 요청해 주세요.</p>
                  </>
                )}
                <div className={s.emptyBtns}>
                  {inCat.length > 0 && <a className={`${s.btn} ${s.btnLine}`} href={listHref({ cat: cat?.key })}>필터 초기화</a>}
                  <a className={`${s.btn} ${s.btnGreen}`} href={mail}>주제 요청하기</a>
                </div>
              </div>
            )}

            <HelpBox className={s.helpM} />
          </section>
        </div>
      </main>

      <MediaFooter />
    </div>
  );
}
