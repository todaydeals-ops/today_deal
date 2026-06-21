import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import DealGrid from "@/components/DealGrid";
import { fetchUnifiedDeals } from "@/lib/data/deals";
import type { Deal, Platform } from "@/lib/types";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";
const SITE = "https://www.todaydeals.co.kr";

interface PSeo {
  key: Platform;
  label: string;
  title: string;
  desc: string;
  kw: string[];
  intro: string;
}

const SEO: Record<string, PSeo> = {
  gmarket: {
    key: "gmarket",
    label: "지마켓",
    title: "지마켓 슈퍼딜·오픈런 타임딜 모음",
    desc: "지마켓 슈퍼딜(오픈런 타임딜)·쇼츠딜·앵콜딜을 실시간으로 모았습니다. 할인율·마감시간을 한눈에 비교하세요. 약 2시간마다 자동 갱신.",
    kw: ["지마켓 슈퍼딜", "지마켓 오픈런 타임딜", "지마켓 타임딜", "지마켓 쇼츠딜", "지마켓 앵콜딜", "지마켓 특가"],
    intro: "지마켓에서 지금 진행 중인 슈퍼딜·오픈런 타임딜을 한곳에 모았어요. 오픈런은 정해진 시간에 시작하는 한정 특가라 마감이 빠르니, 할인율과 남은 시간을 보고 빠르게 챙기세요.",
  },
  "11st": {
    key: "11st",
    label: "11번가",
    title: "11번가 쇼킹딜·타임딜·오늘의딜 모음",
    desc: "11번가 타임딜(오전 11시 초기화)과 오늘의딜(자정 갱신)을 실시간으로 모았습니다. 할인율·마감시간 한눈에 비교.",
    kw: ["11번가 쇼킹딜", "11번가 타임딜", "11번가 오늘의딜", "11번가 특가", "십일번가 타임딜"],
    intro: "11번가에서 진행 중인 타임딜·오늘의딜을 모았어요. 타임딜은 오전 11시, 오늘의딜은 자정에 새 상품으로 바뀌니 시간대에 맞춰 확인하면 좋아요.",
  },
  coupang: {
    key: "coupang",
    label: "쿠팡",
    title: "쿠팡 골드박스·오늘의 특가 모음",
    desc: "쿠팡 골드박스(매일 오전 갱신) 등 쿠팡 특가를 모았습니다. 일반가 대비 할인 상품을 한눈에 비교하세요.",
    kw: ["쿠팡 골드박스", "쿠팡 특가", "쿠팡 와우 할인", "쿠팡 오늘의 특가"],
    intro: "쿠팡 골드박스를 비롯한 쿠팡 특가를 모았어요. 골드박스는 매일 한정 수량으로 풀리는 특가라 빨리 마감되니, 마음에 드는 건 바로 확인하세요.",
  },
  ali: {
    key: "ali",
    label: "알리익스프레스",
    title: "알리익스프레스 타임딜·특가 모음",
    desc: "알리익스프레스 타임딜·특가를 모았습니다. 할인율·마감시간을 한눈에 비교하세요.",
    kw: ["알리익스프레스 타임딜", "알리 타임딜", "알리익스프레스 특가", "알리 할인"],
    intro: "알리익스프레스에서 진행 중인 타임딜·특가를 모았어요. 해외직구 특성상 배송 기간을 함께 확인하세요.",
  },
};

export async function generateMetadata({ params }: { params: Promise<{ platform: string }> }): Promise<Metadata> {
  const { platform } = await params;
  const s = SEO[platform];
  if (!s) return { title: "쇼핑몰별 특가 | 오늘의딜" };
  const title = `${s.title} | 오늘의딜`;
  return {
    title,
    description: s.desc,
    keywords: s.kw,
    alternates: { canonical: `${SITE}/deals/${platform}` },
    openGraph: { title, description: s.desc, url: `${SITE}/deals/${platform}`, type: "website", images: [{ url: `${SITE}/opengraph-image`, width: 1200, height: 630 }] },
  };
}

function buildLd(s: PSeo, deals: Deal[], platform: string) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "ItemList",
        name: s.title,
        description: s.desc,
        numberOfItems: deals.length,
        itemListElement: deals.slice(0, 40).map((d, i) => ({
          "@type": "ListItem",
          position: i + 1,
          item: {
            "@type": "Product",
            name: d.productName,
            ...(d.imageUrl ? { image: d.imageUrl } : {}),
            offers: {
              "@type": "Offer",
              price: d.salePrice,
              priceCurrency: "KRW",
              availability: d.isSoldout ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
              url: d.affiliateUrl ?? d.productUrl,
            },
          },
        })),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "오늘의딜", item: SITE },
          { "@type": "ListItem", position: 2, name: s.label, item: `${SITE}/deals/${platform}` },
        ],
      },
    ],
  };
}

export default async function PlatformDeals({ params }: { params: Promise<{ platform: string }> }) {
  const { platform } = await params;
  const s = SEO[platform];
  if (!s) notFound();

  const all = await fetchUnifiedDeals();
  const deals = all.filter((d) => d.platform === s.key);
  const ld = buildLd(s, deals, platform);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <Header />
      <main className="wrap">
        <nav className={styles.crumb}>
          <Link href="/">오늘의딜</Link> <span>›</span> <span>{s.label}</span>
        </nav>

        <h1 className={styles.title}>{s.title}</h1>
        <p className={styles.intro}>{s.intro}</p>

        {deals.length > 0 ? (
          <DealGrid deals={deals} />
        ) : (
          <p className={styles.empty}>지금은 진행 중인 {s.label} 특가가 없어요. 잠시 후 다시 확인해주세요.</p>
        )}

        {/* 다른 쇼핑몰 내부링크 */}
        <div className={styles.others}>
          <span className={styles.othersLabel}>다른 쇼핑몰 특가</span>
          <div className={styles.otherLinks}>
            {Object.entries(SEO)
              .filter(([k]) => k !== platform)
              .map(([k, v]) => (
                <Link key={k} href={`/deals/${k}`} className={styles.otherLink}>
                  {v.label} 특가
                </Link>
              ))}
            <Link href="/recommended" className={styles.otherLink}>
              추천딜
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
