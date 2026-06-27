import type { Metadata } from "next";
import Link from "next/link";
import { fetchMagazineList } from "@/lib/data/magazine";
import { fetchReportList } from "@/lib/data/magazine-report";
import { isCorner, cornerOf, CATCH } from "@/lib/magazine/corners";
import { MagazineUtilBar, MagazineMasthead, CornerIndex, NeutralBand, MagazineFooter, CornerDot, FieldPill, FeaturedImageSlot } from "@/components/magazine/Chrome";

export const dynamic = "force-dynamic";
const SITE = "https://www.todaydeals.co.kr";
const mono = "'JetBrains Mono', monospace";
const serif = "'Noto Serif KR', serif";
const fmtDate = (iso: string) => iso.slice(0, 10).replace(/-/g, ".");

export const metadata: Metadata = {
  title: "오늘의딜 매거진 — 미디어는 ‘사야 할 이유’를, 우리는 ‘기준과 숫자’를",
  description: `${CATCH.media.lead} ${CATCH.media.tail}`,
  alternates: { canonical: `${SITE}/magazine` },
  openGraph: { title: "오늘의딜 매거진 — 중립 쇼핑 가이드", description: `${CATCH.media.lead} ${CATCH.media.tail}`, url: `${SITE}/magazine`, type: "website" },
};

export default async function MagazineHome({ searchParams }: { searchParams: Promise<{ corner?: string }> }) {
  const sp = await searchParams;
  const corner = isCorner(sp.corner) ? sp.corner : undefined;
  const [list, reports] = await Promise.all([
    fetchMagazineList({ corner }),
    corner ? Promise.resolve([]) : fetchReportList(6),
  ]);
  const featured = list[0];
  const rest = list.slice(1);

  const [hiPre, hiPost] = CATCH.media.tail.split(CATCH.media.hi);

  const itemListLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "오늘의딜 매거진 — 중립 쇼핑 가이드",
    description: `${CATCH.media.lead} ${CATCH.media.tail}`,
    itemListElement: list.map((a, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${SITE}/magazine/${a.slug}`,
      name: a.title,
    })),
  };

  return (
    <div className="mz-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListLd) }} />
      <MagazineUtilBar />
      <MagazineMasthead />

      {/* 슬로건 + 코너 인덱스 — '전체 보기'(필터 없음)에서만 노출 */}
      {!corner && (
        <>
          <section className="mz-wrap mz-slogan" style={{ paddingTop: 54, paddingBottom: 44 }}>
            <div style={{ fontFamily: mono, fontSize: 12, letterSpacing: "3px", textTransform: "uppercase", color: "#9a9286" }}>
              Neutral Shopping Guide — Issue 01
            </div>
            <h1 className="mz-h1">
              <span className="mz-h1-1">{CATCH.media.lead}</span>
              <span className="mz-h1-2">{hiPre}<span style={{ color: "#ff5a3c" }}>{CATCH.media.hi}</span>{hiPost}</span>
            </h1>
          </section>

          <CornerIndex />

          {/* 리포트 섹션 — 5편 묶음 큐레이션 */}
          {reports.length > 0 && (
            <section className="mz-wrap" style={{ paddingTop: 0, paddingBottom: 40 }}>
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

      {/* 코너 필터: 작은 헤더(전체 보기) — 아래 featured+리스트는 메인과 동일 */}
      {corner && (
        <section className="mz-wrap" style={{ paddingTop: 36, paddingBottom: 2 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 9, fontFamily: serif, fontWeight: 700, fontSize: 24, color: "#16140f" }}>
              <span style={{ width: 11, height: 11, borderRadius: 9999, background: cornerOf(corner).color }} />
              {cornerOf(corner).name}
            </span>
            <span style={{ fontSize: 13.5, color: "#7a756a" }}>{cornerOf(corner).desc}</span>
            <Link href="/magazine" className="ul-sweep" style={{ marginLeft: "auto", fontFamily: mono, fontSize: 12, color: "#16140f", textDecoration: "none" }}>✕ 전체 보기</Link>
          </div>
        </section>
      )}

      {list.length === 0 ? (
        <section className="mz-wrap" style={{ paddingTop: 60, paddingBottom: 80, textAlign: "center", color: "#9a9286" }}>
          <div style={{ fontFamily: serif, fontSize: 22, fontWeight: 600, color: "#46433d" }}>첫 가이드를 준비하고 있어요.</div>
          <div style={{ fontSize: 14, marginTop: 10 }}>광고·제휴 없이, 진짜 도움 되는 글로 곧 채워집니다.</div>
        </section>
      ) : (
        <>
          {/* 피처드 */}
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
                <FeaturedImageSlot cornerKey={featured.corner} />
              </Link>
            </section>
          )}

          {/* 최신 가이드 */}
          {rest.length > 0 && (
            <section className="mz-wrap" style={{ paddingTop: 14, paddingBottom: 56 }}>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", borderTop: "1px solid rgba(22,20,15,0.16)", paddingTop: 16, marginBottom: 6 }}>
                <span style={{ fontWeight: 800, fontSize: 18 }}>최신 가이드</span>
                <span style={{ fontFamily: mono, fontSize: 11, letterSpacing: "2px", color: "#9a9286" }}>LATEST</span>
              </div>
              {rest.map((a, i) => {
                const cc = cornerOf(a.corner);
                return (
                  <Link key={a.id} href={`/magazine/${a.slug}`} className="mz-row row-link">
                    <span className="mz-row-num" style={{ fontFamily: mono, fontSize: 13, fontWeight: 600, color: "#c0b8a9" }}>{String(i + 1).padStart(2, "0")}</span>
                    <span style={{ display: "flex", alignItems: "center", gap: 9 }}>
                      <span style={{ width: 8, height: 8, borderRadius: 9999, background: cc.color, flex: "none" }} />
                      <span style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                        <span style={{ fontFamily: mono, fontSize: 11, fontWeight: 700, color: cc.color }}>{cc.name}</span>
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
        </>
      )}

      <NeutralBand />
      <MagazineFooter />
    </div>
  );
}
