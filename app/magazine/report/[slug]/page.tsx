import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { fetchReportBySlug, fetchReportSlugs } from "@/lib/data/magazine-report";

export const dynamic = "force-dynamic";
const SITE = "https://www.todaydeals.co.kr";

const CORNER_COLORS: Record<string, string> = {
  factcheck: "#1f6b66",
  smartguide: "#e0481f",
  compare: "#38539a",
  longrun: "#7a5f2e",
  trendlab: "#6e4690",
};
const CORNER_NAMES: Record<string, string> = {
  factcheck: "팩트체크", smartguide: "스마트가이드", compare: "끝장비교", longrun: "롱런팁", trendlab: "트렌드랩",
};
const fmtDate = (iso: string) => iso.slice(0, 10).replace(/-/g, ".");

export async function generateStaticParams() {
  const slugs = await fetchReportSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const report = await fetchReportBySlug(slug);
  if (!report) return { title: "오늘의딜 매거진 리포트" };
  const desc = (report.excerpt || report.intro || `${report.title} — 오늘의딜 매거진 큐레이션 리포트`).slice(0, 155);
  return {
    title: `${report.title} | 오늘의딜 리포트`,
    description: desc,
    alternates: { canonical: `${SITE}/magazine/report/${slug}` },
    openGraph: {
      title: report.title,
      description: desc,
      url: `${SITE}/magazine/report/${slug}`,
      type: "article",
      images: [{ url: `${SITE}/magazine/opengraph-image`, width: 1200, height: 630, alt: "오늘의딜 매거진" }],
    },
  };
}

