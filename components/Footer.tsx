import styles from "./Footer.module.css";

// 제휴 고지 (법적 의무 — 기획안 5.3 / DESIGN_SYSTEM §8). 상시 노출.
export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className="wrap">
        <div className={styles.notice}>
          이 사이트는 제휴 마케팅 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다.
          그중 쿠팡 구매는 이 사이트가 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의
          수수료를 제공받습니다.
          <br />
          오늘의딜은 통신판매중개자가 아니며, 상품 정보 및 거래에 대한 책임은 각 판매처에 있습니다.
        </div>
        <div className={styles.links}>
          <a href="#">이용약관</a>
          <a href="#">개인정보처리방침</a>
          <a href="#">제휴문의</a>
        </div>
      </div>
    </footer>
  );
}
