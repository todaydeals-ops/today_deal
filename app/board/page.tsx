import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { fetchBoardDeals, BOARD_CATEGORIES } from "@/lib/data/board";
import styles from "./board.module.css";

export const dynamic = "force-dynamic";
const SITE = "https://www.todaydeals.co.kr";

export const metadata: Metadata = {
  title: "핫딜 제보 게시판 — 오늘의딜",
  description:
    "에디터가 직접 발굴한 실시간 핫딜·특가 제보. 네이버·지마켓·쿠팡 등 여러 쇼핑몰의 알짜 딜을 카테고리별로 모았어요.",
  keywords: ["핫딜", "핫딜 게시판", "특가 제보", "오늘의 핫딜", "딜 모음", "직구 핫딜"],
  alternates: { canonical: `${SITE}/board` },
  openGraph: { title: "핫딜 제보 게시판 — 오늘의딜", description: "에디터가 발굴한 실시간 핫딜·특가 제보 모음.", url: `${SITE}/board`, type: "website" },
};

const fmt = (n?: number) => (typeof n === "number" ? n.toLocaleString("ko-KR") : "");
function ago(iso?: string): string {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "방금";
  if (m < 60) return `${m}분 전`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}시간 전`;
  return `${Math.floor(h / 24)}일 전`;
}

export default async function Board({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  const sp = await searchParams;
  const cat = sp.category && BOARD_CATEGORIES.includes(sp.category as never) ? sp.category : "전체";
  const deals = await fetchBoardDeals(60, cat === "전체" ? undefined : cat);

  const ld = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "오늘의딜 핫딜 제보 게시판",
    numberOfItems: deals.length,
    itemListElement: deals.slice(0, 40).map((d, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${SITE}/board/${d.slug}`,
      name: d.title,
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <Header />
      <main className="wrap">
        <div className={styles.head}>
          <h1 className={styles.title}>
            <i className={`ti ti-flame ${styles.titleIcon}`} /> 핫딜 제보 게시판
          </h1>
          <p className={styles.sub}>에디터가 직접 발굴한 실시간 핫딜·특가 — 여러 쇼핑몰의 알짜 딜을 모았어요.</p>
        </div>

        <div className={styles.chips}>
          <Link href="/board" className={`${styles.chip} ${cat === "전체" ? styles.chipOn : ""}`}>
            전체
          </Link>
          {BOARD_CATEGORIES.map((c) => (
            <Link key={c} href={`/board?category=${encodeURIComponent(c)}`} className={`${styles.chip} ${cat === c ? styles.chipOn : ""}`}>
              {c}
            </Link>
          ))}
        </div>

        {deals.length === 0 ? (
          <p className={styles.empty}>아직 등록된 제보딜이 없어요. 곧 채워집니다!</p>
        ) : (
          <ul className={styles.list}>
            {deals.map((d) => (
              <li key={d.id}>
                <Link href={`/board/${d.slug}`} className={styles.row}>
                  <span className={styles.thumb}>
                    {d.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={d.imageUrl} alt="" loading="lazy" decoding="async" />
                    ) : (
                      <i className="ti ti-photo" />
                    )}
                  </span>
                  <span className={styles.body}>
                    <span className={styles.rowTitle}>{d.title}</span>
                    <span className={styles.meta}>
                      {d.category && <em className={styles.cat}>{d.category}</em>}
                      {d.shop && <span>{d.shop}</span>}
                      {typeof d.price === "number" && <strong className={styles.price}>{fmt(d.price)}원</strong>}
                      {d.shipping && <span className={styles.ship}>· 배송 {d.shipping}</span>}
                    </span>
                    <span className={styles.sub2}>
                      {d.author && <span>{d.author}</span>}
                      <span>{ago(d.createdAt)}</span>
                      {d.votes > 0 && (
                        <span className={styles.votes}>
                          <i className="ti ti-thumb-up" /> {d.votes}
                        </span>
                      )}
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
