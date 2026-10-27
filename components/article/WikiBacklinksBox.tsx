import Link from "next/link";
import { allEntries } from "@/lib/wiki/load";
import styles from "@/app/magazine/[slug]/article.module.css";

// 이 아티클을 "더 깊이 읽기"로 건 생활백과 항목들 — 아티클 → 항목 역링크(크롤러가 생활백과로 들어가는 길).
// components/WikiLinks.tsx 의 WikiBacklinks 와 같은 데이터·같은 링크이고, 리뉴얼 시안(초록 톤)에 맞춰 겉모양만 다시 그렸다.
// (원본 WikiBacklinks 는 옛 주황·페이퍼 톤이라 새 화면과 어긋나서 건드리지 않고 이 화면 전용으로 둔다.)
export default function WikiBacklinksBox({ slug }: { slug: string }) {
  const hits = allEntries().filter((e) => e.related?.articles?.includes(slug));
  if (!hits.length) return null;
  return (
    <section className={styles.wiki} aria-label="생활백과 관련 항목">
      <div className={styles.boxLabel}>생활백과에서 찾아보기</div>
      <ul className={styles.wikiList}>
        {hits.map((e) => (
          <li key={e.slug}>
            <Link href={`/wiki/${e.slug}`}>
              {e.seoTitle} <span aria-hidden="true">→</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
