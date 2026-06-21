import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { fetchMagazineBySlug } from "@/lib/data/magazine";
import { cornerOf } from "@/lib/magazine/corners";
import { MagazineUtilBar, MagazineMasthead, MagazineFooter, HonestyBadge, CornerDot, FieldPill } from "@/components/magazine/Chrome";

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
    openGraph: { title: a.title, description: desc, url: `${SITE}/magazine/${slug}`, type: "article" },
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

      {/* 헤더(헤로) */}
      <section className="mz-wrap" style={{ paddingTop: 40, paddingBottom: 6 }}>
        <div style={{ fontFamily: mono, fontSize: 12, letterSpacing: "1px", color: "#9a9286", display: "flex", gap: 8, alignItems: "center" }}>
          <Link href="/magazine" className="ul-sweep" style={{ color: "#9a9286", textDecoration: "none" }}>매거진</Link>
          <span style={{ opacity: 0.5 }}>›</span>
          <Link href={`/magazine?corner=${a.corner}`} className="ul-sweep" style={{ color: "#9a9286", textDecoration: "none" }}>{c.name}</Link>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 16, flexWrap: "wrap" }}>
          <CornerDot cornerKey={a.corner} />
          <FieldPill field={a.field} />
        </div>
        <h1 style={{ fontFamily: serif, fontWeight: 700, fontSize: 42, letterSpacing: "-1.6px", lineHeight: 1.22, color: "#16140f", margin: "16px 0 0", maxWidth: 880, textWrap: "balance" }}>
          {a.title}
          {a.subtitle ? <><br /><span style={{ fontSize: 26, fontWeight: 600, color: "#7a756a" }}>{a.subtitle}</span></> : null}
        </h1>
        <div style={{ fontFamily: mono, fontSize: 12, color: "#9a9286", marginTop: 18, letterSpacing: ".3px" }}>
          편집국 · {fmtDate(a.createdAt)}{a.readMin ? ` · 읽기 ${a.readMin}분` : ""}
        </div>
      </section>

      {/* 본문 */}
      <article className="mz-wrap" style={{ maxWidth: 760, paddingTop: 10, paddingBottom: 56 }}>
        <HonestyBadge />
        <div className="mz-body" style={{ fontSize: 16.5, color: "#2c2a24", lineHeight: 1.9 }} dangerouslySetInnerHTML={{ __html: a.bodyHtml }} />

        {a.closing && (
          <div style={{ marginTop: 34, padding: "24px 26px", background: "#16140f", borderRadius: 14 }}>
            <div style={{ fontFamily: mono, fontSize: 11, letterSpacing: "1px", color: "#ff8a6f", fontWeight: 600, marginBottom: 8 }}>정직한 마무리</div>
            <p style={{ fontFamily: serif, fontSize: 17, color: "#f3efe9", lineHeight: 1.85, margin: 0, fontWeight: 500 }} dangerouslySetInnerHTML={{ __html: a.closing }} />
          </div>
        )}
      </article>

      <MagazineFooter />
    </div>
  );
}
