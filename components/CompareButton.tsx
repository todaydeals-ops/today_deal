import styles from "./CompareButton.module.css";

interface CompareButtonProps {
  productName: string;
  // 품절이면 "쿠팡에서 비슷한 상품 찾기"로 전환 (기획안 4.2)
  isSoldout?: boolean;
}

// 쿠팡 키워드 검색 링크 (실제 제휴코드 삽입은 추후 서버에서 처리)
function coupangSearchUrl(keyword: string) {
  return `https://www.coupang.com/np/search?q=${encodeURIComponent(keyword)}`;
}

export default function CompareButton({
  productName,
  isSoldout = false,
}: CompareButtonProps) {
  const label = isSoldout ? "쿠팡에서 비슷한 상품 찾기" : "최저가 비교";
  const icon = isSoldout ? "ti-search" : "ti-arrows-left-right";

  return (
    <a
      className={styles.btn}
      href={coupangSearchUrl(productName)}
      target="_blank"
      rel="noopener noreferrer sponsored"
    >
      <i className={`ti ${icon}`} />
      {label}
    </a>
  );
}
