import type { Metadata } from "next";
import Link from "next/link";
import { fetchMagazineList } from "@/lib/data/magazine";
import { FeaturedImageSlot } from "@/components/magazine/Chrome";
import B4asHeader from "@/components/magazine/B4asHeader";
import B4asCategoryIndex from "@/components/magazine/B4asCategoryIndex";
import Pagination from "@/components/magazine/Pagination";
import B4asFooter from "@/components/magazine/B4asFooter";
import { b4asCategoryByKey, b4asCategoryOf } from "@/lib/magazine/b4asCategories";
import { b4asHref } from "@/lib/magazine/subdomain";
import "../magazine/magazine.css";

// AS연구소 — 오늘의딜 파생 자가진단 미디어.
// 다른 서브 미디어와 달리 field가 아니라 corner="repair"로 격리한다(AS는 주제가 아니라 상황이라
// field가 가전·디지털·리빙·자동차로 흩어져 있고, 그 field를 그대로 분류로 쓴다).
export const revalidate = 3600;
const mono = "'Pretendard', -apple-system, BlinkMacSystemFont, sans-serif";
const serif = "'Noto Serif KR', serif";
const PER = 12;
const fmtDate = (iso: string) => iso.slice(0, 10).replace(/-/g, ".");

// 분류 페이지의 <title>은 라벨이 아니라 seoTitle을 쓴다(SEO 목적 분리, 사장님 승인).
export async function generateMetadata({ searchParams }: { searchParams: Promise<{ cat?: string }> }): Promise<Metadata> {
  const cat = b4asCategoryByKey((await searchParams).cat);
  if (!cat) {
    return {
      title: "AS연구소 — AS 부르기 전 5분 셀프체크",
      description: "고장 같아 보이는 증상의 상당수는 설정·연결·청소로 끝납니다. 기기별 증상별로 무엇을 먼저 확인하고 어디까지 직접 해도 되는지 정리합니다.",
    };
  }
  return {
    title: `${cat.seoTitle} | AS연구소`,
    description: `${cat.angle} 증상별로 무엇을 먼저 확인하고, 어디까지 직접 해도 되는지, 언제 기사님을 불러야 하는지 순서대로 정리했습니다.`,
  };
}

