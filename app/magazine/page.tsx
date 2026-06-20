import type { Metadata } from "next";
import Link from "next/link";
import { fetchMagazineList } from "@/lib/data/magazine";
import { CORNERS, cornerOf, isCorner, MAGAZINE_SLOGAN } from "@/lib/magazine/corners";
import { MagazineHeader, MagazineFooter, CornerChip, FieldChip } from "@/components/magazine/Chrome";

export const dynamic = "force-dynamic";
const SITE = "https://www.todaydeals.co.kr";
const mono = "'Noto Sans KR', sans-serif";

export const metadata: Metadata = {
  title: "오늘의딜 매거진 — 팔지 않습니다, 방향만 드립니다",
  description: "광고도 제휴도 받지 않는 중립 쇼핑 가이드. 더 나은 선택에 필요한 기준과 근거만 정리합니다. 판단은 당신의 몫입니다.",
  alternates: { canonical: `${SITE}/magazine` },
  openGraph: { title: "오늘의딜 매거진 — 중립 쇼핑 가이드", description: "광고·제휴 없이 구매 판단의 기준만.", url: `${SITE}/magazine`, type: "website" },
};

const fmtDate = (iso: string) => iso.slice(0, 10).replace(/-/g, ".");

function GuideCard({ a }: { a: { slug: string; corner: string; field?: string; title: string } }) {
  return (
    <Link href={`/magazine/${a.slug}`} className="h-lift" style={{ display: "block", border: "1px solid #e7e2d9", borderRadius: 14, overflow: "hidden", textDecoration: "none", background: "#fff" }}>
      <div style={{ height: 118, background: "#f4f1ec", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: mono, fontSize: 10, color: "#b6b1a8" }}>썸네일</div>
      <div style={{ padding: "14px 16px 16px" }}>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <CornerChip cornerKey={a.corner} size="sm" />
          {a.field && <span style={{ fontSize: 10.5, color: "#8a857c" }}>{a.field}</span>}
        </div>
        <div style={{ fontSize: 14.5, fontWeight: 700, color: "#1a1a1a", lineHeight: 1.4, marginTop: 9, letterSpacing: "-0.3px" }}>{a.title}</div>
      </div>
    </Link>
  );
}

export default async function MagazineHome({ searchParams }: { searchParams: Promise<{ corner?: string }> }) {
  const sp = await searchParams;
  const corner = isCorner(sp.corner) ? sp.corner : undefined;
  const list = await fetchMagazineList({ corner });
  const featured = list[0];
  const rest = list.slice(1);

  return (
    <main style={{ background: "#fff", minHeight: "100vh", fontFamily: "'Noto Sans KR', sans-serif" }}>
      <div style={{ maxWidth: 980, margin: "0 auto" }}>
        <MagazineHeader />

        {/* masthead */}
        <div style={{ padding: "30px 30px 24px", borderBottom: "1px solid #efece7", display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 24 }}>
          <div>
            <h1 style={{ fontSize: 32, fontWeight: 900, color: "#1a1a1a", letterSpacing: "-1px", lineHeight: 1.2, margin: 0 }}>{MAGAZINE_SLOGAN}</h1>
            <p style={{ fontSize: 14, color: "#6f6b64", lineHeight: 1.7, marginTop: 10, maxWidth: 560 }}>
              광고도 제휴도 받지 않습니다. 더 나은 선택에 필요한 <b style={{ fontWeight: 700, color: "#1a1a1a" }}>기준과 근거</b>만 정리해 드립니다. 판단은, 언제나 당신의 몫입니다.
            </p>
          </div>
          <span style={{ flex: "none", fontFamily: mono, fontSize: 10.5, fontWeight: 600, letterSpacing: ".5px", color: "#ff5a3c", border: "1px solid #f7c9ba", borderRadius: 9999, padding: "6px 12px", whiteSpace: "nowrap" }}>무광고 · 무제휴</span>
        </div>

        {/* corner filter row */}
        {corner && (
          <div style={{ padding: "16px 30px 0", display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
            <span style={{ color: "#9a958c", fontFamily: mono, fontSize: 11 }}>코너:</span>
            <CornerChip cornerKey={corner} />
            <Link href="/magazine" style={{ color: "#9a958c", fontSize: 12, marginLeft: 4 }}>전체보기 ✕</Link>
          </div>
        )}

        {list.length === 0 ? (
          <div style={{ padding: "60px 30px", textAlign: "center", color: "#9a958c" }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#6f6b64" }}>첫 가이드를 준비하고 있어요.</div>
            <div style={{ fontSize: 13, marginTop: 8 }}>광고·제휴 없이, 진짜 도움 되는 글로 곧 채워집니다.</div>
          </div>
        ) : (
          <>
            {/* featured */}
            {featured && (
              <div style={{ padding: "26px 30px 10px" }}>
                <Link href={`/magazine/${featured.slug}`} className="h-lift" style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 0, border: "1px solid #e7e2d9", borderRadius: 16, overflow: "hidden", textDecoration: "none" }}>
                  <div style={{ padding: "26px 28px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <CornerChip cornerKey={featured.corner} />
                      <FieldChip field={featured.field} />
                    </div>
                    <h3 style={{ fontSize: 25, fontWeight: 800, color: "#1a1a1a", letterSpacing: "-0.6px", lineHeight: 1.3, margin: "14px 0 0" }}>{featured.title}</h3>
                    {featured.excerpt && <p style={{ fontSize: 14, color: "#6f6b64", lineHeight: 1.7, margin: "10px 0 0" }}>{featured.excerpt}</p>}
                    <div style={{ fontFamily: mono, fontSize: 12, color: "#9a958c", marginTop: 18 }}>편집국 · {fmtDate(featured.createdAt)}{featured.readMin ? ` · 읽기 ${featured.readMin}분` : ""}</div>
                  </div>
                  <div style={{ background: "linear-gradient(135deg,#f1ede6,#e3ddd2)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: mono, fontSize: 11, color: "#b0aaa0", minHeight: 180 }}>대표 이미지</div>
                </Link>
              </div>
            )}

            {/* latest grid */}
            {rest.length > 0 && (
              <div style={{ padding: "24px 30px 30px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                  <span style={{ width: 8, height: 8, background: "#ff5a3c", borderRadius: 2 }} />
                  <span style={{ fontWeight: 800, fontSize: 16, color: "#1a1a1a" }}>최신 가이드</span>
                </div>
                <div className="mz-grid3" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 18 }}>
                  {rest.map((a) => <GuideCard key={a.id} a={a} />)}
                </div>
              </div>
            )}
          </>
        )}

        <MagazineFooter />
      </div>
    </main>
  );
}
