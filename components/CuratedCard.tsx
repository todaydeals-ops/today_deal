import type { CuratedDeal } from "@/lib/types";
import styles from "./CuratedCard.module.css";

interface CuratedCardProps {
  deal: CuratedDeal;
}

function formatPrice(n: number) {
  return n.toLocaleString("ko-KR");
}

// 추천딜 카드 — 쿠팡 큐레이션. 전환이 핵심이라 한줄평(adminNote)을 노출.
export default function CuratedCard({ deal }: CuratedCardProps) {
  const { seq, productName, category, imageUrl, discountRate, salePrice, adminNote, affiliateUrl } = deal;

  return (
    <a
      className={styles.card}
      href={affiliateUrl}
      target="_blank"
      rel="noopener noreferrer sponsored"
    >
      <div className={styles.imgWrap}>
        <div className={styles.img}>
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imageUrl} alt={productName} />
          ) : (
            <i className="ti ti-photo" />
          )}
        </div>
        <span className={styles.seq}>{seq}</span>
        <span className={styles.cat}>{category}</span>
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
        쿠팡에서 보기<i className="ti ti-chevron-right" />
      </span>
    </a>
  );
}
