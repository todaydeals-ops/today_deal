import Link from "next/link";
import Header from "@/components/Header";
import MediaFooter from "@/components/MediaFooter";
import { fetchMagazineList, fetchMagazineCount } from "@/lib/data/magazine";
import { fetchReportList } from "@/lib/data/magazine-report";
import { WikiStrip } from "@/components/WikiLinks";
import { isCorner, cornerOf, CATCH } from "@/lib/magazine/corners";
import { CornerIndex, NeutralBand, CornerDot, FieldPill, FeaturedImageSlot } from "@/components/magazine/Chrome";
import Pagination from "@/components/magazine/Pagination";
import "./magazine/magazine.css";

// ★2026-10-21 개편(사장님 지시): 오늘의딜은 정보성 콘텐츠(매거진·생활백과) 채널이다.
// 타임딜·추천딜·핫딜글은 폐지했고(라우트는 proxy.ts 가 410/301), 홈은 더 이상 딜을 읽지 않는다.
// 연구소 5곳도 오늘의딜 안의 분야로 흡수했다 — 홈 목록에 모든 글이 섞여 나온다(lib/data/magazine.ts).
export const revalidate = 600;

const SITE = "https://www.todaydeals.co.kr";
const mono = "'Pretendard', -apple-system, BlinkMacSystemFont, sans-serif";
const serif = "'Noto Serif KR', serif";
const fmtDate = (iso: string) => iso.slice(0, 10).replace(/-/g, ".");
const PER = 10;

