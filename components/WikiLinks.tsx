// 생활백과로 들어가는 사이트 안 길 — 홈 띠(WikiStrip)와 아티클 역링크(WikiBacklinks).
//
// ★왜(2026-10-20 서치콘솔 URL 검사): 생활백과 15항목이 전부 "발견됨-색인 안 됨"·"구글이 모르는 URL"이었고,
//   홈조차 마지막 크롤이 9/21 이었다. 들어오는 링크가 헤더 메뉴 하나뿐이면 크롤러는 중요도를 낮게 본다.
//   가장 자주 크롤되는 홈과, 이미 검색 유입이 있는 아티클에서 항목으로 직접 잇는다.
// 항목은 content/wiki/*.json 을 읽는다 — 이 컴포넌트를 쓰는 동적 라우트는 next.config 의
// outputFileTracingIncludes 에 content/wiki 를 실어야 런타임에도 파일이 있다.
import Link from "next/link";
import { allEntries } from "@/lib/wiki/load";
import { WIKI_TYPE_LABEL } from "@/lib/wiki/types";

const mono = "'Pretendard', -apple-system, BlinkMacSystemFont, sans-serif";
const serif = "'Noto Serif KR', serif";

export function WikiStrip({ limit = 6 }: { limit?: number }) {
  const list = allEntries().slice(0, limit);
  if (!list.length) return null;
  return (
    <section className="mz-wrap" style={{ paddingTop: 52, paddingBottom: 8 }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", borderTop: "1px solid rgba(22,20,15,0.16)", paddingTop: 16, marginBottom: 14, gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontFamily: mono, fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", color: "#fff", background: "#ff5a3c", padding: "3px 9px", borderRadius: 4 }}>생활백과</span>
          <span style={{ fontWeight: 800, fontSize: 16 }}>사기 전에, 고치기 전에 찾아보는 정본</span>
        </div>
        <Link href="/wiki" style={{ fontFamily: mono, fontSize: 12, color: "#16140f", textDecoration: "none", whiteSpace: "nowrap" }}>전체 {allEntries().length}개 →</Link>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 8 }}>
        {list.map((e) => (
          <Link key={e.slug} href={`/wiki/${e.slug}`} style={{ display: "block", padding: "12px 14px", border: "1px solid #e8e4dc", borderRadius: 8, textDecoration: "none", background: "#fafaf8", wordBreak: "keep-all" }}>
            <span style={{ display: "block", fontFamily: mono, fontSize: 11, color: "#ff5a3c", fontWeight: 700 }}>{WIKI_TYPE_LABEL[e.type]}</span>
            <span style={{ display: "block", fontFamily: serif, fontSize: 15.5, fontWeight: 700, color: "#16140f", lineHeight: 1.45, marginTop: 4 }}>{e.seoTitle}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

/** 이 아티클을 "더 깊이 읽기"로 건 생활백과 항목들 — 아티클 → 항목 역링크 */
export function WikiBacklinks({ slug }: { slug: string }) {
  const hits = allEntries().filter((e) => e.related?.articles?.includes(slug));
  if (!hits.length) return null;
  return (
    <section aria-label="생활백과 관련 항목" style={{ marginTop: 28, border: "1px solid rgba(22,20,15,0.14)", borderRadius: 14, padding: "16px 20px", background: "#fffaf7" }}>
      <div style={{ fontFamily: mono, fontSize: 11, letterSpacing: "1.5px", color: "#ff5a3c", fontWeight: 700, marginBottom: 10 }}>생활백과에서 찾아보기</div>
      <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 8 }}>
        {hits.map((e) => (
          <li key={e.slug}>
            <Link href={`/wiki/${e.slug}`} style={{ color: "#16140f", textDecoration: "none", fontWeight: 700, fontSize: 15.5, lineHeight: 1.5, wordBreak: "keep-all" }}>
              {e.seoTitle} <span style={{ color: "#ff5a3c" }}>→</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
