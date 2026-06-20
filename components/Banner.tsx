import type { ReactNode } from "react";
import styles from "./Banner.module.css";

interface BannerProps {
  // 이미지를 넣으면 그 이미지가 그대로 들어감. 없으면 기본 프로모 배너.
  src?: string;
  alt?: string;
  // 게시판 배너 변형 — boardType(hot|free|coupon)에 맞는 카피 노출. 없으면 타임딜 히어로.
  variant?: "board";
  boardType?: string;
}

interface PromoCopy {
  kickerIcon: string;
  kicker: string;
  title: ReactNode;
  chips: string[];
  accentIcon: string;
}

// 게시판 탭별 배너 카피
const BOARD_COPY: Record<string, PromoCopy> = {
  hot: {
    kickerIcon: "ti-flame",
    kicker: "실시간 핫딜 · 커뮤니티",
    title: (
      <>
        지금 뜬 특가,
        <br />
        제보하면 딜도 쌓여요.
      </>
    ),
    chips: ["전자/IT", "식품", "패션/뷰티", "생활/주방"],
    accentIcon: "ti-flame",
  },
  event: {
    kickerIcon: "ti-gift",
    kicker: "이벤트 · 쿠폰 · 적립",
    title: (
      <>
        공짜·사은품·체험단부터
        <br />
        할인쿠폰·적립까지.
      </>
    ),
    chips: ["무료배포", "사은품", "체험단", "할인쿠폰", "적립"],
    accentIcon: "ti-gift",
  },
};

export default function Banner({ src, alt = "프로모션", variant, boardType }: BannerProps) {
  if (src) {
    return (
      <div className={styles.banner}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} decoding="async" fetchPriority="high" />
      </div>
    );
  }

  // 게시판 배너 — 탭별 카피
  if (variant === "board") {
    const c = BOARD_COPY[boardType ?? "hot"] ?? BOARD_COPY.hot;
    return (
      <div className={`${styles.banner} ${styles.promo}`}>
        <div className={styles.left}>
          <span className={styles.kicker}>
            <i className={`ti ${c.kickerIcon}`} /> {c.kicker}
          </span>
          <h2 className={styles.title}>{c.title}</h2>
          <div className={styles.platforms}>
            {c.chips.map((chip) => (
              <span key={chip}>{chip}</span>
            ))}
          </div>
        </div>
        <div className={styles.right}>
          <i className={`ti ${c.accentIcon} ${styles.bigIcon}`} />
        </div>
      </div>
    );
  }

  // 기본 프로모 배너 (이미지 없을 때) — 메인 타임딜 히어로
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
