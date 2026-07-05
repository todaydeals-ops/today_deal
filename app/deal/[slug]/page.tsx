import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import DealGrid from "@/components/DealGrid";
import LiveViewers from "@/components/LiveViewers";
import { PriceVerdictDetail } from "@/components/PriceVerdict";
import { fetchArchiveBySlug, fetchUnifiedDeals, tierOf, type ArchiveDeal } from "@/lib/data/deals";
import { BADGE_META } from "@/lib/types";
import styles from "./page.module.css";

const SITE = "https://www.todaydeals.co.kr";

export const dynamic = "force-dynamic";

function fmt(n: number) {
  return n.toLocaleString("ko-KR");
}

const PLATFORM_KR: Record<string, string> = {
  gmarket: "지마켓",
  "11st": "11번가",
  coupang: "쿠팡",
  ali: "알리익스프레스",
  ohou: "오늘의집",
};
// /deals/[platform] 라우트가 실제로 존재하는 플랫폼만 (없으면 /deals로 폴백)
const PLATFORM_PAGE = new Set(["gmarket", "11st", "coupang", "ali"]);

const DEAL_FAQ = [
  {
    q: "이 특가는 언제까지 진행되나요?",
    a: "타임딜·골드박스는 한정 시간·수량 특가라 마감 시간이나 재고에 따라 종료될 수 있어요. 정확한 진행 여부는 '최저가로 보러가기' 버튼에서 확인하세요.",
  },
  {
    q: "어디서 구매하나요?",
    a: "오늘의딜은 여러 쇼핑몰의 가격·특가 정보를 모아 비교해 주는 서비스예요. 실제 구매·결제는 해당 쇼핑몰(지마켓·11번가·쿠팡 등)에서 진행됩니다.",
  },
  {
    q: "표시된 가격이 실제와 다를 수 있나요?",
    a: "네, 타임딜 특성상 시간에 따라 가격·재고가 바뀔 수 있어요. 최신 가격은 링크에서 확인하시는 걸 권장합니다.",
  },
];

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
    robots: { index: false, follow: true },
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
      {
        "@type": "FAQPage",
        mainEntity: DEAL_FAQ.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
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
          <Link href="/">오늘의딜</Link> <span>›</span>{" "}
          <Link href={PLATFORM_PAGE.has(d.platform) ? `/deals/${d.platform}` : "/deals"}>{PLATFORM_KR[d.platform] ?? "딜"}</Link>
        </nav>

        <div style={{ margin: "4px 0 14px" }}>
          <LiveViewers />
        </div>

        <article className={styles.deal}>
          <div className={styles.imgWrap}>
            {d.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={d.imageUrl} alt={d.productName} decoding="async" fetchPriority="high" />
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
            {d.priceCompare && (
              <div style={{ margin: "14px 0" }}>
                <PriceVerdictDetail pc={d.priceCompare} ourPrice={d.salePrice} />
              </div>
            )}
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

        {/* 내부링크 */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, margin: "28px 0 8px" }}>
          {[
            [PLATFORM_PAGE.has(d.platform) ? `/deals/${d.platform}` : "/deals", `${PLATFORM_KR[d.platform] ?? ""} 특가 더보기`],
            ["/deals", "전체 특가 모아보기"],
            ["/recommended", "추천딜"],
          ].map(([href, label]) => (
            <Link
              key={href}
              href={href}
              style={{
                padding: "9px 16px",
                border: "1px solid var(--border-soft)",
                borderRadius: 999,
                fontSize: 13.5,
                fontWeight: 600,
                color: "var(--text-body)",
                textDecoration: "none",
                background: "var(--bg-surface)",
              }}
            >
              {label}
            </Link>
          ))}
        </div>

        {/* 자주 묻는 질문 (FAQPage 구조화데이터와 동일) */}
        <section style={{ margin: "36px 0 8px", maxWidth: 760 }}>
          <h2 style={{ fontFamily: '"Pretendard", sans-serif', fontWeight: 800, fontSize: 18, color: "var(--text-strong)", marginBottom: 14 }}>
            자주 묻는 질문
          </h2>
          <dl style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {DEAL_FAQ.map((f) => (
              <div
                key={f.q}
                style={{ background: "var(--bg-surface)", border: "1px solid var(--border-soft)", borderRadius: 12, padding: "14px 16px" }}
              >
                <dt style={{ fontSize: 14.5, fontWeight: 700, color: "var(--text-strong)", marginBottom: 6 }}>Q. {f.q}</dt>
                <dd style={{ fontSize: 13.5, lineHeight: 1.6, color: "var(--text-body)" }}>{f.a}</dd>
              </div>
            ))}
          </dl>
        </section>
      </main>
      <Footer />
    </>
  );
}