export default async function B4asHome({ searchParams }: { searchParams: Promise<{ cat?: string; page?: string }> }) {
  const sp = await searchParams;
  const cat = b4asCategoryByKey(sp.cat);
  const page = Math.max(1, Number(sp.page) || 1);
  const all = await fetchMagazineList({ corner: "repair", limit: 200 });
  const filtered = cat ? all.filter((a) => cat.slugs.includes(a.slug)) : all;
  const totalPages = Math.max(1, Math.ceil(filtered.length / PER));
  const pageList = filtered.slice((page - 1) * PER, page * PER);
  const featured = page === 1 ? pageList[0] : undefined;
  const rows = page === 1 ? pageList.slice(1) : pageList;
  const showIndex = !cat && page === 1;

  const pageHref = (p: number) => b4asHref(cat?.key, p);

  return (
    <>
      <B4asHeader />

      <div className="mz-page">
        <section className="mz-wrap mz-slogan" style={{ paddingTop: 46, paddingBottom: 34 }}>
          <div style={{ fontFamily: mono, fontSize: 12, letterSpacing: "3px", textTransform: "uppercase", color: "#9a9286" }}>{cat ? "AS연구소" : "Self Check Before Service"}</div>
          {cat ? (
            <>
              {/* h1은 라벨이 아니라 seoTitle — "대형가전"으로 검색하는 사람은 없다 */}
              <h1 style={{ fontFamily: serif, fontWeight: 700, fontSize: "clamp(28px,4.4vw,44px)", lineHeight: 1.32, letterSpacing: "-1px", color: "#16140f", margin: "18px 0 0" }}>{cat.seoTitle}</h1>
              <p style={{ fontSize: 15.5, lineHeight: 1.85, color: "#46433d", margin: "16px 0 0", maxWidth: 640 }}>{cat.angle} 증상을, 먼저 확인할 것부터 순서대로 정리했습니다.</p>
            </>
          ) : (
            <>
              <h1 style={{ fontFamily: serif, fontWeight: 700, fontSize: "clamp(28px,4.4vw,44px)", lineHeight: 1.32, letterSpacing: "-1px", color: "#16140f", margin: "18px 0 0", maxWidth: 820, textWrap: "balance" }}>
                고장 같아 보이는 것의 절반은, <span style={{ color: "#ff5a3c" }}>5분</span>이면 끝납니다.
              </h1>
              <p style={{ fontSize: 15.5, lineHeight: 1.85, color: "#46433d", margin: "18px 0 0", maxWidth: 640 }}>
                기사님을 부르기 전에 직접 확인할 수 있는 것들이 있습니다. 증상별로 순서를 정리하고, 여기까지 해봤는데 안 되면 어디에 연락하면 되는지까지 안내합니다.
              </p>
            </>
          )}
        </section>

        {showIndex && <B4asCategoryIndex />}

        {filtered.length === 0 ? (
          <section className="mz-wrap" style={{ paddingTop: 20, paddingBottom: 80, color: "#9a9286" }}>
            <div style={{ fontFamily: serif, fontSize: 20, fontWeight: 600, color: "#46433d" }}>이 분류의 셀프체크를 준비하고 있어요.</div>
          </section>
        ) : (
          <>
            {featured && (
              <section className="mz-wrap" style={{ paddingTop: 34, paddingBottom: 30 }}>
                <Link href={`/magazine/${featured.slug}`} className="mz-feat">
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 11.5, fontWeight: 600, color: b4asCategoryOf(featured.slug)?.color ?? "#46433d", background: "#efeae1", borderRadius: 9999, padding: "4px 12px" }}>{b4asCategoryOf(featured.slug)?.label ?? "셀프체크"}</span>
                      <span style={{ fontFamily: mono, fontSize: 11, letterSpacing: "1px", color: "#9a9286" }}>FEATURED</span>
                    </div>
                    <h2 className="feat-title" style={{ fontFamily: serif, fontWeight: 700, fontSize: 40, letterSpacing: "-1.4px", lineHeight: 1.22, margin: "18px 0 0", color: "#16140f", textWrap: "balance" }}>{featured.title}</h2>
                    {featured.excerpt && <p style={{ fontSize: 15.5, lineHeight: 1.85, color: "#46433d", margin: "18px 0 0", maxWidth: 520 }}>{featured.excerpt}</p>}
                    <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 24, flexWrap: "wrap" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 8, fontWeight: 700, fontSize: 14, color: "#16140f", borderBottom: "2px solid #ff5a3c", paddingBottom: 3 }}>셀프체크 보기 <span style={{ fontFamily: mono }}>&rarr;</span></span>
                      <span style={{ fontFamily: mono, fontSize: 12, color: "#9a9286" }}>AS연구소 · {fmtDate(featured.createdAt)}{featured.readMin ? ` · 읽기 ${featured.readMin}분` : ""}</span>
                    </div>
                  </div>
                  <FeaturedImageSlot cornerKey={featured.corner} image={featured.image} title={featured.title} label={b4asCategoryOf(featured.slug)?.label ?? "셀프체크"} brand="AS연구소" />
                </Link>
              </section>
            )}

            {rows.length > 0 && (
              <section className="mz-wrap" style={{ paddingTop: 14, paddingBottom: 10 }}>
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", borderTop: "1px solid rgba(22,20,15,0.16)", paddingTop: 16, marginBottom: 6 }}>
                  <span style={{ fontWeight: 800, fontSize: 18 }}>{cat ? cat.label : "셀프체크"}</span>
                  <span style={{ fontFamily: mono, fontSize: 11, letterSpacing: "2px", color: "#9a9286" }}>{filtered.length}편</span>
                </div>
                {rows.map((a, i) => {
                  const rc = b4asCategoryOf(a.slug);
                  return (
                    <Link key={a.id} href={`/magazine/${a.slug}`} className="mz-row row-link">
                      <span className="mz-row-num" style={{ fontFamily: mono, fontSize: 13, fontWeight: 600, color: "#c0b8a9" }}>{String((page - 1) * PER + (page === 1 ? i + 2 : i + 1)).padStart(2, "0")}</span>
                      <span style={{ display: "flex", alignItems: "center", gap: 9 }}>
                        <span style={{ width: 8, height: 8, borderRadius: 9999, background: rc?.color ?? "#38539a", flex: "none" }} />
                        <span style={{ fontSize: 11.5, fontWeight: 700, color: rc?.color ?? "#38539a" }}>{rc?.label ?? "셀프체크"}</span>
                      </span>
                      <span className="mz-row-title" style={{ fontFamily: serif, fontWeight: 600, fontSize: 21, letterSpacing: "-0.6px", lineHeight: 1.35, color: "#16140f" }}>{a.title}</span>
                      <span className="mz-row-go row-go" style={{ fontFamily: mono, fontSize: 16, color: "#16140f" }}>&rarr;</span>
                    </Link>
                  );
                })}
              </section>
            )}

            <Pagination page={page} totalPages={totalPages} href={pageHref} />
          </>
        )}
      </div>

      <B4asFooter />
    </>
  );
}
