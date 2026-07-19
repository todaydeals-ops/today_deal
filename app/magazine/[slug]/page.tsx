import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { fetchMagazineBySlug, fetchRelatedMagazine } from "@/lib/data/magazine";
import { cornerOf } from "@/lib/magazine/corners";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { FieldPill } from "@/components/magazine/Chrome";

export const revalidate = 3600; // 1시간 캐시 — 매거진 아티클은 실시간 불필요
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
    openGraph: { title: a.title, description: desc, url: `${SITE}/magazine/${slug}`, type: "article", images: [...(a.image?.url ? [{ url: a.image.url, alt: a.title }] : []), { url: `${SITE}/magazine/opengraph-image`, width: 1200, height: 630, alt: "오늘의딜 매거진" }] },
  };
}

export default async function MagazineArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const a = await fetchMagazineBySlug(slug);
  if (!a) notFound();
  const c = cornerOf(a.corner);
  const related = await fetchRelatedMagazine(a, 4);

  // 대표 이미지를 본문 소제목 사이에 배치 — 짧은 글 1장, 긴 글(본문 2,800자+) 2장
  const bodyWithImages = (() => {
    const imgs = a.images || [];
    if (!imgs.length) return a.bodyHtml;
    const plainLen = a.bodyHtml.replace(/<[^>]+>/g, "").length;
    const want = plainLen >= 2500 ? 2 : 1; // 본문 2,500자+ = 긴 글 → 2장(초반·중간), 그 외 1장(중간)
    const use = imgs.slice(0, Math.min(want, imgs.length));
    const esc = (s: string) => (s || "").replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const fig = (im: { url: string; credit?: string; source?: string }) =>
      `<figure style="margin:42px 0 10px;border-radius:14px;overflow:hidden;position:relative;background:#ece5d9;border:1px solid #e4dccc;height:clamp(190px,34vw,380px);">` +
      `<img src="${esc(im.url)}" alt="${esc(a.title)}" loading="lazy" decoding="async" style="width:100%;height:100%;object-fit:cover;display:block;" />` +
      (im.credit ? `<figcaption style="position:absolute;bottom:8px;right:10px;font-family:'JetBrains Mono',monospace;font-size:10px;color:#fff;background:rgba(0,0,0,.42);padding:3px 8px;border-radius:5px;">${esc(im.source || "Pexels")} &middot; ${esc(im.credit)}</figcaption>` : "") +
      `</figure>`;
    const h2s = [...a.bodyHtml.matchAll(/<h2/g)].map((mm) => mm.index ?? 0);
    let spots: number[];
    if (h2s.length >= 2) {
      spots = use.length === 2
        ? [h2s[Math.max(1, Math.floor(h2s.length / 5))], h2s[Math.floor(h2s.length / 2)]] // 초반 + 중간
        : [h2s[Math.floor(h2s.length / 2)]];
    } else {
      const p = a.bodyHtml.indexOf("</p>");
      spots = [p >= 0 ? p + 4 : 0];
    }
    // 위치 중복 제거 후, 뒤에서부터 삽입(앞 인덱스 밀림 방지)
    const uniq = [...new Set(spots)];
    const inserts = uniq.map((pos, i) => ({ pos, html: fig(use[Math.min(i, use.length - 1)]) })).sort((x, y) => y.pos - x.pos);
    let out = a.bodyHtml;
    for (const ins of inserts) out = out.slice(0, ins.pos) + ins.html + out.slice(ins.pos);
    return out;
  })();

  const ld = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: a.title,
    ...(a.subtitle ? { alternativeHeadline: a.subtitle } : {}),
    ...(a.excerpt ? { description: a.excerpt } : {}),
    ...(a.image?.url ? { image: [a.image.url] } : {}),
    datePublished: a.createdAt,
    dateModified: a.createdAt,
    author: { "@type": "Organization", name: "오늘의딜 편집국" },
    publisher: { "@type": "Organization", name: "오늘의딜", url: SITE },
    mainEntityOfPage: `${SITE}/magazine/${slug}`,
    articleSection: c.name,
    inLanguage: "ko-KR",
    ...(a.field ? { keywords: [a.field, c.name, a.title].join(", ") } : {}),
    isAccessibleForFree: true,
    ...(related.length ? { relatedLink: related.map((r) => `${SITE}/magazine/${r.slug}`) } : {}),
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "매거진", item: `${SITE}/` },
      { "@type": "ListItem", position: 2, name: c.name, item: `${SITE}/?corner=${a.corner}` },
      { "@type": "ListItem", position: 3, name: a.title, item: `${SITE}/magazine/${slug}` },
    ],
  };

  // FAQPage — AI 이해 목적(리치결과 아님). 화면의 FAQ 섹션과 값이 동일해야 함.
  const faqLd = a.faq && a.faq.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: a.faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  } : null;

  return (
    <>
      <Header />
      <div className="mz-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      {faqLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />}
      <div className="mz-wrap" style={{ paddingBottom: 80 }}>
        {/* ── 타이틀 블록 (풀폭) ── */}
        <div style={{ padding: "50px 0 0" }}>
          <div style={{ fontFamily: mono, fontSize: 11.5, letterSpacing: ".5px", color: "#9a9286", display: "flex", alignItems: "center", gap: 8 }}>
            <Link href="/" className="ul-sweep" style={{ color: "#9a9286", textDecoration: "none" }}>매거진</Link>
            <span style={{ opacity: 0.5 }}>›</span>
            <Link href={`/?corner=${a.corner}`} className="ul-sweep" style={{ color: c.color, fontWeight: 600, textDecoration: "none" }}>{c.name}</Link>
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

        {/* ── 핵심 요약 (GEO: AI가 본문 첫머리에서 즉답 발췌) ── */}
        {a.summary && a.summary.length > 0 && (
          <section aria-label="핵심 요약" style={{ margin: "28px 0 0", border: "1px solid rgba(22,20,15,0.14)", borderRadius: 14, padding: "20px 24px", background: "#faf8f5" }}>
            <div style={{ fontFamily: mono, fontSize: 11, letterSpacing: "1.5px", color: c.color, fontWeight: 700, marginBottom: 14 }}>핵심 요약</div>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
              {a.summary.map((s, i) => (
                <li key={i} style={{ display: "flex", gap: 12, fontSize: 16, lineHeight: 1.65, color: "#2c2a24" }}>
                  <span style={{ fontFamily: mono, fontWeight: 700, fontSize: 13, color: c.color, flex: "none", marginTop: 2 }}>{String(i + 1).padStart(2, "0")}</span>
                  <span dangerouslySetInnerHTML={{ __html: s }} />
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* ── 본문 그리드: 메인 + 레일 ── */}
        <div className="art-grid" style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 64, padding: "40px 0 0", alignItems: "start" }}>
          <main className="mz-body" style={{ minWidth: 0 }} dangerouslySetInnerHTML={{ __html: bodyWithImages }} />

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
        {a.closing && (() => {
          // 통짜 문단이 답답해 보이지 않게 문장 2개씩 묶어 문단 분리 + 행간 확대
          const sentences = a.closing.split(/(?<=[.!?])\s+/).filter(Boolean);
          const paras: string[] = [];
          for (let i = 0; i < sentences.length; i += 2) paras.push(sentences.slice(i, i + 2).join(" "));
          return (
            <div style={{ background: "#16140f", borderRadius: 16, padding: "34px 36px", margin: "48px 0 0" }}>
              <div style={{ fontFamily: mono, fontSize: 11, letterSpacing: "1px", color: "#ff8a6f", fontWeight: 600 }}>정직한 마무리</div>
              {paras.map((p, i) => (
                <p key={i} style={{ fontFamily: serif, fontWeight: 500, fontSize: 19.5, lineHeight: 1.9, letterSpacing: "-0.3px", color: "#f3efe9", margin: i === 0 ? "16px 0 0" : "15px 0 0", maxWidth: 720 }} dangerouslySetInnerHTML={{ __html: p }} />
              ))}
            </div>
          );
        })()}

        {/* ── 자주 묻는 질문 (GEO: FAQPage LD와 값 동일) ── */}
        {a.faq && a.faq.length > 0 && (
          <section aria-label="자주 묻는 질문" style={{ margin: "56px 0 0" }}>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", borderTop: "1px solid rgba(22,20,15,0.16)", paddingTop: 16, marginBottom: 18 }}>
              <span style={{ fontWeight: 800, fontSize: 18 }}>자주 묻는 질문</span>
              <span style={{ fontFamily: mono, fontSize: 11, letterSpacing: "2px", color: "#9a9286" }}>FAQ</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {a.faq.map((f, i) => (
                <div key={i} style={{ border: "1px solid rgba(22,20,15,0.12)", borderRadius: 12, padding: "18px 20px", background: "#faf8f5" }}>
                  <div style={{ fontWeight: 700, fontSize: 16, lineHeight: 1.5, color: "#16140f", marginBottom: 8 }}>Q. {f.q}</div>
                  <div style={{ fontSize: 15, lineHeight: 1.75, color: "#46433d" }}>{f.a}</div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── 관련 가이드 (내부링크) ── */}
        {related.length > 0 && (
          <nav aria-label="관련 가이드" style={{ margin: "56px 0 0" }}>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", borderTop: "1px solid rgba(22,20,15,0.16)", paddingTop: 16, marginBottom: 14 }}>
              <span style={{ fontWeight: 800, fontSize: 18 }}>이어서 볼 가이드</span>
              <span style={{ fontFamily: mono, fontSize: 11, letterSpacing: "2px", color: "#9a9286" }}>RELATED</span>
            </div>
            <div className="mz-rel-grid" style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 14 }}>
              {related.map((r) => {
                const rc = cornerOf(r.corner);
                return (
                  <Link key={r.id} href={`/magazine/${r.slug}`} className="mz-rel-card" style={{ display: "block", border: "1px solid rgba(22,20,15,0.14)", borderRadius: 14, padding: "18px 20px", textDecoration: "none", background: "#fff" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ width: 8, height: 8, borderRadius: 9999, background: rc.color, flex: "none" }} />
                      <span style={{ fontFamily: mono, fontSize: 10.5, fontWeight: 700, letterSpacing: ".5px", color: rc.color }}>{rc.name}</span>
                      {r.field && <span style={{ fontSize: 11, color: "#8a857c" }}>· {r.field}</span>}
                    </span>
                    <span style={{ display: "block", fontFamily: serif, fontWeight: 600, fontSize: 18, letterSpacing: "-0.5px", lineHeight: 1.4, color: "#16140f", margin: "10px 0 0" }}>{r.title}</span>
                    {r.subtitle && <span style={{ display: "block", fontSize: 13, lineHeight: 1.6, color: "#7a756a", margin: "7px 0 0" }}>{r.subtitle}</span>}
                  </Link>
                );
              })}
            </div>
          </nav>
        )}
      </div>

      </div>
      <Footer />
    </>
  );
}
