import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import DealGrid from "@/components/DealGrid";
import { fetchBoardBySlug, boardTypeLabel, bumpBoardView, nickFor, type BoardDeal } from "@/lib/data/board";
import VoteButton from "@/components/VoteButton";
import { fetchUnifiedDeals, tierOf } from "@/lib/data/deals";
import styles from "./post.module.css";

// 2026-09-15 — 게시판은 /api/board/submit 으로 실시간 제보가 들어와 딜보다 짧게 캐시한다.
// force-dynamic(무캐시)이 Supabase egress 한도 초과로 사이트 전체를 막은 사고의 원인이었다.
export const revalidate = 120;
const SITE = "https://www.todaydeals.co.kr";

const fmt = (n?: number) => (typeof n === "number" ? n.toLocaleString("ko-KR") : "");

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const d = await fetchBoardBySlug(slug);
  if (!d) return { title: "핫딜 — 오늘의딜" };
  const price = typeof d.price === "number" ? `${fmt(d.price)}원` : "";
  const shopTag = d.shop ? `${d.shop} ` : "";
  // SEO: "상품명 가격원 특가 | 쇼핑몰 핫딜 — 오늘의딜" 형태로 롱테일 키워드 확보
  const title = price
    ? `${d.title} ${price} 특가 | ${shopTag}핫딜 — 오늘의딜`
    : `${d.title} | ${shopTag}핫딜 — 오늘의딜`;
  // description: 본문 앞부분 + 가격 정보 (검색결과 스니펫 최적화)
  const bodySnippet = d.body?.replace(/\s+/g, " ").slice(0, 110) || "";
  const desc = bodySnippet
    ? `${bodySnippet}${price ? ` — ${price} 특가` : ""}`
    : `${shopTag}${d.title}${price ? ` ${price}` : ""} 핫딜 제보. 오늘의딜에서 실시간 최저가를 확인하세요.`;
  return {
    title,
    description: desc.slice(0, 155),
    alternates: { canonical: `${SITE}/board/${slug}` },
    // ★2026-10-17 noindex(사장님 승인). 게시물 4,914건의 본문 중앙값이 27자(공백 제외)라
    // 사이트 전체가 얇은 페이지로 평가받는 주범이었다(서치콘솔 "발견됨-색인 안 됨" 1,178,
    // 네이버 색인 0건). 페이지는 지우지 않는다 — 내부 링크·숨은 태그는 그대로, 색인 요청만 거둔다.
    // follow 는 살려 게시물 속 링크로 크롤러가 계속 이동하게 둔다. 목록(/board)은 색인 유지.
    robots: { index: false, follow: true },
    openGraph: {
      title: price ? `${d.title} ${price} 특가` : d.title,
      description: desc.slice(0, 155),
      url: `${SITE}/board/${slug}`,
      type: "article",
      ...(d.imageUrl ? { images: [{ url: d.imageUrl }] } : {}),
    },
  };
}

function buildLd(d: BoardDeal, slug: string) {
  const offers =
    typeof d.price === "number"
      ? {
          "@type": "Offer",
          price: d.price,
          priceCurrency: "KRW",
          availability: "https://schema.org/InStock",
          url: d.affiliateUrl ?? d.sourceUrl,
        }
      : undefined;
  return {
    "@context": "https://schema.org",
    "@graph": [
      // image는 판매자 목록 필수 항목 — 이미지가 없으면 Product 자체를 싣지 않는다(경고 방지)
      ...(d.imageUrl
        ? [{
            "@type": "Product",
            name: d.title,
            image: d.imageUrl,
            ...(d.body ? { description: d.body } : {}),
            ...(d.shop ? { brand: { "@type": "Brand", name: d.shop } } : {}),
            ...(offers ? { offers } : {}),
          }]
        : []),
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "오늘의딜", item: SITE },
          { "@type": "ListItem", position: 2, name: "핫딜 게시판", item: `${SITE}/board` },
          { "@type": "ListItem", position: 3, name: d.title, item: `${SITE}/board/${slug}` },
        ],
      },
    ],
  };
}

export default async function BoardPost({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const d = await fetchBoardBySlug(slug);
  if (!d) notFound();

  await bumpBoardView(slug); // 조회수 +1
  const live = (await fetchUnifiedDeals()).filter((x) => tierOf(x) === 1).slice(0, 8);
  const href = d.affiliateUrl ?? d.sourceUrl;
  const author = d.author || nickFor(d.slug || d.id);
  const views = (d.views ?? 0) + 1;

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(buildLd(d, slug)) }} />
      <Header />
      <main className="wrap">
        <nav className={styles.crumb}>
          <Link href="/">오늘의딜</Link> <span>›</span>{" "}
          <Link href={d.boardType === "hot" ? "/board" : `/board?type=${d.boardType}`}>{boardTypeLabel(d.boardType)} 게시판</Link>
          {d.category && (
            <>
              {" "}
              <span>›</span>{" "}
              <Link href={`/board?${d.boardType !== "hot" ? `type=${d.boardType}&` : ""}category=${encodeURIComponent(d.category)}`}>
                {d.category}
              </Link>
            </>
          )}
        </nav>

        <article className={styles.post}>
          <div className={styles.media}>
            {d.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={d.imageUrl} alt={d.title} decoding="async" fetchPriority="high" referrerPolicy="no-referrer" />
            ) : (
              <div className={styles.noImg}>
                <i className="ti ti-photo" />
              </div>
            )}
          </div>

          <div className={styles.info}>
            {d.category && <span className={styles.cat}>{d.category}</span>}
            <h1 className={styles.title}>{d.title}</h1>

            <div className={styles.metaRow}>
              {d.shop && <span className={styles.shop}>{d.shop}</span>}
              {typeof d.price === "number" && <span className={styles.price}>{fmt(d.price)}원</span>}
              {d.shipping && <span className={styles.ship}>배송 {d.shipping}</span>}
            </div>

            <div className={styles.stats}>
              <span className={styles.statAuthor}>{author}</span>
              <span>
                <i className="ti ti-eye" /> {views.toLocaleString("ko-KR")}
              </span>
              <VoteButton slug={slug} votes={d.votes} />
            </div>

            {d.body && <p className={styles.bodyText}>{d.body}</p>}

            <a className={styles.cta} href={href} target="_blank" rel="noopener noreferrer sponsored">
              딜 보러가기 <i className="ti ti-external-link" />
            </a>
            <p className={styles.note}>
              {author} 제보 · 핫딜은 시간·재고에 따라 마감될 수 있어요. 최신 상태는 위 링크에서 확인하세요.
            </p>
          </div>
        </article>

        <section className={styles.liveSection}>
          <h2 className={styles.liveTitle}>
            <i className={`ti ti-flame ${styles.liveIcon}`} /> 지금 진행 중인 실시간 특가
          </h2>
          {live.length > 0 ? <DealGrid deals={live} /> : <p className={styles.empty}>표시할 딜이 없어요.</p>}
          <Link href="/board" className={styles.backLink}>
            <i className="ti ti-arrow-left" /> 핫딜 게시판 더 보기
          </Link>
        </section>
      </main>
      <Footer />
    </>
  );
}
