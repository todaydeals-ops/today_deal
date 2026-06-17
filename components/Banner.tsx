import styles from "./Banner.module.css";

interface BannerProps {
  // 이미지를 넣으면 비율대로 꽉 차게 들어감. 없으면 placeholder.
  src?: string;
  alt?: string;
}

export default function Banner({ src, alt = "프로모션" }: BannerProps) {
  return (
    <div className={styles.banner}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt} />
      ) : (
        <>
          <i className="ti ti-photo" />
          <span>배너 영역 — 넣는 이미지가 그대로 들어갑니다</span>
        </>
      )}
    </div>
  );
}
