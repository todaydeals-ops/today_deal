import type { Metadata } from "next";
import Link from "next/link";
import { fetchMagazineList } from "@/lib/data/magazine";
import { isCorner, cornerOf, MAGAZINE_SLOGAN } from "@/lib/magazine/corners";
import { MagazineHeader, MagazineFooter, MagazineLogo, CornerChip, FieldChip, CoverPanel } from "@/components/magazine/Chrome";

export const dynamic = "force-dynamic";
const SITE = "https://www.todaydeals.co.kr";
const mono = "'JetBrains Mono', monospace";
const serif = "'Noto Serif KR', serif";

export const metadata: Metadata = {
  title: "오늘의딜 매거진 — 팔지 않습니다, 방향만 드립니다",
  description: "광고도 제휴도 받지 않는 중립 쇼핑 가이드. 더 나은 선택에 필요한 기준과 근거만 데이터로 정리합니다. 판단은 당신의 몫입니다.",
  alternates: { canonical: `${SITE}/magazine` },
  openGraph: { title: "오늘의딜 매거진 — 중립 쇼핑 가이드", description: "광고·제휴 없이, 구매 판단의 기준만.", url: `${SITE}/magazine`, type: "website" },
};

const fmtDate = (iso: string) => iso.slice(0, 10).replace(/-/g, ".");

function GuideCard({ a }: { a: { slug: string; corner: string; field?: string; title: string } }) {
  return (
    <Link href={`/magazine/${a.slug}`} className="h-lift" style={{ display: "block", border: "1px solid #e7e2d9", borderRadius: 14, overflow: "hidden", textDecoration: "none", color: "#16160f", background: "#fff" }}>
      <CoverPanel cornerKey={a.corner} headline={a.field || cornerOf(a.corner).name} height={118} big={20} />
      <div style={{ padding: "14px 16px 16px" }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <CornerChip cornerKey={a.corner} size="sm" />
        </div>
        <div style={{ fontSize: 15, fontWeight: 700, color: "#16160f", lineHeight: 1.4, marginTop: 10, letterSpacing: "-0.3px" }}>{a.title}</div>
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
    <div className="mz-page">
      <MagazineHeader />
      <main className="mz-aw">
        <div className="mz-sheet">
          {/* hero */}
          <div className="mz-hero">
            <div className="mz-hero-top">
              <MagazineLogo />
              <div className="mz-meta-r">ISSUE · NEUTRAL GUIDE<br />광고·제휴 없음</div>
            </div>
            <div className="mz-bc">
              <Link href="/" style={{ color: "#7a2e1c" }}>홈</Link>
              <span style={{ opacity: 0.5 }}>›</span>
              <b>매거진</b>
              {corner && (<><span style={{ opacity: 0.5 }}>›</span><b>{cornerOf(corner).name}</b></>)}
            </div>
            <h1 className="mz-h1">{MAGAZINE_SLOGAN}</h1>
            <p className="mz-desc">
              오늘의딜 매거진은 광고도 제휴도 받지 않는 <b>중립 쇼핑 가이드</b>입니다. 특정 제품을 추천하거나 비방하지 않고, 더 나은 선택에 필요한 <b>기준과 근거만 데이터로</b> 정리합니다. 판단은, 언제나 당신의 몫입니다.
            </p>
            <div className="mz-meta">
              <div><span className="k">코너</span><div className="v">5 코너</div></div>
              <div><span className="k">분야</span><div className="v">6 분야</div></div>
              <div><span className="k">운영</span><div className="v">무광고 · 무제휴</div></div>
              <div><span className="k">발행</span><div className="v">{list.length}편</div></div>
            </div>
          </div>

          {/* body */}
          <div className="mz-sheetbody">
            {corner && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18, fontSize: 13 }}>
                <span style={{ fontFamily: mono, fontSize: 11, color: "#9a9788" }}>코너 필터</span>
                <CornerChip cornerKey={corner} />
                <Link href="/magazine" className="mz-link" style={{ color: "#9a9788", fontSize: 12, marginLeft: 4 }}>전체보기 ✕</Link>
              </div>
            )}

            {list.length === 0 ? (
              <div style={{ padding: "56px 20px", textAlign: "center", color: "#9a9788" }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#6b6a60" }}>첫 가이드를 준비하고 있어요.</div>
                <div style={{ fontSize: 13, marginTop: 8 }}>광고·제휴 없이, 진짜 도움 되는 글로 곧 채워집니다.</div>
              </div>
            ) : (
              <>
                {featured && (
                  <Link href={`/magazine/${featured.slug}`} className="h-lift" style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", border: "1px solid #e7e2d9", borderRadius: 16, overflow: "hidden", textDecoration: "none", color: "#16160f", marginBottom: 22 }}>
                    <div style={{ padding: "28px 30px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <CornerChip cornerKey={featured.corner} />
                        <FieldChip field={featured.field} />
                      </div>
                      <h2 style={{ fontSize: 26, fontWeight: 800, color: "#16160f", letterSpacing: "-0.7px", lineHeight: 1.28, margin: "14px 0 0" }}>{featured.title}</h2>
                      {featured.excerpt && <p style={{ fontFamily: serif, fontSize: 15, color: "#44413a", lineHeight: 1.8, margin: "12px 0 0" }}>{featured.excerpt}</p>}
                      <div style={{ fontFamily: mono, fontSize: 12, color: "#9a9788", marginTop: 18 }}>편집국 · {fmtDate(featured.createdAt)}{featured.readMin ? ` · 읽기 ${featured.readMin}분` : ""}</div>
                    </div>
                    <CoverPanel cornerKey={featured.corner} headline={featured.subtitle || featured.title} height={200} big={26} />
                  </Link>
                )}

                {rest.length > 0 && (
                  <>
                    <div className="mz-seclabel">최신 가이드 · LATEST</div>
                    <div className="mz-grid3" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 18 }}>
                      {rest.map((a) => <GuideCard key={a.id} a={a} />)}
                    </div>
                  </>
                )}
              </>
            )}
          </div>

          {/* outro */}
          <div className="mz-outro">
            <div>
              <div className="t">광고도 제휴도 받지 않습니다</div>
              <div className="s">특정 제품을 추천·비방하지 않는 중립 쇼핑 가이드 · 판단은 당신의 몫</div>
            </div>
            <Link href="/magazine" className="mz-link" style={{ fontWeight: 700, fontSize: 15, color: "#16160f", whiteSpace: "nowrap" }}>전체 가이드 →</Link>
          </div>
        </div>
      </main>
      <MagazineFooter />
    </div>
  );
}
