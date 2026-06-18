import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import DealGrid from "@/components/DealGrid";
import VideoEmbed from "@/components/VideoEmbed";
import { fetchCuratedBySlug } from "@/lib/data/curated";
import { fetchUnifiedDeals, tierOf } from "@/lib/data/deals";
import type { CuratedDeal } from "@/lib/types";
import styles from "./page.module.css";

// 추천딜은 영상·콘텐츠가 핵심 + 하단 실시간 딜이 신선해야 함 → 항상 최신 렌더.
export const dynamic = "force-dynamic";

const SITE = "https://todaydeals.co.kr";

function fmt(n: number) {
  return n.toLocaleString("ko-KR");
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const deal = await fetchCuratedBySlug(slug);
  if (!deal) return { title: "추천딜 — 오늘의딜" };

  const price = `${fmt(deal.salePrice)}원`;
  const disc = deal.discountRate ? `${deal.discountRate}% 할인 ` : "";
  const title = `${deal.productName} ${disc}${price} | 오늘의딜 추천`;
  const desc =
    (deal.adminNote ? deal.adminNote + " " : "") +
    `${deal.category} 추천딜 · ${disc}${price}. 오늘의딜이 직접 고른 ${deal.category} 핫딜을 영상과 함께 확인하세요.`;

  return {
    title,
    description: desc,
    alternates: { canonical: `${SITE}/recommended/${slug}` },
    openGraph: {
      title,
      description: desc,
      url: `${SITE}/recommended/${slug}`,
      type: "article",
      ...(deal.imageUrl ? { images: [{ url: deal.imageUrl }] } : {}),
    },
  };
}

function buildLd(deal: CuratedDeal, slug: string) {
  const product = {
    "@type": "Product",
    name: deal.productName,
    ...(deal.imageUrl ? { image: deal.imageUrl } : {}),
    ...(deal.adminNote ? { description: deal.adminNote } : {}),
    category: deal.category,
    offers: {
      "@type": "Offer",
      price: deal.salePrice,
      priceCurrency: "KRW",
      availability: "https://schema.org/InStock",
      url: deal.affiliateUrl,
    },
  };
  const breadcrumb = {
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "오늘의딜", item: SITE },
      { "@type": "ListItem", position: 2, name: "추천딜", item: `${SITE}/recommended` },
      { "@type": "ListItem", position: 3, name: deal.productName, item: `${SITE}/recommended/${slug}` },
    ],
  };
  return { "@context": "https://schema.org", "@graph": [product, breadcrumb] };
}

export default async function RecommendedDeal({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const deal = await fetchCuratedBySlug(slug);
  if (!deal) notFound();

  // 하단 "지금 진행 중인 실시간 특가" — 신선도 + 내부링크
  const live = await fetchUnifiedDeals();
  const liveTop = live.filter((d) => tierOf(d) === 1).slice(0, 8);

  const ld = buildLd(deal, slug);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <Header />
      <main className="wrap">
        <nav className={styles.breadcrumb} aria-label="breadcrumb">
          <Link href="/">오늘의딜</Link>
          <i className="ti ti-chevron-right" />
          <Link href="/recommended">추천딜</Link>
          <i className="ti ti-chevron-right" />
          <span>{deal.category}</span>
        </nav>

        <article className={styles.article}>
          <div className={styles.media}>
            {deal.videoUrl ? (
              <VideoEmbed url={deal.videoUrl} />
            ) : deal.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img className={styles.image} src={deal.imageUrl} alt={deal.productName} />
            ) : (
              <div className={styles.imgPlaceholder}>
                <i className="ti ti-photo" />
              </div>
            )}
          </div>

          <div className={styles.info}>
            <span className={styles.cat}>{deal.category} 추천</span>
            <h1 className={styles.title}>{deal.productName}</h1>

            <div className={styles.priceRow}>
              {typeof deal.discountRate === "number" && deal.discountRate > 0 && (
                <span className={styles.discount}>{deal.discountRate}%</span>
              )}
              <span className={styles.price}>{fmt(deal.salePrice)}</span>
              <span className={styles.won}>원</span>
            </div>

            {deal.adminNote && (
              <p className={styles.note}>
                <i className="ti ti-quote" />
                {deal.adminNote}
              </p>
            )}

            <a
              className={styles.cta}
              href={deal.affiliateUrl}
              target="_blank"
              rel="noopener noreferrer sponsored"
            >
              쿠팡에서 최저가로 보기 <i className="ti ti-external-link" />
            </a>
            <p className={styles.disclosure}>
              본 콘텐츠는 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받을 수 있습니다.
            </p>
          </div>
        </article>

        <section className={styles.liveSection}>
          <h2 className={styles.liveTitle}>
            <i className={`ti ti-flame ${styles.liveIcon}`} />
            지금 진행 중인 실시간 특가
          </h2>
          <p className={styles.liveSub}>추천딜 보는 김에, 마감 임박 타임딜도 챙겨가세요</p>
          {liveTop.length > 0 ? (
            <DealGrid deals={liveTop} />
          ) : (
            <p className={styles.empty}>현재 표시할 실시간 딜이 없어요.</p>
          )}
          <Link href="/recommended" className={styles.backLink}>
            <i className="ti ti-arrow-left" /> 다른 추천딜 더 보기
          </Link>
        </section>
      </main>
      <Footer />
    </>
  );
}
