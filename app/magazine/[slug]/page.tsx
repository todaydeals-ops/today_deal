import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { fetchMagazineBySlug } from "@/lib/data/magazine";
import { cornerOf } from "@/lib/magazine/corners";
import { MagazineHeader, MagazineFooter, HonestyBadge, CornerChip, FieldChip } from "@/components/magazine/Chrome";

export const dynamic = "force-dynamic";
const SITE = "https://www.todaydeals.co.kr";
const mono = "'JetBrains Mono', monospace";
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
      <MagazineHeader />
      <main className="mz-aw">
        <div className="mz-sheet">
          {/* hero */}
          <div className="mz-hero">
            <div className="mz-bc">
              <Link href="/magazine" style={{ color: "#7a2e1c" }}>매거진</Link>
              <span style={{ opacity: 0.5 }}>›</span>
              <Link href={`/magazine?corner=${a.corner}`} style={{ color: "#7a2e1c" }}>{c.name}</Link>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 14 }}>
              <CornerChip cornerKey={a.corner} />
              <FieldChip field={a.field} />
            </div>
            <h1 className="mz-h1" style={{ fontSize: 36, marginTop: 14 }}>
              {a.title}
              {a.subtitle ? <><br /><span style={{ fontSize: 24, fontWeight: 700 }}>{a.subtitle}</span></> : null}
            </h1>
            <div style={{ fontFamily: mono, fontSize: 12, color: "#7a2e1c", marginTop: 18, letterSpacing: ".3px" }}>
              편집국 · {fmtDate(a.createdAt)}{a.readMin ? ` · 읽기 ${a.readMin}분` : ""}
            </div>
          </div>

          {/* body */}
          <article style={{ maxWidth: 720, margin: "0 auto", padding: "30px 28px 44px" }}>
            <HonestyBadge />
            <div className="mz-body" style={{ fontSize: 16, color: "#33312d", lineHeight: 1.85 }} dangerouslySetInnerHTML={{ __html: a.bodyHtml }} />

            {a.closing && (
              <div style={{ marginTop: 30, padding: "22px 24px", background: "#16160f", borderRadius: 14 }}>
                <div style={{ fontFamily: mono, fontSize: 11, letterSpacing: "1px", color: "#ff8a6f", fontWeight: 600, marginBottom: 8 }}>정직한 마무리</div>
                <p style={{ fontSize: 15, color: "#f3efe9", lineHeight: 1.8, margin: 0, fontWeight: 500 }} dangerouslySetInnerHTML={{ __html: a.closing }} />
              </div>
            )}
          </article>
        </div>
      </main>
      <MagazineFooter />
    </div>
  );
}
