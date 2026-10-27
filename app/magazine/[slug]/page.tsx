import type { Metadata } from "next";
import { LAB_HOME, labHref, type SubKey } from "@/lib/magazine/subdomain";
import { b4asCategoryOf } from "@/lib/magazine/b4asCategories";
import { canonicalArticleUrl } from "@/lib/magazine/owner";
import Link from "next/link";
import { seoTitleOf } from "@/lib/magazine/seoTitle";
import { notFound } from "next/navigation";
import { fetchMagazineBySlug, fetchRelatedMagazine } from "@/lib/data/magazine";
import { cornerOf } from "@/lib/magazine/corners";
import Header from "@/components/Header";
import { sleepCategoryOf } from "@/lib/magazine/sleepCategories";
import MediaFooter from "@/components/MediaFooter";
import ReadingProgress from "@/components/ReadingProgress";
import { pillCategoryOf } from "@/lib/magazine/pillCategories";
import { beautyCategoryOf } from "@/lib/magazine/beautyCategories";
import { parseArticleBody, splitSentences, type TocItem } from "@/lib/magazine/articleBody";
import ChecklistProvider from "@/components/article/ChecklistProvider";
import ChecklistGroup from "@/components/article/ChecklistGroup";
import ChecklistProgress from "@/components/article/ChecklistProgress";
import DecisionTree from "@/components/article/DecisionTree";
import ArticleFeedback from "@/components/article/ArticleFeedback";
import MobileArticleBar from "@/components/article/MobileArticleBar";
import WikiBacklinksBox from "@/components/article/WikiBacklinksBox";
import styles from "./article.module.css";
import { thumbUrl } from "@/lib/magazine/thumb";

export const revalidate = 3600; // 1시간 캐시 — 매거진 아티클은 실시간 불필요

// ★generateStaticParams 가 없으면 위 revalidate 가 죽는다(2026-08-18 실측).
// 빌드가 이 라우트를 ƒ(요청마다 렌더)로 잡아, 아티클 481편이 전부
// Cache-Control: no-store · X-Vercel-Cache: MISS 로 나가고 있었다. 같은 revalidate 를
// 쓰는 /magazine/report/[slug] 는 generateStaticParams 가 있어 HIT 로 떨어진다
// (실측 TTFB 0.24s vs 아티클 0.64~0.84s).
//
// 빈 배열을 돌려주는 이유: 빌드 때 481편을 미리 렌더하면 배포마다 그만큼 느려지는데,
// 어차피 매일 새 글이 나와서 빌드 시점 목록은 금방 낡는다. dynamicParams 기본값(true)이라
// 첫 요청에서 렌더되고 그 뒤로는 1시간 캐시된다 — 빌드 부담 없이 캐시만 살린다.
export function generateStaticParams(): { slug: string }[] {
  return [];
}