export default async function MagazineReportPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const report = await fetchReportBySlug(slug);
  if (!report) notFound();

  const ld = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: report.title,
    description: report.intro,
    url: `${SITE}/magazine/report/${slug}`,
    datePublished: report.createdAt,
    publisher: { "@type": "Organization", name: "오늘의딜", url: SITE },
    hasPart: report.articles.map((a) => ({
      "@type": "Article",
      headline: a.title,
      url: `${SITE}/magazine/${a.slug}`,
      articleSection: CORNER_NAMES[a.corner] ?? a.corner,
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />

      <div style={{ maxWidth: 800, margin: "0 auto", padding: "0 16px 80px" }}>
        {/* 브레드크럼 */}
        <nav style={{ fontSize: 13, color: "#888", padding: "24px 0 20px", display: "flex", gap: 6, alignItems: "center" }}>
          <Link href="/" style={{ color: "#888", textDecoration: "none" }}>홈</Link>
          <span>›</span>
          <Link href="/magazine" style={{ color: "#888", textDecoration: "none" }}>매거진</Link>
          <span>›</span>
          <span style={{ color: "#333" }}>리포트</span>
        </nav>

        {/* 리포트 헤더 */}
        <header style={{ borderTop: "3px solid #1a1a1a", paddingTop: 24, marginBottom: 32 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <span style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, letterSpacing: "0.12em", color: "#fff", background: "#1a1a1a", padding: "3px 10px", borderRadius: 4 }}>
              REPORT
            </span>
            <span style={{ fontSize: 13, color: "#888" }}>{report.topic}</span>
          </div>

          <h1 style={{ fontSize: 28, fontWeight: 800, lineHeight: 1.35, marginBottom: 10, color: "#1a1a1a", fontFamily: "'Noto Serif KR', serif" }}>
            {report.title}
          </h1>
          {report.subtitle && (
            <p style={{ fontSize: 17, color: "#555", marginBottom: 14, lineHeight: 1.5 }}>{report.subtitle}</p>
          )}
          <p style={{ fontSize: 13, color: "#aaa" }}>
            오늘의딜 편집국 &nbsp;·&nbsp; {fmtDate(report.createdAt)} &nbsp;·&nbsp; 가이드 {report.articles.length}편 수록
          </p>
        </header>

        {/* 소개문 */}
        {report.intro && (
          <section style={{ background: "#f7f7f5", borderLeft: "4px solid #1a1a1a", padding: "18px 22px", marginBottom: 40, borderRadius: "0 6px 6px 0" }}>
            <p style={{ fontSize: 16, lineHeight: 1.75, color: "#333", margin: 0 }}>{report.intro}</p>
          </section>
        )}

        {/* 목차 */}
        <nav style={{ marginBottom: 48 }}>
          <p style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, letterSpacing: "0.1em", color: "#aaa", marginBottom: 12 }}>목 차</p>
          <ol style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 8 }}>
            {report.articles.map((a, i) => (
              <li key={a.slug}>
                <a href={`#article-${i + 1}`} style={{ display: "flex", alignItems: "center", gap: 12, textDecoration: "none", color: "#1a1a1a", padding: "10px 14px", border: "1px solid #e8e8e8", borderRadius: 6, transition: "background .15s" }}>
                  <span style={{ fontSize: 12, fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: "#aaa", minWidth: 24 }}>0{i + 1}</span>
                  <span style={{ fontSize: 8, width: 8, height: 8, borderRadius: "50%", background: CORNER_COLORS[a.corner] ?? "#888", flexShrink: 0, display: "inline-block" }} />
                  <span style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.4 }}>{a.title}</span>
                  {a.readMin && <span style={{ fontSize: 12, color: "#aaa", marginLeft: "auto", whiteSpace: "nowrap" }}>{a.readMin}분</span>}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <hr style={{ border: "none", borderTop: "1px solid #e8e8e8", marginBottom: 48 }} />

        {/* 아티클 전문 (SEO 롱폼) */}
        {report.articles.map((a, i) => (
          <article key={a.slug} id={`article-${i + 1}`} style={{ marginBottom: 64 }}>
            {/* 아티클 헤더 */}
            <header style={{ marginBottom: 24 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <span style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: "#aaa" }}>0{i + 1}</span>
                <span style={{ fontSize: 12, color: CORNER_COLORS[a.corner] ?? "#888", fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.08em" }}>
                  {CORNER_NAMES[a.corner] ?? a.corner.toUpperCase()}
                </span>
                {a.field && <span style={{ fontSize: 12, color: "#888", background: "#f0f0f0", padding: "2px 8px", borderRadius: 99 }}>{a.field}</span>}
              </div>
              <h2 style={{ fontSize: 22, fontWeight: 800, lineHeight: 1.4, color: "#1a1a1a", marginBottom: 6, fontFamily: "'Noto Serif KR', serif" }}>
                <Link href={`/magazine/${a.slug}`} style={{ color: "inherit", textDecoration: "none" }}>{a.title}</Link>
              </h2>
              {a.subtitle && <p style={{ fontSize: 15, color: "#666", lineHeight: 1.5 }}>{a.subtitle}</p>}
            </header>

            {/* 3줄 요약 (있을 때) */}
            {a.summary && a.summary.length > 0 && (
              <div style={{ background: "#fafafa", border: "1px solid #e8e8e8", borderRadius: 8, padding: "14px 18px", marginBottom: 24 }}>
                <p style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: "#aaa", marginBottom: 10, fontWeight: 700 }}>3줄 요약</p>
                <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 6 }}>
                  {a.summary.map((s, si) => (
                    <li key={si} style={{ fontSize: 14, color: "#333", lineHeight: 1.6, display: "flex", gap: 8 }}>
                      <span style={{ color: "#ccc" }}>—</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* 본문 */}
            <div
              className="magazine-body"
              style={{ fontSize: 15, lineHeight: 1.85, color: "#333" }}
              dangerouslySetInnerHTML={{ __html: a.bodyHtml }}
            />

            {/* 마무리(closing) */}
            {a.closing && (
              <div style={{ background: "#1a1a1a", borderRadius: 8, padding: "18px 22px", marginTop: 24 }}>
                <div style={{ color: "#e8e8e8", fontSize: 14, lineHeight: 1.75 }} dangerouslySetInnerHTML={{ __html: a.closing }} />
              </div>
            )}

            {/* 원문 링크 */}
            <div style={{ marginTop: 16, textAlign: "right" }}>
              <Link href={`/magazine/${a.slug}`} style={{ fontSize: 13, color: "#888", textDecoration: "underline" }}>
                이 가이드 전용 페이지 →
              </Link>
            </div>

            {i < report.articles.length - 1 && (
              <hr style={{ border: "none", borderTop: "1px solid #e8e8e8", marginTop: 48 }} />
            )}
          </article>
        ))}

        {/* 하단 CTA */}
        <footer style={{ borderTop: "2px solid #1a1a1a", paddingTop: 28, marginTop: 16 }}>
          <p style={{ fontSize: 14, color: "#555", lineHeight: 1.7, marginBottom: 20 }}>
            오늘의딜 매거진은 광고·제휴 없이 독립적으로 작성된 중립 쇼핑 가이드입니다.<br />
            구매 결정은 항상 본인의 상황과 필요에 맞게 내리세요.
          </p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Link href="/magazine" style={{ fontSize: 14, color: "#1a1a1a", fontWeight: 700, textDecoration: "none", border: "2px solid #1a1a1a", padding: "10px 20px", borderRadius: 6 }}>
              ← 매거진 전체 보기
            </Link>
            <Link href="/" style={{ fontSize: 14, color: "#555", textDecoration: "none", border: "1px solid #e0e0e0", padding: "10px 20px", borderRadius: 6 }}>
              오늘의 핫딜 보러 가기
            </Link>
          </div>
        </footer>
      </div>
    </>
  );
}
