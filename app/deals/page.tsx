import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header";
import Banner from "@/components/Banner";
import Footer from "@/components/Footer";
import { fetchArchiveRecent } from "@/lib/data/deals";
import { BADGE_META } from "@/lib/types";
import styles from "./index.module.css";

export const dynamic = "force-dynamic";
const SITE = "https://www.todaydeals.co.kr";

export const metadata: Metadata = {
  title: "쇼핑몰 타임딜·특가 전체 모아보기 | 오늘의딜",
  description:
    "지마켓·11번가·쿠팡·알리 타임딜과 쿠팡 골드박스 특가를 한곳에 모았습니다. 최근 올라온 딜을 둘러보고 상세 정보·최저가를 확인하세요.",
  keywords: ["타임딜 모음", "특가 모음", "오늘의 특가", "핫딜 모음", "쇼핑몰 타임딜"],
  alternates: { canonical: `${SITE}/deals` },
  openGraph: {
    title: "쇼핑몰 타임딜·특가 전체 모아보기 | 오늘의딜",
    description: "지마켓·11번가·쿠팡·알리 타임딜·골드박스를 한곳에. 매일 갱신.",
    url: `${SITE}/deals`,
    type: "website",
    images: [{ url: `${SITE}/opengraph-image`, width: 1200, height: 630 }],
  },
};

const PLATFORMS: [string, string][] = [
  ["gmarket", "지마켓 슈퍼딜"],
  ["11st", "11번가 타임딜"],
  ["coupang", "쿠팡 골드박스"],
  ["ali", "알리 타임딜"],
];

const fmt = (n: number) => n.toLocaleString("ko-KR");

export default async function DealsIndex() {
  const archive = await fetchArchiveRecent(120);
  const ld = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "ItemList",
        name: "오늘의딜 전체 특가",
        numberOfItems: archive.length,
        itemListElement: archive.slice(0, 50).map((d, i) => ({
          "@type": "ListItem",
          position: i + 1,
          item: {
            "@type": "Product",
            name: d.productName,
            ...(d.imageUrl ? { image: d.imageUrl } : {}),
            offers: { "@type": "Offer", price: d.salePrice, priceCurrency: "KRW", availability: "https://schema.org/InStock", url: `${SITE}/deal/${d.slug}` },
          },
        })),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "오늘의딜", item: SITE },
          { "@type": "ListItem", position: 2, name: "전체 특가", item: `${SITE}/deals` },
        ],
      },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <Header />
      <main className="wrap">
        <nav className={styles.crumb}>
          <Link href="/">오늘의딜</Link> <span>›</span> <span>전체 특가</span>
        </nav>

        <Banner />

        <h1 className={styles.title}>쇼핑몰 타임딜·특가 전체 모아보기</h1>
        <p className={styles.intro}>
          지마켓·11번가·쿠팡·알리의 타임딜과 골드박스 특가를 한곳에 모았어요. 최근 올라온 딜부터
          둘러보고, 마음에 드는 상품은 눌러서 상세 정보와 최저가를 확인하세요.
        </p>

        <div className={styles.platforms}>
          {PLATFORMS.map(([k, label]) => (
            <Link key={k} href={`/deals/${k}`} className={styles.platformLink}>
              {label}
            </Link>
          ))}
        </div>

        {archive.length > 0 ? (
          <div className={styles.grid}>
            {archive.map((d) => {
              const meta = d.badge ? BADGE_META[d.badge] : undefined;
              return (
                <Link key={d.slug} href={`/deal/${d.slug}`} className={styles.card}>
                  <div className={styles.img}>
                    {d.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={d.imageUrl} alt={d.productName} loading="lazy" decoding="async" />
                    ) : (
                      <i className="ti ti-photo" />
                    )}
                    {meta && (
                      <span className={styles.badge} style={{ background: meta.color }}>
                        {meta.short}
                      </span>
                    )}
                  </div>
                  <span className={styles.name}>{d.productName}</span>
                  <span className={styles.priceRow}>
                    {d.discountRate > 0 && <em className={styles.discount}>{d.discountRate}%</em>}
                    <strong>{fmt(d.salePrice)}</strong>원
                  </span>
                </Link>
              );
            })}
          </div>
        ) : (
          <p className={styles.empty}>아직 모인 딜이 없어요. 잠시 후 다시 확인해주세요.</p>
        )}
      </main>
      <Footer />
    </>
  );
}
