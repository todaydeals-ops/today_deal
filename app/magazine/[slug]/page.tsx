import type { Metadata } from "next";
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
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <main style={{ background: "#fff", minHeight: "100vh", fontFamily: "'Noto Sans KR', sans-serif" }}>
        <div style={{ maxWidth: 980, margin: "0 auto" }}>
          <MagazineHeader small />

          <article style={{ maxWidth: 720, margin: "0 auto", padding: "34px 30px 44px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <CornerChip cornerKey={a.corner} />
              <FieldChip field={a.field} />
            </div>
            <h1 style={{ fontSize: 33, fontWeight: 900, color: "#1a1a1a", letterSpacing: "-1px", lineHeight: 1.3, margin: "14px 0 0" }}>
              {a.title}
              {a.subtitle ? <><br /><span style={{ fontSize: 24, fontWeight: 800 }}>{a.subtitle}</span></> : null}
            </h1>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 16, fontFamily: mono, fontSize: 12, color: "#9a958c" }}>
              <span>편집국</span><span>·</span><span>{fmtDate(a.createdAt)}</span>{a.readMin ? <><span>·</span><span>읽기 {a.readMin}분</span></> : null}
            </div>

            <HonestyBadge />

            {/* 본문 — 시그니처 컴포넌트 포함 HTML. 본문 내 구매/제휴 링크 없음. */}
            <div className="mz-body" style={{ fontSize: 16, color: "#33312d", lineHeight: 1.85 }} dangerouslySetInnerHTML={{ __html: a.bodyHtml }} />

            {/* 정직한 마무리 */}
            {a.closing && (
              <div style={{ marginTop: 30, padding: "22px 24px", background: "#1a1a1a", borderRadius: 14 }}>
                <div style={{ fontFamily: mono, fontSize: 11, letterSpacing: "1px", color: "#ff8a6f", fontWeight: 600, marginBottom: 8 }}>정직한 마무리</div>
                <p style={{ fontSize: 15, color: "#f3efe9", lineHeight: 1.8, margin: 0, fontWeight: 500 }} dangerouslySetInnerHTML={{ __html: a.closing }} />
              </div>
            )}
          </article>

          <MagazineFooter />
        </div>
      </main>
    </>
  );
}
