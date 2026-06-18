import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import DealGrid from "@/components/DealGrid";
import LiveViewers from "@/components/LiveViewers";
import { fetchArchiveBySlug, fetchUnifiedDeals, tierOf, type ArchiveDeal } from "@/lib/data/deals";
import { BADGE_META } from "@/lib/types";
import styles from "./page.module.css";

const SITE = "https://todaydeals.co.kr";

export const dynamic = "force-dynamic";

function fmt(n: number) {
  return n.toLocaleString("ko-KR");
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const d = await fetchArchiveBySlug(slug);
  if (!d) return { title: "딜을 찾을 수 없어요 | 오늘의딜" };
  const src = d.badge && BADGE_META[d.badge] ? BADGE_META[d.badge].label : "오늘의딜";
  const title = `${d.productName} ${d.discountRate ? d.discountRate + "% " : ""}${fmt(d.salePrice)}원 | 오늘의딜`;
  const desc = `${src} · ${d.productName} 할인 정보. 지마켓·쿠팡·11번가 실시간 타임딜을 오늘의딜에서 한눈에 비교하세요.`;
  return {
    title,
    description: desc,
    openGraph: {
      title: d.productName,
      description: desc,
      url: `${SITE}/deal/${slug}`,
      // 상품 이미지 있으면 썸네일로, 없으면 생략 → 브랜드 기본 OG(opengraph-image.png) 자동 적용
      ...(d.imageUrl ? { images: [d.imageUrl] } : {}),
      type: "website",
    },
    alternates: { canonical: `${SITE}/deal/${slug}` },
  };
}

function buildLd(d: ArchiveDeal, slug: string) {
  const brand = d.badge && BADGE_META[d.badge] ? BADGE_META[d.badge].label : undefined;
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Product",
        name: d.productName,
        ...(d.imageUrl ? { image: d.imageUrl } : {}),
        ...(brand ? { brand: { "@type": "Brand", name: brand } } : {}),
        offers: {
          "@type": "Offer",
          price: d.salePrice,
          priceCurrency: "KRW",
          availability: "https://schema.org/InStock",
          url: d.affiliateUrl ?? d.productUrl ?? `${SITE}/deal/${slug}`,
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "오늘의딜", item: SITE },
          { "@type": "ListItem", position: 2, name: brand ?? "딜", item: `${SITE}/deal/${slug}` },
        ],
      },
    ],
  };
}

export default async function DealPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const d = await fetchArchiveBySlug(slug);
  if (!d) notFound();

  const meta = d.badge && BADGE_META[d.badge] ? BADGE_META[d.badge] : null;
  const href = d.affiliateUrl ?? d.productUrl ?? "#";
  const isGoldbox = d.badge === "coupang_goldbox";
  const live = (await fetchUnifiedDeals()).filter((x) => tierOf(x) === 1).slice(0, 10);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(buildLd(d, slug)) }} />

      <Header />
      <main className="wrap">
        <nav className={styles.crumb}>
          <Link href="/">오늘의딜</Link> <span>›</span> <span>{meta?.label ?? "딜"}</span>
        </nav>

        <div style={{ margin: "4px 0 14px" }}>
          <LiveViewers />
        </div>

        <article className={styles.deal}>
          <div className={styles.imgWrap}>
            {d.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={d.imageUrl} alt={d.productName} />
            ) : (
              <i className="ti ti-photo" />
            )}
          </div>
          <div className={styles.info}>
            {meta && (
              <span className={styles.badge} style={{ background: meta.color }}>
                {meta.label}
              </span>
            )}
            <h1 className={styles.title}>{d.productName}</h1>
            <div className={styles.priceRow}>
              {isGoldbox ? (
                <>
                  <s className={styles.strike}>{fmt(d.salePrice)}원</s>
                  <span className={styles.goSpecial}>쿠팡 특가보기</span>
                </>
              ) : (
                <>
                  {d.discountRate > 0 && <span className={styles.discount}>{d.discountRate}%</span>}
                  <span className={styles.price}>{fmt(d.salePrice)}</span>
                  <span className={styles.won}>원</span>
                </>
              )}
            </div>
            {d.summary && <p className={styles.summary}>{d.summary}</p>}
            <a href={href} target="_blank" rel="noopener noreferrer sponsored" className={styles.cta}>
              최저가로 보러가기 <i className="ti ti-external-link" />
            </a>
            <p className={styles.note}>
              ※ 타임딜은 시간에 따라 마감·가격이 바뀔 수 있어요. 최신 상태는 위 버튼에서 확인하세요.
            </p>
          </div>
        </article>

        <h2 className={styles.liveTitle}>지금 진행 중인 실시간 특가</h2>
        <DealGrid deals={live} />
      </main>
      <Footer />
    </>
  );
}