export default async function Home({ searchParams }: { searchParams: Promise<{ corner?: string; page?: string }> }) {
  const sp = await searchParams;
  const corner = isCorner(sp.corner) ? sp.corner : undefined;
  const page = Math.max(1, Number(sp.page) || 1);

  const [magList, total, reports] = await Promise.all([
    fetchMagazineList({ corner, offset: (page - 1) * PER, limit: PER }),
    fetchMagazineCount(corner),
    corner ? Promise.resolve([]) : fetchReportList(6),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PER));
  const featured = page === 1 ? magList[0] : undefined;
  const rows = page === 1 ? magList.slice(1) : magList;
  const [hiPre, hiPost] = CATCH.media.tail.split(CATCH.media.hi);
  const c = corner ? cornerOf(corner) : null;

  // 정보 채널 홈 — 최신 글 목록을 모음 페이지로 알린다(예전엔 타임딜 상품 ItemList 였다)
  const ld = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        name: "오늘의딜 — 사기 전에, 고치기 전에 보는 정보",
        url: SITE,
        inLanguage: "ko-KR",
        mainEntity: {
          "@type": "ItemList",
          itemListElement: magList.map((a, i) => ({ "@type": "ListItem", position: i + 1, url: `${SITE}/magazine/${a.slug}`, name: a.title })),
        },
      },
    ],
  };

  const pageHref = (p: number) => {
    const q = new URLSearchParams();
    if (corner) q.set("corner", corner);
    if (p > 1) q.set("page", String(p));
    const s = q.toString();
    return s ? `/?${s}` : "/";
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <Header />

      <div className="mz-page">
        {/* 슬로건 + 코너 인덱스 + 리포트 — 전체보기 1페이지만 */}
        {!corner && page === 1 && (
          <>
            <section className="mz-wrap mz-slogan" style={{ paddingTop: 46, paddingBottom: 40 }}>
              <div style={{ fontFamily: mono, fontSize: 12, letterSpacing: "3px", textTransform: "uppercase", color: "#9a9286" }}>Neutral Shopping Guide</div>
              <h1 className="mz-h1" style={{ fontFamily: serif, fontWeight: 700, fontSize: "clamp(28px, 4.4vw, 44px)", lineHeight: 1.32, letterSpacing: "-1px", color: "#16140f", margin: "18px 0 0", maxWidth: 820, textWrap: "balance" }}>
                <span className="mz-h1-1">{CATCH.media.lead}</span>
                <br />
                <span className="mz-h1-2">{hiPre}<span style={{ color: "#ff5a3c" }}>{CATCH.media.hi}</span>{hiPost}</span>
              </h1>
            </section>

            <CornerIndex />

            {/* 2.0 생활백과 — 가장 자주 크롤되는 홈에서 항목으로 직접 잇는다(components/WikiLinks.tsx) */}
            <WikiStrip />

            {reports.length > 0 && (
              <section className="mz-wrap" style={{ paddingTop: 52, paddingBottom: 40 }}>
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", borderTop: "1px solid rgba(22,20,15,0.16)", paddingTop: 16, marginBottom: 14 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontFamily: mono, fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", color: "#fff", background: "#16140f", padding: "3px 9px", borderRadius: 4 }}>REPORT</span>
                    <span style={{ fontWeight: 800, fontSize: 16 }}>이슈별 큐레이션 리포트</span>
                  </div>
                  <span style={{ fontFamily: mono, fontSize: 11, letterSpacing: "1.5px", color: "#9a9286" }}>5편 묶음</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {reports.map((r) => (
                    <Link key={r.slug} href={`/magazine/report/${r.slug}`} style={{ display: "flex", alignItems: "center", gap: 14, padding: "11px 14px", border: "1px solid #e8e4dc", borderRadius: 7, textDecoration: "none", background: "#fafaf8" }}>
                      <span style={{ fontFamily: mono, fontSize: 10, color: "#9a9286", whiteSpace: "nowrap" }}>5편</span>
                      <span style={{ flex: 1, fontSize: 15, fontWeight: 700, color: "#16140f", lineHeight: 1.4, fontFamily: serif }}>{r.title}</span>
                      <span style={{ fontSize: 12, color: "#9a9286", whiteSpace: "nowrap", flexShrink: 0 }}>{r.topic}</span>
                      <span style={{ fontFamily: mono, fontSize: 14, color: "#16140f", flexShrink: 0 }}>→</span>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </>
        )}

        {/* 코너 필터 헤더 */}
        {corner && c && (
          <section className="mz-wrap" style={{ paddingTop: 36, paddingBottom: 2 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 9, fontFamily: serif, fontWeight: 700, fontSize: 24, color: "#16140f" }}>
                <span style={{ width: 11, height: 11, borderRadius: 9999, background: c.color }} />
                {c.name}
              </span>
              <span style={{ fontSize: 13.5, color: "#7a756a" }}>{c.desc}</span>
              <Link href="/" className="ul-sweep" style={{ marginLeft: "auto", fontFamily: mono, fontSize: 12, color: "#16140f", textDecoration: "none" }}>✕ 전체 보기</Link>
            </div>
          </section>
        )}

        {magList.length === 0 ? (
          <section className="mz-wrap" style={{ paddingTop: 60, paddingBottom: 80, textAlign: "center", color: "#9a9286" }}>
            <div style={{ fontFamily: serif, fontSize: 22, fontWeight: 600, color: "#46433d" }}>가이드를 준비하고 있어요.</div>
            <div style={{ fontSize: 14, marginTop: 10 }}>사기 전에 확인할 것들로 곧 채워집니다.</div>
          </section>
        ) : (
          <>
            {/* 피처드 (1페이지 대표 가이드) */}
            {featured && (
              <section className="mz-wrap" style={{ paddingTop: 44, paddingBottom: 30 }}>
                <Link href={`/magazine/${featured.slug}`} className="mz-feat">
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                      <CornerDot cornerKey={featured.corner} />
                      <FieldPill field={featured.field} />
                      <span style={{ fontFamily: mono, fontSize: 11, letterSpacing: "1px", color: "#9a9286" }}>FEATURED</span>
                    </div>
                    <h2 className="feat-title" style={{ fontFamily: serif, fontWeight: 700, fontSize: 40, letterSpacing: "-1.4px", lineHeight: 1.22, margin: "18px 0 0", color: "#16140f", textWrap: "balance" }}>{featured.title}</h2>
                    {featured.excerpt && <p style={{ fontSize: 15.5, lineHeight: 1.85, color: "#46433d", margin: "18px 0 0", maxWidth: 520 }}>{featured.excerpt}</p>}
                    <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 24, flexWrap: "wrap" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 8, fontWeight: 700, fontSize: 14, color: "#16140f", borderBottom: "2px solid #ff5a3c", paddingBottom: 3 }}>가이드 읽기 <span style={{ fontFamily: mono }}>→</span></span>
                      <span style={{ fontFamily: mono, fontSize: 12, color: "#9a9286" }}>편집국 · {fmtDate(featured.createdAt)}{featured.readMin ? ` · 읽기 ${featured.readMin}분` : ""}</span>
                    </div>
                  </div>
                  <FeaturedImageSlot cornerKey={featured.corner} image={featured.image} title={featured.title} />
                </Link>
              </section>
            )}

            {/* 최신 가이드 (페이지당 10) */}
            {rows.length > 0 && (
              <section className="mz-wrap" style={{ paddingTop: 14, paddingBottom: 24 }}>
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", borderTop: "1px solid rgba(22,20,15,0.16)", paddingTop: 16, marginBottom: 6 }}>
                  <span style={{ fontWeight: 800, fontSize: 18 }}>{corner ? c?.name : "최신 가이드"}</span>
                  <span style={{ fontFamily: mono, fontSize: 11, letterSpacing: "2px", color: "#9a9286" }}>LATEST</span>
                </div>
                {rows.map((a, i) => {
                  const cc = cornerOf(a.corner);
                  return (
                    <Link key={a.id} href={`/magazine/${a.slug}`} className="mz-row row-link">
                      <span className="mz-row-num" style={{ fontFamily: mono, fontSize: 13, fontWeight: 600, color: "#c0b8a9" }}>{String(i + 1).padStart(2, "0")}</span>
                      <span style={{ display: "flex", alignItems: "center", gap: 9 }}>
                        <span style={{ width: 8, height: 8, borderRadius: 9999, background: cc.color, flex: "none" }} />
                        <span style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                          <span style={{ fontSize: 11.5, fontWeight: 700, color: cc.color }}>{cc.name}</span>
                          {a.field && <span style={{ fontSize: 11, color: "#8a857c" }}>{a.field}</span>}
                        </span>
                      </span>
                      <span className="mz-row-title" style={{ fontFamily: serif, fontWeight: 600, fontSize: 21, letterSpacing: "-0.6px", lineHeight: 1.35, color: "#16140f" }}>{a.title}</span>
                      <span className="mz-row-go row-go" style={{ fontFamily: mono, fontSize: 16, color: "#16140f" }}>→</span>
                    </Link>
                  );
                })}
              </section>
            )}

            {/* 페이지네이션 */}
            <Pagination page={page} totalPages={totalPages} href={pageHref} />
          </>
        )}

        <NeutralBand />
      </div>

      <MediaFooter />
    </>
  );
}

export const metadata = {
  title: "오늘의딜 · 사기 전에, 고치기 전에 찾아보는 생활 정보",
  description: "고르는 법·비교·팩트체크부터 수면·영양제·뷰티 성분 근거, 고장 셀프체크, 세일 일정까지. 오늘의딜은 고려해야 할 기준과 숫자를 출처와 함께 정리해 드립니다.",
  alternates: { canonical: SITE },
};
