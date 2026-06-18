import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BoardSubmit from "@/components/BoardSubmit";
import { fetchBoardDeals, BOARD_CATEGORIES, BOARD_TYPES, isBoardType, boardTypeLabel, nickFor, voteBase, viewingNow } from "@/lib/data/board";
import styles from "./board.module.css";

export const dynamic = "force-dynamic";
const SITE = "https://www.todaydeals.co.kr";

const META: Record<string, { title: string; desc: string }> = {
  hot: {
    title: "핫딜 게시판 — 실시간 상품 특가·할인 모음",
    desc: "에디터·유저가 발굴한 실시간 핫딜. 지마켓·쿠팡·네이버 등 여러 쇼핑몰 특가를 카테고리별로 모았어요.",
  },
  overseas: {
    title: "해외직구 핫딜 — 알리·아마존·아이허브 직구 특가",
    desc: "알리익스프레스·아마존·아이허브 등 해외직구 핫딜·쿠폰을 모았어요. 배송기간까지 확인하세요.",
  },
  free: {
    title: "무료/이벤트 — 공짜·사은품·체험단 모음",
    desc: "공짜·사은품·체험단·경품 이벤트를 모았어요. 무료로 받는 알짜 정보.",
  },
  coupon: {
    title: "쿠폰/적립 — 할인쿠폰·프로모코드 모음",
    desc: "쇼핑몰 할인쿠폰·적립·프로모션 코드를 모았어요. 결제 전 꼭 챙기세요.",
  },
};

export async function generateMetadata({ searchParams }: { searchParams: Promise<{ type?: string }> }): Promise<Metadata> {
  const sp = await searchParams;
  const type = isBoardType(sp.type) ? sp.type : "hot";
  const m = META[type];
  const canon = type === "hot" ? `${SITE}/board` : `${SITE}/board?type=${type}`;
  return {
    title: `${m.title} | 오늘의딜`,
    description: m.desc,
    alternates: { canonical: canon },
    openGraph: { title: `${m.title} | 오늘의딜`, description: m.desc, url: canon, type: "website" },
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

  return (
    <>
      <Header />
      <main className="wrap">
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

        {/* 카테고리 필터 */}
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
                      {typeof d.price === "number" && d.price > 0 && <strong className={styles.price}>{fmt(d.price)}원</strong>}
                      {d.shipping && <span className={styles.ship}>· 배송 {d.shipping}</span>}
                    </span>
                    <span className={styles.sub2}>
                      <span>{d.author || nickFor(d.slug || d.id)}</span>
                      <span>{ago(d.createdAt)}</span>
                      <span className={styles.votes}>
                        <i className="ti ti-thumb-up" /> {d.votes + voteBase(d.slug || d.id)}
                      </span>
                      <span className={styles.viewing}>
                        <span className={styles.liveDot} /> {viewingNow(d.createdAt)}명 보는중
                      </span>
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
