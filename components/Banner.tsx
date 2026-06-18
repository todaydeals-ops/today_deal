import styles from "./Banner.module.css";

interface BannerProps {
  // 이미지를 넣으면 그 이미지가 그대로 들어감. 없으면 기본 프로모 배너.
  src?: string;
  alt?: string;
}

export default function Banner({ src, alt = "프로모션" }: BannerProps) {
  if (src) {
    return (
      <div className={styles.banner}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} decoding="async" fetchPriority="high" />
      </div>
    );
  }

  // 기본 프로모 배너 (이미지 없을 때)
  return (
    <div className={`${styles.banner} ${styles.promo}`}>
      <div className={styles.left}>
        <span className={styles.kicker}>
          <i className="ti ti-bolt" /> 오늘의 타임딜 · 실시간
        </span>
        <h2 className={styles.title}>
          매일 새로운 특가,<br />
          한눈에 비교하고 알뜰하게.
        </h2>
        <div className={styles.platforms}>
          <span>지마켓</span>
          <span>11번가</span>
          <span>알리익스프레스</span>
        </div>
      </div>
      <div className={styles.right}>
        <span className={styles.pct}>
          최대 <strong>50%</strong>
          <i className="ti ti-arrow-down-right" />
        </span>
        <i className={`ti ti-clock-hour-4 ${styles.clock}`} />
      </div>
    </div>
  );
}
