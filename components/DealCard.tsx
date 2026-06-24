import type { Deal } from "@/lib/types";
import Countdown from "./Countdown";
import { PriceVerdictBadge, PickBadge, priceComment, pickComment } from "./PriceVerdict";
import styles from "./DealCard.module.css";

interface DealCardProps {
  deal: Deal;
}

// 가격 천단위 콤마
function formatPrice(n: number) {
  return n.toLocaleString("ko-KR");
}

// 카드 클릭 = 바로 쇼핑몰 아웃링크(내부 상세 단계 제거 — 클릭/실적 극대화).
// 하단 "AI 가격 코멘트"가 (구)최저가비교 자리 — 상품평 아닌 가격 평가.
export default function DealCard({ deal }: DealCardProps) {
  const { id, productName, imageUrl, discountRate, salePrice, isSoldout, dealEndAt, affiliateUrl, productUrl, badge, priceCompare, pick } = deal;
  const href = affiliateUrl ?? productUrl;
  const isGoldbox = badge === "coupang_goldbox";
  const comment = pick ? pickComment(id) : priceComment(priceCompare, salePrice, id);

  return (
    <article className={`${styles.card} ${isSoldout ? styles.soldout : ""}`}>
      <a href={href} target="_blank" rel="noopener noreferrer sponsored" className={styles.link}>
        <div className={styles.imgWrap}>
          <div style={{ position: "absolute", top: 6, left: 6, zIndex: 2 }}>
            {pick ? <PickBadge size="sm" /> : <PriceVerdictBadge pc={priceCompare} ourPrice={salePrice} />}
          </div>
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
        {/* AI 가격 코멘트 — 가격에 대한 위트 있는 평가(상품평 아님). 딜마다 다양. */}
        {!isSoldout && (
          <div
            style={{
              display: "flex", alignItems: "center", gap: 6, marginTop: 9,
              padding: "8px 10px", borderRadius: 8, background: "#F6F4F0", border: "1px solid #ECE8E1",
              fontSize: 12, fontWeight: 600, color: "#5C574E", lineHeight: 1.35,
            }}
          >
            <span aria-hidden style={{ flex: "none" }}>🤖</span>
            <span>{comment}</span>
          </div>
        )}
      </a>
    </article>
  );
}
