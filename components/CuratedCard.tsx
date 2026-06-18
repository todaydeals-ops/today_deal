import Link from "next/link";
import type { CuratedDeal } from "@/lib/types";
import styles from "./CuratedCard.module.css";

interface CuratedCardProps {
  deal: CuratedDeal;
}

function formatPrice(n: number) {
  return n.toLocaleString("ko-KR");
}

// 추천딜 카드 — 전환이 핵심이라 한줄평(adminNote)을 노출.
//  - slug 있으면 내부 콘텐츠 페이지(/recommended/[slug])로 (영상·SEO·CTA)
//  - 없으면 기존처럼 쿠팡 제휴링크로 바로 이동
export default function CuratedCard({ deal }: CuratedCardProps) {
  const { seq, slug, productName, category, imageUrl, discountRate, salePrice, adminNote, affiliateUrl, videoUrl } = deal;

  const inner = (
    <>
      <div className={styles.imgWrap}>
        <div className={styles.img}>
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imageUrl} alt={productName} loading="lazy" decoding="async" />
          ) : (
            <i className="ti ti-photo" />
          )}
        </div>
        <span className={styles.seq}>{seq}</span>
        <span className={styles.cat}>{category}</span>
        {videoUrl && (
          <span className={styles.play} aria-label="영상 있음">
            <i className="ti ti-player-play-filled" />
          </span>
        )}
      </div>
      <div className={styles.name}>{productName}</div>
      <div className={styles.priceRow}>
        {typeof discountRate === "number" && (
          <span className={styles.discount}>{discountRate}%</span>
        )}
        <span className={styles.price}>{formatPrice(salePrice)}</span>
        <span className={styles.won}>원</span>
      </div>
      {adminNote && (
        <p className={styles.note}>
          <i className="ti ti-quote" />
          {adminNote}
        </p>
      )}
      <span className={styles.cta}>
        {slug ? "자세히 보기" : "쿠팡에서 보기"}
        <i className="ti ti-chevron-right" />
      </span>
    </>
  );

  if (slug) {
    return (
      <Link className={styles.card} href={`/recommended/${slug}`}>
        {inner}
      </Link>
    );
  }
  return (
    <a className={styles.card} href={affiliateUrl} target="_blank" rel="noopener noreferrer sponsored">
      {inner}
    </a>
  );
}
