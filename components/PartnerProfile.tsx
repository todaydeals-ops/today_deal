import type { PartnerProfile as Profile } from "@/lib/types";
import styles from "./PartnerProfile.module.css";

interface PartnerProfileProps {
  profile: Profile;
}

// 링크인바이오식 큐레이션 파트너 헤더 (아바타·이름·태그라인·인스타)
export default function PartnerProfile({ profile }: PartnerProfileProps) {
  const { name, handle, tagline, avatarUrl, instagramUrl } = profile;

  return (
    <section className={styles.profile}>
      <div className={styles.avatar}>
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatarUrl} alt={name} />
        ) : (
          <i className="ti ti-user" />
        )}
      </div>
      <h2 className={styles.name}>{name}</h2>
      <span className={styles.handle}>{handle}</span>
      <p className={styles.tagline}>{tagline}</p>
      {instagramUrl && (
        <a
          className={styles.insta}
          href={instagramUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          <i className="ti ti-brand-instagram" />
          인스타그램
        </a>
      )}
    </section>
  );
}
