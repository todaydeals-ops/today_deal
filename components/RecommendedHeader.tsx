// 추천딜 페이지 헤더 — 배너 모드(기본) / 프로필 모드. 관리자 설정(settings)으로 전환.
import type { RecHeader } from "@/lib/data/settings";
import styles from "./RecommendedHeader.module.css";

export default function RecommendedHeader({ header }: { header: RecHeader }) {
  if (header.mode === "profile") {
    return (
      <section className={styles.profile}>
        <span className={styles.avatar}>
          <i className="ti ti-user" />
        </span>
        <h1 className={styles.pName}>{header.name || "오늘의딜 큐레이터"}</h1>
        {header.handle && <p className={styles.handle}>{header.handle}</p>}
        {header.tagline && <p className={styles.tagline}>{header.tagline}</p>}
        {header.instagramUrl && (
          <a className={styles.iconBtn} href={header.instagramUrl} target="_blank" rel="noopener noreferrer">
            <i className="ti ti-brand-instagram" /> 인스타그램
          </a>
        )}
      </section>
    );
  }

  // 배너 모드
  return (
    <section className={styles.banner}>
      {header.badge && <span className={styles.badge}>{header.badge}</span>}
      <h1 className={styles.title}>{header.title}</h1>
      {header.subtitle && <p className={styles.subtitle}>{header.subtitle}</p>}
      {header.ctaText && header.ctaUrl && (
        <a className={styles.cta} href={header.ctaUrl} target="_blank" rel="noopener noreferrer">
          {header.ctaText} <i className="ti ti-arrow-right" />
        </a>
      )}
    </section>
  );
}
