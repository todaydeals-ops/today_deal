import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header";
import MediaFooter from "@/components/MediaFooter";
import { buildSearchIndex } from "@/lib/search-index";
import { rankSearch } from "@/lib/search-rank";
import { HOME_CHIPS } from "@/lib/home-content";
import styles from "./search.module.css";

// 통합 검색 결과(가이드·AS 셀프체크·생활백과) — 홈 검색창의 "찾기"·Enter 가 오는 곳. 시안에 없는 화면이라 목록 화면 패턴을 재사용한다.
// 검색 결과 페이지는 색인하지 않는다(무한한 쿼리 조합).
export const metadata: Metadata = {
  title: "검색 | 오늘의딜",
  robots: { index: false, follow: true },
  alternates: { canonical: "https://www.todaydeals.co.kr" },
};

const LIMIT = 60;

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const q = ((await searchParams).q ?? "").trim().slice(0, 80);
  const index = q ? await buildSearchIndex() : [];
  const results = q ? rankSearch(index, q, LIMIT) : [];

  return (
    <div className="rn-page">
      <Header />
      <main className="rn-wrap">
        <section className={styles.head}>
          <div className="rn-eyebrow">SEARCH</div>
          <h1 className={styles.h1}>{q ? <>“{q}” 검색 결과</> : "무엇이 고민인가요?"}</h1>
          <form action="/search" method="get" role="search" className={styles.box}>
            <span className={styles.ico} aria-hidden="true" />
            <input name="q" type="search" defaultValue={q} placeholder="예: 세탁기 에러, 마그네슘" aria-label="검색어" />
            <button type="submit">찾기</button>
          </form>
          {!q && (
            <div className={styles.chips}>
              <span className={styles.chipsLabel}>많이 찾는</span>
              {HOME_CHIPS.map((c) => <Link key={c} href={`/search?q=${encodeURIComponent(c.split(" ")[0])}`} className="rn-chip">{c}</Link>)}
            </div>
          )}
        </section>

        {q && (
          <section className={styles.results} aria-live="polite">
            <div className={styles.count}>{results.length > 0 ? `${results.length}건${results.length >= LIMIT ? " 이상" : ""}` : "결과 없음"}</div>
            {results.length === 0 ? (
              <div className={styles.empty}>
                <strong>일치하는 가이드가 없어요.</strong>
                <span>다른 단어로 찾아보시거나, 아래 분야에서 둘러보세요.</span>
                <div className={styles.emptyLinks}>
                  <Link href="/wiki" className="rn-pill">생활백과</Link>
                  <Link href="/b4as" className="rn-pill">AS 셀프체크</Link>
                  <Link href="/#guides" className="rn-pill">최신 가이드</Link>
                </div>
              </div>
            ) : (
              <ul className={styles.list}>
                {results.map((r) => (
                  <li key={r.href}>
                    <Link href={r.href} className={styles.row}>
                      <span className={styles.type}>{r.t}</span>
                      <span className={styles.title}>{r.title}</span>
                      <span className={styles.go} aria-hidden="true">→</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
      </main>
      <MediaFooter />
    </div>
  );
}