const SITE = "https://www.todaydeals.co.kr";
const fmtDate = (iso: string) => iso.slice(0, 10).replace(/-/g, ".");
// 확인 배지용 MM.DD — 별도 "마지막 확인일" 필드가 없어 createdAt(작성 시점에 출처를 확인해 쓴다)을 확인일로 쓴다.
const fmtMD = (iso: string) => iso.slice(5, 10).replace(/-/g, ".");
// 같은 사이트 안 절대 주소(labHref 가 만든 것)는 상대 경로로 — <Link> 가 클라이언트 이동을 한다
const rel = (u: string) => (u.startsWith(SITE) ? u.slice(SITE.length) || "/" : u);
const hostOf = (u: string) => {
  try {
    return new URL(u).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const a = await fetchMagazineBySlug(slug);
  if (!a) return { title: "오늘의딜" };
  // ★2026-10-21 개편: 연구소 5곳을 오늘의딜 분야로 흡수 — 검색결과·공유 표기는 전부 "오늘의딜" 하나다.
  //   (예전엔 글마다 잠자리연구소·알약연구소·AS연구소 브랜드를 붙였다.) 분야 이름은 설명 대체문에만 쓴다.
  const brand = "오늘의딜";
  const section =
    a.field === "수면·침구" ? "수면"
    : a.field === "건강기능식품" ? "영양제"
    : a.field === "뷰티·성분" ? "뷰티 성분"
    : a.corner === "repair" ? "AS 셀프체크"
    : "사기 전에 보는 가이드";
  const desc = (a.excerpt || a.subtitle || `${a.title} — 오늘의딜 ${section}.`).slice(0, 155);
  return {
    // 검색결과 제목은 검색어형(lib/magazine/seoTitle.ts), 화면 H1 은 DB title 그대로
    title: `${seoTitleOf(slug, a.title)} | ${brand}`,
    description: desc,
    ...(a.tags?.length ? { keywords: a.tags } : {}),
    // canonical 은 주인 브랜드 호스트로 — 같은 글이 5개 호스트에서 열리던 중복을 정본 하나로 모은다.
    alternates: { canonical: canonicalArticleUrl(slug) },
    openGraph: { title: seoTitleOf(slug, a.title), description: desc, url: `${SITE}/magazine/${slug}`, type: "article", siteName: brand, images: [...(a.image?.url ? [{ url: a.image.url, alt: a.title }] : []), { url: `${SITE}/magazine/opengraph-image`, width: 1200, height: 630, alt: brand }] },
  };
}

export default async function MagazineArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const a = await fetchMagazineBySlug(slug);
  if (!a) notFound();
  const c = cornerOf(a.corner);
  const isSleep = a.field === "수면·침구"; // 잠자리연구소 소속 글 → 잠자리연구소 정체성으로 렌더
  const isPill = a.field === "건강기능식품"; // 알약연구소 소속 글
  const isBeauty = a.field === "뷰티·성분";
  const isB4as = a.corner === "repair"; // ★AS연구소만 field가 아니라 corner로 판별한다
  const isSub = isSleep || isPill || isBeauty || isB4as; // 서브 미디어 공통 처리(헤더·푸터·배지·관련글). 방송 협찬은 10-26 폐지
  const sleepCat = isSleep ? sleepCategoryOf(a.slug) : undefined; // 잠자리연구소 고유 6분류
  const pillCat = isPill ? pillCategoryOf(a.slug) : undefined; // 알약연구소 고유 6분류
  const beautyCat = isBeauty ? beautyCategoryOf(a.slug) : undefined; // 성분연구소 고유 6분류
  const b4asCat = isB4as ? b4asCategoryOf(a.slug) : undefined; // AS연구소 고유 9분류(제품유형)
  const subCat = sleepCat ?? pillCat ?? beautyCat ?? b4asCat;
  const subKey: SubKey = isPill ? "pill" : isBeauty ? "beauty" : isB4as ? "b4as" : "sleep";
  const subHome = LAB_HOME[subKey];
  const subHomeAbs = subHome;
  // 분야 이름(10-21 개편 — 옛 연구소 이름 대신). 화면 빵부스러기·구조화 데이터의 2단계로 쓴다.
  const subName = isPill ? "영양제" : isBeauty ? "뷰티 성분" : isB4as ? "AS 셀프체크" : "수면";
  // 구조화 데이터 발행처는 전부 오늘의딜(10-21 개편). 분야는 빵부스러기 2단계로 들어간다.
  const brandName = "오늘의딜";
  const brandUrl = SITE;
  const sectionName = isSub ? (subCat?.label ?? (isPill ? "영양" : isB4as ? "셀프체크" : "수면")) : c.name;
  const related = await fetchRelatedMagazine(a, 4);

  // 대표 이미지(images[0])는 헤드 오른쪽에 크게 쓰므로, 본문 사이에는 나머지 이미지를 끼운다(같은 사진이 두 번 나오지 않게).
  // 위치·장수 규칙은 기존과 같다(소제목 사이 · 본문 2,500자+ 면 2장).
  const parsed = parseArticleBody(a.bodyHtml, { checklist: isB4as, figures: (a.images ?? []).slice(1), figureAlt: a.title });
  const hasCheck = isB4as && parsed.checkTotal > 0 && !!parsed.firstCheckId;

  // 함께 보면 좋은 가이드 — 목록 조회는 가볍게(본문 제외) 받으므로 썸네일은 보여 줄 3편만 따로 읽는다.
  // 라이선스 표기가 필요한 이미지(Openverse CC)는 카드(전체가 링크)에 표기를 실을 수 없어 쓰지 않는다 → 빈 박스.
  const relatedShown = related.slice(0, 3);
  const relatedFull = await Promise.all(relatedShown.map((r) => fetchMagazineBySlug(r.slug)));
  const thumbOf = (i: number) => {
    const im = relatedFull[i]?.image;
    return im && !/^openverse/i.test(im.source ?? "") ? thumbUrl(im.url, 520) : undefined;
  };

  const ld = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: a.title,
    ...(a.subtitle ? { alternativeHeadline: a.subtitle } : {}),
    ...(a.excerpt ? { description: a.excerpt } : {}),
    ...(a.image?.url ? { image: [a.image.url] } : {}),
    datePublished: a.createdAt,
    dateModified: a.createdAt,
    author: { "@type": "Organization", name: `${brandName} 편집국` },
    publisher: { "@type": "Organization", name: brandName, url: brandUrl },
    mainEntityOfPage: `${SITE}/magazine/${slug}`,
    articleSection: sectionName,
    inLanguage: "ko-KR",
    keywords: [...(a.tags ?? []), a.field, sectionName, a.title].filter(Boolean).join(", "),
    ...(a.tags?.length ? { about: a.tags.slice(0, 12).map((t) => ({ "@type": "Thing", name: t })) } : {}),
    isAccessibleForFree: true,
    ...(related.length ? { relatedLink: related.map((r) => `${SITE}/magazine/${r.slug}`) } : {}),
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    // 오늘의딜 › (분야 › 분류 | 코너) › 글 — 분야 글은 4단, 일반 매거진 글은 3단
    itemListElement: (isSub
      ? [
          { name: brandName, item: brandUrl },
          { name: subName, item: subHomeAbs },
          ...(subCat ? [{ name: subCat.label, item: labHref(subKey, subCat.key) }] : []),
          { name: a.title, item: `${SITE}/magazine/${slug}` },
        ]
      : [
          { name: brandName, item: brandUrl },
          { name: sectionName, item: `${SITE}/?corner=${a.corner}` },
          { name: a.title, item: `${SITE}/magazine/${slug}` },
        ]
    ).map((x, i) => ({ "@type": "ListItem", position: i + 1, ...x })),
  };

  // FAQPage — AI 이해 목적(리치결과 아님). 화면의 FAQ 섹션과 값이 동일해야 함.
  const faqLd = a.faq && a.faq.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: a.faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  } : null;

  // ── 화면 데이터 ──
  const lead = a.subtitle || a.excerpt;
  const hasSummary = !!a.summary && a.summary.length > 0;
  const hasFaq = !!a.faq && a.faq.length > 0;
  const hasSources = !!a.sources && a.sources.length > 0;
  const heroImg = a.image;
  // 매거진 상세 시안(코너 배지 헤드 + 코너 소개 카드)은 AS 셀프체크를 뺀 모든 글의 기본 템플릿이다.
  // AS 셀프체크(corner==="repair")는 같은 템플릿의 변형(빵부스러기 헤드 + 셀프체크 진행 카드).
  const isMagazine = !isB4as;
  // 분야 글(잠자리·영양제·뷰티 성분)은 코너 배지 옆 분류 칸이 분야 홈·분류 페이지로 가는 링크다(예전 빵부스러기의 안쪽 링크를 잃지 않으려고).
  const categoryEl = isSub ? (
    <Link href={rel(labHref(subKey, subCat?.key))}>
      {subName}
      {subCat ? ` · ${subCat.label}` : ""}
    </Link>
  ) : a.field ? (
    <span>{a.field}</span>
  ) : null;
  const closingParas = a.closing ? splitSentences(a.closing) : [];
  // 검색 태그 (브랜드·모델명·에러코드 — 롱테일 유입). 시안에서는 FAQ 바로 아래에 붙는다.
  const tagsEl =
    a.tags && a.tags.length > 0 ? (
      <div className={styles.tags}>
        {a.tags.map((t) => (
          <span key={t} className={styles.tag}>#{t}</span>
        ))}
      </div>
    ) : null;
  const srcHasTag = hasSources && a.sources!.some((s) => /^\[(공식|후기)\]/.test(s.label));
  const creditOf = (im: { credit?: string; source?: string }) => [im.credit, im.source].filter(Boolean).join(" · ");
  // 캡션은 표기가 의무인 CC 라이선스(Openverse)에만 단다. 우리가 만든 AI 이미지와 Pexels 는 표기 의무가 없어 캡션을 달지 않는다(사장님 지시 2026-10-28).
  const noCreditNeeded = (im: { credit?: string; source?: string }) => !/openverse/i.test(im.source ?? "");
  const creditLabel = (im: { credit?: string; source?: string }) => `사진 ${creditOf(im)}`;

  // 목차: 먼저 결론(00) · 본문 소제목(01…) · 나머지 블록(·)
  const toc: TocItem[] = [
    ...(hasSummary ? [{ id: "summary", no: "00", label: "먼저 결론" }] : []),
    ...parsed.toc,
    ...(a.callout ? [{ id: "callout", no: "·", label: "짚고 가요" }] : []),
    ...(a.closing ? [{ id: "closing", no: "·", label: "정직한 마무리" }] : []),
    ...(hasFaq ? [{ id: "faq", no: "·", label: "자주 묻는 질문" }] : []),
    ...(hasSources ? [{ id: "sources", no: "·", label: "출처와 확인" }] : []),
  ];

  const crumb1 = isSub
    ? <Link href={rel(subHome)}>{subName}</Link>
    : <Link href={`/?corner=${a.corner}`}>{c.name}</Link>;
  const crumb2 = isSub
    ? <Link href={rel(labHref(subKey, subCat?.key))}>{subCat?.label ?? sectionName}</Link>
    : a.field ? <span>{a.field}</span> : null;

  let ckFirstSeen = false;
  const bodyArea = (
    <>
      <div className={styles.body}>
        <article className={`${styles.article} ${isMagazine ? styles.artMag : ""}`}>
          {/* 먼저 결론 — 핵심 요약(GEO: AI 가 본문 첫머리에서 즉답 발췌) */}
          {hasSummary && (
            <section id="summary" aria-label="먼저 결론" className={`${styles.conclusion} ${styles.anchor}`}>
              <span className={styles.conclusionLabel}>먼저 결론</span>
              <ol className={styles.conclusionList}>
                {a.summary!.map((s, i) => (
                  <li key={i}>
                    <span className={styles.conclusionNo}>{i + 1}</span>
                    <span dangerouslySetInnerHTML={{ __html: s }} />
                  </li>
                ))}
              </ol>
            </section>
          )}

          {/* 본문 — 구조를 알아본 덩어리(표·단계 목록)는 시안 모양으로, 셀프체크 단계는 체크리스트로 */}
          {parsed.segments.map((seg, i) => {
            if (seg.kind === "html") return <div key={i} className={styles.prose} dangerouslySetInnerHTML={{ __html: seg.html }} />;
            if (seg.kind === "tree") return <DecisionTree key={i} tree={seg.tree} />;
            const first = !ckFirstSeen;
            ckFirstSeen = true;
            return <ChecklistGroup key={i} start={seg.start} items={seg.items} anchorId={seg.anchorId} first={first} />;
          })}

          {/* 짚고 가요 — 문장 2개씩 문단 분리로 가독성 확보 */}
          {a.callout && (
            <section id="callout" aria-label="짚고 가요" className={`${styles.callout} ${styles.anchor}`}>
              <span className={styles.calloutIco} aria-hidden="true">!</span>
              <div className={styles.calloutBody}>
                <span className={styles.calloutTitle}>짚고 가요</span>
                {splitSentences(a.callout).map((p, i) => (
                  <p key={i} dangerouslySetInnerHTML={{ __html: p }} />
                ))}
              </div>
            </section>
          )}

          {/* 정직한 마무리 — 통짜 문단이 답답해 보이지 않게 문장 2개씩 */}
          {a.closing && (
            <section id="closing" aria-label="정직한 마무리" className={`${styles.closing} ${styles.anchor}`}>
              <span className={styles.closingLabel}>정직한 마무리</span>
              {/* 첫 문단이 20px/600 리드, 나머지는 본문 크기 */}
              {closingParas.map((p, i) => (
                <p key={i} className={i === 0 ? styles.closingLead : undefined} dangerouslySetInnerHTML={{ __html: p }} />
              ))}
            </section>
          )}

          {/* 자주 묻는 질문 — 접히는 목록. 접혀 있어도 마크업은 DOM 에 있다(GEO: FAQPage LD 와 값 동일) */}
          {hasFaq && (
            <section id="faq" aria-label="자주 묻는 질문" className={`${styles.faq} ${styles.anchor}`}>
              <h2 className={styles.secTitle}>자주 묻는 질문</h2>
              {/* 시안처럼 하나만 열린다(같은 name 의 details 는 브라우저가 하나만 열어 둔다). 첫 질문은 펼쳐 둔다 */}
              <div className={styles.faqList}>
                {a.faq!.map((f, i) => (
                  <details key={i} name="faq" open={i === 0} className={styles.faqItem}>
                    <summary>{f.q}</summary>
                    <p className={styles.faqA}>{f.a}</p>
                  </details>
                ))}
              </div>
              {tagsEl}
            </section>
          )}
          {/* FAQ 가 없는 글만 태그를 따로 둔다 */}
          {!hasFaq && tagsEl}

          {/* 생활백과 역링크 — 이 글을 근거로 쓴 항목으로 */}
          <WikiBacklinksBox slug={a.slug} />

          {/* 출처와 확인 */}
          {hasSources && (
            <section id="sources" aria-label="출처와 확인" className={`${styles.src} ${styles.anchor}`}>
              <div className={styles.srcHead}>
                <h2 className={styles.secTitle}>출처와 확인</h2>
                <span className={styles.srcDate}>{isB4as ? "마지막 확인" : "확인"} {fmtDate(a.createdAt)}</span>
              </div>
              {isB4as && (
                <p className={styles.srcLead}>모델·연식에 따라 버튼 위치와 조작 방법이 다릅니다. 내 제품의 정확한 절차와 사진은 아래 공식 안내에서 확인하세요.</p>
              )}
              <ol className={`${styles.srcList} ${srcHasTag ? styles.srcWithTag : ""}`}>
                {a.sources!.map((s, i) => {
                  // 라벨 앞의 [공식]/[후기] 표기는 작은 태그로 — 공식 자료와 사용자 자료를 구분해 보여 준다
                  const m = s.label.match(/^\[(공식|후기)\]\s*/);
                  const host = hostOf(s.url);
                  return (
                    <li key={i}>
                      <a href={s.url} target="_blank" rel="noopener noreferrer">
                        <span className={styles.srcNo}>[{i + 1}]</span>
                        {srcHasTag && (m ? <span className={`${styles.srcTag} ${m[1] === "후기" ? styles.srcTagAlt : ""}`}>{m[1]}</span> : <span />)}
                        <span>
                          {m ? s.label.slice(m[0].length) : s.label}
                          {host && <span className={styles.srcHost}> · {host}</span>}
                        </span>
                      </a>
                    </li>
                  );
                })}
              </ol>
              <p className={styles.srcNote}>
                오늘의딜은 제품 판매나 제휴 수수료와 무관하게 작성합니다. 잘못된 내용은 <a href="mailto:hello@todaydeals.co.kr">hello@todaydeals.co.kr</a>로 알려주세요.
              </p>
            </section>
          )}

          <ArticleFeedback slug={a.slug} />
        </article>

        {/* 사이드바: 목차 카드 + (체크리스트가 있는 글만) 진행 카드. 모바일에서는 숨기고 하단 CTA 가 대신한다 */}
        <aside className={styles.aside} aria-label={isMagazine ? "목차와 코너 소개" : "목차와 진행"}>
          <nav className={styles.tocCard} aria-label="이 글의 순서">
            <span className={styles.tocTitle}>이 글의 순서</span>
            {toc.map((t) => (
              <a key={t.id} href={`#${t.id}`} className={styles.tocLink}>
                <span className={styles.tocNo}>{t.no}</span>
                <span>{t.label}</span>
              </a>
            ))}
          </nav>
          {hasCheck && <ChecklistProgress anchorId={parsed.firstCheckId!} />}
          {/* 코너 소개 카드 — 문구는 코너 정의(lib/magazine/corners.tsx)의 한 줄 약속 그대로 */}
          {isMagazine && (
            <div className={styles.cornerCard}>
              <span className={styles.cornerLabel}>{c.name} 코너</span>
              <span className={styles.cornerDesc}>{c.desc}</span>
              <Link href={`/?corner=${a.corner}`} className={styles.cornerLink}>{c.name} 전체 →</Link>
            </div>
          )}
        </aside>
      </div>

      {toc.length > 0 && <MobileArticleBar toc={toc} firstCheckId={hasCheck ? parsed.firstCheckId : null} />}
    </>
  );

  return (
    <div className="rn-page">
      <Header />
      <ReadingProgress />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      {faqLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />}

      <main className={`rn-wrap ${styles.root}`}>
        {/* ── ① 아티클 헤드: 좌 틴트 박스 + 우 대표 이미지 ── */}
        <section className={`${styles.head} ${isMagazine ? styles.headMag : ""}`} aria-label="아티클 머리">
          <div className={styles.headText}>
            {isMagazine ? (
              // 매거진 상세 시안: 코너 배지(--ink 바탕 흰 글씨) + 분류
              <div className={styles.badgeRow}>
                <Link href={`/?corner=${a.corner}`} className={styles.cornerBadge}>{c.name}</Link>
                {categoryEl && <span className={styles.category}>{categoryEl}</span>}
              </div>
            ) : (
              <nav className={styles.crumbs} aria-label="현재 위치">
                <Link href="/">홈</Link>
                <span aria-hidden="true">›</span>
                {crumb1}
                {crumb2 && <span aria-hidden="true">›</span>}
                {crumb2}
              </nav>
            )}
            <h1 className={styles.title}>{a.title}</h1>
            {lead && <p className={styles.lead}>{lead}</p>}
            <div className={styles.meta}>
              <span>편집국</span>
              <span>{fmtDate(a.createdAt)}</span>
              {a.readMin ? <span>읽기 {a.readMin}분</span> : null}
              {hasSources && <span className={styles.badge}>출처 {a.sources!.length}건 · {fmtMD(a.createdAt)} 확인</span>}
            </div>
          </div>
          <figure className={styles.heroCell}>
            <div className={`rn-img ${styles.hero}`}>
              {heroImg?.url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={heroImg.url} alt={a.title} loading="eager" fetchPriority="high" decoding="async" />
              )}
            </div>
            {/* 스톡 사진 라이선스 표기(작가·출처·원본 링크) — 반드시 노출. 시안처럼 이미지 아래 캡션 */}
            {heroImg?.url && !noCreditNeeded(heroImg) && (creditOf(heroImg) || heroImg.link) && (
              <figcaption className={styles.heroCredit}>
                {heroImg.link ? (
                  <a href={heroImg.link} target="_blank" rel="noopener noreferrer">{creditLabel(heroImg)}</a>
                ) : (
                  <>{creditLabel(heroImg)}</>
                )}
              </figcaption>
            )}
          </figure>
        </section>

        {/* ── ② 본문 + 사이드바 ── */}
        {hasCheck ? (
          <ChecklistProvider slug={a.slug} total={parsed.checkTotal}>{bodyArea}</ChecklistProvider>
        ) : (
          bodyArea
        )}

        {/* ── ③ 함께 보면 좋은 가이드 ── */}
        {relatedShown.length > 0 && (
          <nav className={styles.related} aria-label="함께 보면 좋은 가이드">
            <h2>함께 보면 좋은 가이드</h2>
            <div className={styles.relGrid}>
              {relatedShown.map((r, i) => {
                const rc = cornerOf(r.corner);
                const thumb = thumbOf(i);
                return (
                  <Link key={r.id} href={`/magazine/${r.slug}`} className={styles.relCard}>
                    <span className={`rn-img ${styles.relImg}`} aria-hidden="true">
                      {thumb && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={thumb} alt="" loading="lazy" decoding="async" />
                      )}
                    </span>
                    <span className={styles.relCorner}>{rc.name}{r.field ? ` · ${r.field}` : ""}</span>
                    <span className={styles.relTitle}>{r.title}</span>
                  </Link>
                );
              })}
            </div>
          </nav>
        )}
      </main>

      <MediaFooter />
      {toc.length > 0 && <div className={styles.ctaSpacer} aria-hidden="true" />}
    </div>
  );
}
