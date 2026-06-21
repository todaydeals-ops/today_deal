import type { Metadata } from "next";
import Link from "next/link";
import { fetchMagazineList } from "@/lib/data/magazine";
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
  const list = await fetchMagazineList({ corner });
  const featured = list[0];
  const rest = list.slice(1);

  const [hiPre, hiPost] = CATCH.media.tail.split(CATCH.media.hi);

  return (
    <div className="mz-page">
      <MagazineUtilBar />
      <MagazineMasthead />

      {/* 슬로건 */}
      <section className="mz-wrap" style={{ paddingTop: 54, paddingBottom: 44 }}>
        <div style={{ fontFamily: mono, fontSize: 12, letterSpacing: "3px", textTransform: "uppercase", color: "#9a9286" }}>
          {corner ? `Corner — ${cornerOf(corner).nameEn}` : "Neutral Shopping Guide — Issue 01"}
        </div>
        <h1 className="mz-h1">
          <span className="mz-h1-1">{CATCH.media.lead}</span>
          <span className="mz-h1-2">{hiPre}<span style={{ color: "#ff5a3c" }}>{CATCH.media.hi}</span>{hiPost}</span>
        </h1>
        {corner && (
          <div style={{ marginTop: 18, display: "flex", alignItems: "center", gap: 12, fontFamily: mono, fontSize: 12, color: "#9a9286" }}>
            <span>필터 · {cornerOf(corner).name}</span>
            <Link href="/magazine" className="ul-sweep" style={{ color: "#16140f", textDecoration: "none" }}>✕ 전체 보기</Link>
          </div>
        )}
      </section>

      <CornerIndex />

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
