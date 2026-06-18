import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import DealGrid from "@/components/DealGrid";
import { fetchBoardBySlug, boardTypeLabel, type BoardDeal } from "@/lib/data/board";
import { fetchUnifiedDeals, tierOf } from "@/lib/data/deals";
import styles from "./post.module.css";

export const dynamic = "force-dynamic";
const SITE = "https://www.todaydeals.co.kr";

const fmt = (n?: number) => (typeof n === "number" ? n.toLocaleString("ko-KR") : "");

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const d = await fetchBoardBySlug(slug);
  if (!d) return { title: "핫딜 — 오늘의딜" };
  const price = typeof d.price === "number" ? `${fmt(d.price)}원 ` : "";
  const title = `${d.title} ${price}${d.shop ? `(${d.shop}) ` : ""}| 오늘의딜 핫딜`;
  const desc = (d.body?.slice(0, 100) || `${d.shop ?? ""} ${d.title} ${price}핫딜 제보. 오늘의딜에서 실시간 특가를 확인하세요.`).trim();
  return {
    title,
    description: desc,
    alternates: { canonical: `${SITE}/board/${slug}` },
    openGraph: {
      title: d.title,
      description: desc,
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
      {
        "@type": "Product",
        name: d.title,
        ...(d.imageUrl ? { image: d.imageUrl } : {}),
        ...(d.body ? { description: d.body } : {}),
        ...(d.shop ? { brand: { "@type": "Brand", name: d.shop } } : {}),
        ...(offers ? { offers } : {}),
      },
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

  const live = (await fetchUnifiedDeals()).filter((x) => tierOf(x) === 1).slice(0, 8);
  const href = d.affiliateUrl ?? d.sourceUrl;

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
              <img src={d.imageUrl} alt={d.title} decoding="async" fetchPriority="high" />
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

            {d.body && <p className={styles.bodyText}>{d.body}</p>}

            <a className={styles.cta} href={href} target="_blank" rel="noopener noreferrer sponsored">
              딜 보러가기 <i className="ti ti-external-link" />
            </a>
            <p className={styles.note}>
              {d.author ? `${d.author} 제보 · ` : ""}핫딜은 시간·재고에 따라 마감될 수 있어요. 최신 상태는 위 링크에서 확인하세요.
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
