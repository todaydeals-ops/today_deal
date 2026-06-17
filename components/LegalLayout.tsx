import Link from "next/link";
import Footer from "./Footer";
import styles from "./LegalLayout.module.css";

// 약관·방침·문의 등 정적 문서 페이지 공통 레이아웃.
export default function LegalLayout({
  title,
  updated,
  children,
}: {
  title: string;
  updated?: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <header className={styles.bar}>
        <div className="wrap">
          <Link href="/" className={styles.logo}>
            <span className={styles.logoBadge}>
              <i className="ti ti-clock-hour-4" />
            </span>
            오늘의딜<span className={styles.dot}>.</span>
          </Link>
        </div>
      </header>

      <main className={styles.page}>
        <div className="wrap">
          <h1 className={styles.title}>{title}</h1>
          {updated && <p className={styles.updated}>시행일 {updated}</p>}
          <div className={styles.body}>{children}</div>
          <Link href="/" className={styles.back}>
            <i className="ti ti-arrow-left" /> 홈으로
          </Link>
        </div>
      </main>

      <Footer />
    </>
  );
}
