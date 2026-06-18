import Link from "next/link";
import type { Deal } from "@/lib/types";
import { BADGE_META } from "@/lib/types";
import { dealSlug } from "@/lib/slug";
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
  const { productName, imageUrl, discountRate, salePrice, isSoldout, dealEndAt, affiliateUrl, productUrl, badge, platform } = deal;
  const href = affiliateUrl ?? productUrl;
  const meta = badge ? BADGE_META[badge] : null;
  const isGoldbox = badge === "coupang_goldbox";
  const slug = dealSlug(platform, productUrl); // 개별 딜 페이지(내부 링크)

  const inner = (
    <>
      <div className={styles.imgWrap}>
        {meta && (
          <span className={styles.badge} style={{ background: meta.color }} title={meta.label}>
            {meta.short}
          </span>
        )}
        <div className={styles.img}>
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imageUrl} alt={productName} loading="lazy" decoding="async" />
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
    </>
  );

  return (
    <article className={`${styles.card} ${isSoldout ? styles.soldout : ""}`}>
      {slug ? (
        <Link href={`/deal/${slug}`} className={styles.link}>
          {inner}
        </Link>
      ) : (
        <a href={href} target="_blank" rel="noopener noreferrer sponsored" className={styles.link}>
          {inner}
        </a>
      )}
      <CompareButton productName={productName} isSoldout={isSoldout} />
    </article>
  );
}
