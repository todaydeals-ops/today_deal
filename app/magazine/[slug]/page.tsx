import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { fetchMagazineBySlug } from "@/lib/data/magazine";
import { cornerOf } from "@/lib/magazine/corners";
import { MagazineUtilBar, MagazineMasthead, MagazineFooter, FieldPill } from "@/components/magazine/Chrome";

export const dynamic = "force-dynamic";
const SITE = "https://www.todaydeals.co.kr";
const mono = "'JetBrains Mono', monospace";
const serif = "'Noto Serif KR', serif";
const fmtDate = (iso: string) => iso.slice(0, 10).replace(/-/g, ".");

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const a = await fetchMagazineBySlug(slug);
  if (!a) return { title: "오늘의딜 매거진" };
  const desc = (a.excerpt || a.subtitle || `${a.title} — 오늘의딜 매거진의 중립 쇼핑 가이드.`).slice(0, 155);
  return {
    title: `${a.title} | 오늘의딜 매거진`,
    description: desc,
    alternates: { canonical: `${SITE}/magazine/${slug}` },
    openGraph: { title: a.title, description: desc, url: `${SITE}/magazine/${slug}`, type: "article", images: [{ url: `${SITE}/magazine/opengraph-image`, width: 1200, height: 630, alt: "오늘의딜 매거진" }] },
  };
}

export default async function MagazineArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const a = await fetchMagazineBySlug(slug);
  if (!a) notFound();
  const c = cornerOf(a.corner);

  const ld = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: a.title,
    ...(a.subtitle ? { alternativeHeadline: a.subtitle } : {}),
    ...(a.excerpt ? { description: a.excerpt } : {}),
    datePublished: a.createdAt,
    author: { "@type": "Organization", name: "오늘의딜 편집국" },
    publisher: { "@type": "Organization", name: "오늘의딜", url: SITE },
    mainEntityOfPage: `${SITE}/magazine/${slug}`,
    articleSection: c.name,
  };

  return (
    <div className="mz-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <MagazineUtilBar />
      <MagazineMasthead />

      <div className="mz-wrap" style={{ paddingBottom: 80 }}>
        {/* ── 타이틀 블록 (풀폭) ── */}
        <div style={{ padding: "50px 0 0" }}>
          <div style={{ fontFamily: mono, fontSize: 11.5, letterSpacing: ".5px", color: "#9a9286", display: "flex", alignItems: "center", gap: 8 }}>
            <Link href="/magazine" className="ul-sweep" style={{ color: "#9a9286", textDecoration: "none" }}>매거진</Link>
            <span style={{ opacity: 0.5 }}>›</span>
            <Link href={`/magazine?corner=${a.corner}`} className="ul-sweep" style={{ color: c.color, fontWeight: 600, textDecoration: "none" }}>{c.name}</Link>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 9, marginTop: 18, flexWrap: "wrap" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <span style={{ width: 8, height: 8, borderRadius: 9999, background: c.color }} />
              <span style={{ fontFamily: mono, fontSize: 11, fontWeight: 700, letterSpacing: ".5px", color: c.color }}>{c.name}</span>
            </span>
            <FieldPill field={a.field} />
          </div>
          <h1 style={{ fontFamily: serif, fontWeight: 700, fontSize: 46, letterSpacing: "-1.6px", lineHeight: 1.26, margin: "18px 0 0", color: "#16140f", textWrap: "balance", maxWidth: 900 }}>{a.title}</h1>
          {a.subtitle && <div style={{ fontFamily: serif, fontWeight: 500, fontSize: 20, lineHeight: 1.6, color: "#7a756a", margin: "14px 0 0" }}>{a.subtitle}</div>}
          <div style={{ fontFamily: mono, fontSize: 12, color: "#9a9286", marginTop: 20, paddingBottom: 30, borderBottom: "1px solid rgba(22,20,15,0.16)" }}>
            편집국 · {fmtDate(a.createdAt)}{a.readMin ? ` · 읽기 ${a.readMin}분` : ""}
          </div>
        </div>

        {/* ── 본문 그리드: 메인 + 레일 ── */}
        <div className="art-grid" style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 64, padding: "40px 0 0", alignItems: "start" }}>
          <main className="mz-body" style={{ minWidth: 0 }} dangerouslySetInnerHTML={{ __html: a.bodyHtml }} />

          <aside className="art-rail" style={{ position: "sticky", top: 24, display: "flex", flexDirection: "column", gap: 18 }}>
            {/* 정직성 배지 */}
            <div style={{ border: "1px solid rgba(22,20,15,0.12)", background: "#faf8f5", borderRadius: 14, padding: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ width: 30, height: 30, borderRadius: 9999, border: "2px solid #ff5a3c", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="#ff5a3c" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </span>
                <span style={{ fontFamily: mono, fontSize: 10, fontWeight: 600, letterSpacing: ".5px", color: "#ff5a3c" }}>AD-FREE</span>
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, lineHeight: 1.5, marginTop: 12 }}>특정 제품을 추천하지 않습니다</div>
              <div style={{ fontSize: 12, color: "#76726b", lineHeight: 1.55, marginTop: 4 }}>소비자의 바른 선택, 그 방향만 제시합니다.</div>
            </div>

            {/* 3줄 요약 */}
            {a.summary && a.summary.length > 0 && (
              <div style={{ border: "1px solid rgba(22,20,15,0.14)", borderRadius: 14, padding: 18 }}>
                <div style={{ fontFamily: mono, fontSize: 10.5, letterSpacing: "1.5px", color: "#9a9286" }}>{a.summary.length}줄 요약</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 14 }}>
                  {a.summary.map((s, i) => (
                    <div key={i} style={{ display: "flex", gap: 10 }}>
                      <span style={{ fontFamily: mono, fontWeight: 700, fontSize: 12, color: c.color, flex: "none" }}>{String(i + 1).padStart(2, "0")}</span>
                      <span style={{ fontSize: 13, lineHeight: 1.6, color: "#33312d" }} dangerouslySetInnerHTML={{ __html: s }} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 짚고 가요 */}
            {a.callout && (
              <div style={{ border: "1px solid #f0c3b5", background: "#fff5f1", borderRadius: 14, padding: 18 }}>
                <div style={{ fontFamily: mono, fontSize: 10.5, fontWeight: 700, letterSpacing: "1px", color: "#ff5a3c" }}>짚고 가요</div>
                <p style={{ fontSize: 13, lineHeight: 1.7, color: "#8a3a22", margin: "10px 0 0" }} dangerouslySetInnerHTML={{ __html: a.callout }} />
              </div>
            )}
          </aside>
        </div>

        {/* ── 정직한 마무리 (풀폭) ── */}
        {a.closing && (
          <div style={{ background: "#16140f", borderRadius: 16, padding: "30px 34px", margin: "48px 0 0" }}>
            <div style={{ fontFamily: mono, fontSize: 11, letterSpacing: "1px", color: "#ff8a6f", fontWeight: 600 }}>정직한 마무리</div>
            <p style={{ fontFamily: serif, fontWeight: 600, fontSize: 22, lineHeight: 1.6, letterSpacing: "-0.4px", color: "#f3efe9", margin: "12px 0 0", maxWidth: 760 }} dangerouslySetInnerHTML={{ __html: a.closing }} />
          </div>
        )}
      </div>

      <MagazineFooter />
    </div>
  );
}
