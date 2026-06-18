import type { Deal } from "@/lib/types";
import { BADGE_META } from "@/lib/types";
import Countdown from "./Countdown";
import CompareButton from "./CompareButton";
import styles from "./DealCard.module.css";

interface DealCardProps {
  deal: Deal;
}

// 가격 천단위 콤마
function formatPrice(n: number) {
  return n.toLocaleString("ko-KR");
}

export default function DealCard({ deal }: DealCardProps) {
  const { productName, imageUrl, discountRate, salePrice, isSoldout, dealEndAt, affiliateUrl, productUrl, badge } = deal;
  const href = affiliateUrl ?? productUrl;
  const meta = badge ? BADGE_META[badge] : null;
  const isGoldbox = badge === "coupang_goldbox"; // WOW가 API 미제공 → 일반가 빗금 + 특가보기

  return (
    <article className={`${styles.card} ${isSoldout ? styles.soldout : ""}`}>
      <a href={href} target="_blank" rel="noopener noreferrer sponsored" className={styles.link}>
        <div className={styles.imgWrap}>
          {meta && (
            <span className={styles.badge} style={{ background: meta.color }} title={meta.label}>
              {meta.short}
            </span>
          )}
          <div className={styles.img}>
            {imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={imageUrl} alt={productName} />
            ) : (
              <i className="ti ti-photo" />
            )}
          </div>
          {isSoldout ? (
            <div className={styles.soldoutOverlay}>
              <span className={styles.soldoutBadge}>품절</span>
            </div>
          ) : (
            <Countdown endAt={dealEndAt} />
          )}
        </div>
        <div className={styles.name}>{productName}</div>
        <div className={styles.priceRow}>
          {isGoldbox ? (
            <>
              <s className={styles.strike}>{formatPrice(salePrice)}원</s>
              <span className={styles.goSpecial}>쿠팡 특가보기</span>
            </>
          ) : (
            <>
              {discountRate > 0 && <span className={styles.discount}>{discountRate}%</span>}
              <span className={styles.price}>{formatPrice(salePrice)}</span>
              <span className={styles.won}>원</span>
            </>
          )}
        </div>
      </a>
      <CompareButton productName={productName} isSoldout={isSoldout} />
    </article>
  );
}
