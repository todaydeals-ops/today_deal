import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Banner from "@/components/Banner";
import BoardSubmit from "@/components/BoardSubmit";
import VoteButton from "@/components/VoteButton";
import { fetchBoardDeals, BOARD_CATEGORIES, BOARD_TYPES, isBoardType, boardTypeLabel, nickFor } from "@/lib/data/board";
import styles from "./board.module.css";

export const dynamic = "force-dynamic";
const SITE = "https://www.todaydeals.co.kr";

const META: Record<string, { title: string; desc: string }> = {
  hot: {
    title: "핫딜 게시판 — 핫딜·할인·무료 이벤트·나눔 모음",
    desc: "실시간으로 올라오는 핫딜·할인·쿠폰·무료 이벤트·나눔 정보를 한곳에. 알짜만 골라 빠르게 전해드려요.",
  },
  event: {
    title: "이벤트/쿠폰/적립 — 공짜·사은품·체험단·할인쿠폰 모음",
    desc: "공짜·사은품·체험단·경품 이벤트부터 할인쿠폰·적립·프로모코드까지 한곳에. 무료로 챙기는 알짜 정보.",
  },
};

export async function generateMetadata({ searchParams }: { searchParams: Promise<{ type?: string; category?: string }> }): Promise<Metadata> {
  const sp = await searchParams;
  const type = isBoardType(sp.type) ? sp.type : "hot";
  const cat = type === "hot" && sp.category && BOARD_CATEGORIES.includes(sp.category as never) ? sp.category : undefined;
  const m = META[type];
  let title = `${m.title} | 오늘의딜`;
  let desc = m.desc;
  let canon = type === "hot" ? `${SITE}/board` : `${SITE}/board?type=${type}`;
  if (cat) {
    // 카테고리 페이지를 고유 색인 자산으로 — "○○ 핫딜" 키워드 타겟
    title = `${cat} 핫딜·특가 모음 | 오늘의딜`;
    desc = `${cat} 카테고리 실시간 핫딜·특가. 지마켓·쿠팡 등 여러 쇼핑몰의 ${cat} 상품 할인을 한곳에 모았어요.`;
    canon = `${SITE}/board?category=${encodeURIComponent(cat)}`;
  }
  return {
    title,
    description: desc,
    alternates: { canonical: canon },
    openGraph: { title, description: desc, url: canon, type: "website", images: [{ url: `${SITE}/opengraph-image`, width: 1200, height: 630 }] },
  };
}

const fmt = (n?: number) => (typeof n === "number" ? n.toLocaleString("ko-KR") : "");
function ago(iso?: string): string {
  if (!iso) return "";
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return "방금";
  if (m < 60) return `${m}분 전`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}시간 전`;
  return `${Math.floor(h / 24)}일 전`;
}

export default async function Board({ searchParams }: { searchParams: Promise<{ type?: string; category?: string }> }) {
  const sp = await searchParams;
  const type = isBoardType(sp.type) ? sp.type : "hot";
  const cat = sp.category && BOARD_CATEGORIES.includes(sp.category as never) ? sp.category : "전체";
  const deals = await fetchBoardDeals(60, { type, category: cat === "전체" ? undefined : cat });
  const m = META[type];
  const qs = (t: string, c?: string) => {
    const p = new URLSearchParams();
    if (t !== "hot") p.set("type", t);
    if (c && c !== "전체") p.set("category", c);
    const s = p.toString();
    return s ? `/board?${s}` : "/board";
  };

  const itemListLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: m.title,
    itemListElement: deals.filter((d) => d.slug).map((d, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${SITE}/board/${d.slug}`,
      name: d.title,
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListLd) }} />
      <Header />
      <main className="wrap">
        <Banner variant="board" boardType={type} />

        <div className={styles.head}>
          <h1 className={styles.title}>
            <i className={`ti ti-flame ${styles.titleIcon}`} /> {m.title.split(" — ")[0]}
          </h1>
          <p className={styles.sub}>{m.desc}</p>
        </div>

        {/* 보드 4종 탭 */}
        <div className={styles.tabs}>
          {BOARD_TYPES.map((t) => (
            <Link key={t.key} href={qs(t.key)} className={`${styles.tab} ${type === t.key ? styles.tabOn : ""}`}>
              {t.label}
            </Link>
          ))}
        </div>

        {/* 카테고리 필터 — 상품 카테고리는 핫딜 탭에서만(직구·이벤트·쿠폰엔 부적합) */}
        {type === "hot" && (
          <div className={styles.chips}>
            <Link href={qs(type)} className={`${styles.chip} ${cat === "전체" ? styles.chipOn : ""}`}>
              전체
            </Link>
            {BOARD_CATEGORIES.map((c) => (
              <Link key={c} href={qs(type, c)} className={`${styles.chip} ${cat === c ? styles.chipOn : ""}`}>
                {c}
              </Link>
            ))}
          </div>
        )}

        <BoardSubmit defaultType={type} />

        {deals.length === 0 ? (
          <p className={styles.empty}>아직 {boardTypeLabel(type)} 글이 없어요. 곧 채워집니다!</p>
        ) : (
          <ul className={styles.list}>
            {deals.map((d) => (
              <li key={d.id}>
                <Link href={`/board/${d.slug}`} className={styles.row}>
                  <span className={styles.thumb}>
                    {d.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={d.imageUrl} alt="" loading="lazy" decoding="async" referrerPolicy="no-referrer" />
                    ) : (
                      <i className="ti ti-photo" />
                    )}
                  </span>
                  <span className={styles.body}>
                    <span className={styles.rowTitle}>{d.title}</span>
                    <span className={styles.meta}>
                      {d.category && <em className={styles.cat}>{d.category}</em>}
                      {d.shop && <span>{d.shop}</span>}
                      {typeof d.price === "number" && d.price > 0 && <strong className={styles.price}>{fmt(d.price)}원</strong>}
                      {d.shipping && <span className={styles.ship}>· 배송 {d.shipping}</span>}
                    </span>
                    <span className={styles.sub2}>
                      <span>{d.author || nickFor(d.slug || d.id)}</span>
                      <span>{ago(d.createdAt)}</span>
                      {d.slug && <VoteButton slug={d.slug} votes={d.votes} size="sm" />}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
      <Footer />
    </>
  );
}
