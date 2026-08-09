import type { Metadata } from "next";
import Link from "next/link";
import { fetchMagazineList } from "@/lib/data/magazine";
import { FeaturedImageSlot } from "@/components/magazine/Chrome";
import BeautyHeader from "@/components/magazine/BeautyHeader";
import BeautyCategoryIndex from "@/components/magazine/BeautyCategoryIndex";
import Pagination from "@/components/magazine/Pagination";
import BeautyFooter from "@/components/magazine/BeautyFooter";
import { beautyCategoryByKey, beautyCategoryOf } from "@/lib/magazine/beautyCategories";
import { beautyOnSubdomain, beautyHref } from "@/lib/magazine/subdomain";
import "../magazine/magazine.css";

// 성분연구소 — 오늘의딜 파생 뷰티·다이어트 성분 검증 미디어. field="뷰티·성분" + 고유 6분류.
export const revalidate = 3600;
const mono = "'Pretendard', -apple-system, BlinkMacSystemFont, sans-serif";
const serif = "'Noto Serif KR', serif";
const PER = 12;
const fmtDate = (iso: string) => iso.slice(0, 10).replace(/-/g, ".");

export const metadata: Metadata = {
  title: "성분연구소 — 임상으로 검증하는 뷰티 성분",
  description: "화제성이나 후기가 아니라 임상 근거로 성분을 따집니다. 보습·장벽, 미백·주름, 트러블·모공, 자외선·환경, 두피·모발, 다이어트·바디.",
};

export default async function BeautyHome({ searchParams }: { searchParams: Promise<{ cat?: string; page?: string }> }) {
  const sp = await searchParams;
  const cat = beautyCategoryByKey(sp.cat);
  const page = Math.max(1, Number(sp.page) || 1);
  const all = await fetchMagazineList({ field: "뷰티·성분", limit: 60 });
  const filtered = cat ? all.filter((a) => cat.slugs.includes(a.slug)) : all;
  const totalPages = Math.max(1, Math.ceil(filtered.length / PER));
  const pageList = filtered.slice((page - 1) * PER, page * PER);
  const featured = page === 1 ? pageList[0] : undefined;
  const rows = page === 1 ? pageList.slice(1) : pageList;
  const showIndex = !cat && page === 1;

  const onSub = await beautyOnSubdomain();
  const pageHref = (p: number) => beautyHref(onSub, cat?.key, p);

  return (
    <>
      <BeautyHeader />

      <div className="mz-page">
        <section className="mz-wrap mz-slogan" style={{ paddingTop: 46, paddingBottom: 34 }}>
          <div style={{ fontFamily: mono, fontSize: 12, letterSpacing: "3px", textTransform: "uppercase", color: "#9a9286" }}>{cat ? "성분연구소" : "Evidence-based Beauty Media"}</div>
          {cat ? (
            <>
              <h1 style={{ fontFamily: serif, fontWeight: 700, fontSize: "clamp(28px,4.4vw,44px)", lineHeight: 1.32, letterSpacing: "-1px", color: "#16140f", margin: "18px 0 0" }}>{cat.label}</h1>
              <p style={{ fontSize: 15.5, lineHeight: 1.85, color: "#46433d", margin: "16px 0 0", maxWidth: 640 }}>{cat.angle}을(를) 중심으로, 임상 근거가 있는 것과 광고가 앞선 것을 갈라 정리했습니다.</p>
            </>
          ) : (
            <>
              <h1 style={{ fontFamily: serif, fontWeight: 700, fontSize: "clamp(28px,4.4vw,44px)", lineHeight: 1.32, letterSpacing: "-1px", color: "#16140f", margin: "18px 0 0", maxWidth: 820, textWrap: "balance" }}>
                광고를 지우면, <span style={{ color: "#ff5a3c" }}>성분</span>만 남습니다.
              </h1>
              <p style={{ fontSize: 15.5, lineHeight: 1.85, color: "#46433d", margin: "18px 0 0", maxWidth: 640 }}>
                화제성이나 후기가 아니라, 그 성분이 임상에서 무엇을 증명했고 무엇이 아직인지로 따집니다.
              </p>
            </>
          )}
        </section>

        {showIndex && <BeautyCategoryIndex />}

        {filtered.length === 0 ? (
          <section className="mz-wrap" style={{ paddingTop: 20, paddingBottom: 80, color: "#9a9286" }}>
            <div style={{ fontFamily: serif, fontSize: 20, fontWeight: 600, color: "#46433d" }}>이 분류의 성분 분석을 준비하고 있어요.</div>
          </section>
        ) : (
          <>
            {featured && (
              <section className="mz-wrap" style={{ paddingTop: 34, paddingBottom: 30 }}>
                <Link href={`/magazine/${featured.slug}`} className="mz-feat">
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 11.5, fontWeight: 600, color: beautyCategoryOf(featured.slug)?.color ?? "#46433d", background: "#efeae1", borderRadius: 9999, padding: "4px 12px" }}>{beautyCategoryOf(featured.slug)?.label ?? "뷰티·성분"}</span>
                      <span style={{ fontFamily: mono, fontSize: 11, letterSpacing: "1px", color: "#9a9286" }}>FEATURED</span>
                    </div>
                    <h2 className="feat-title" style={{ fontFamily: serif, fontWeight: 700, fontSize: 40, letterSpacing: "-1.4px", lineHeight: 1.22, margin: "18px 0 0", color: "#16140f", textWrap: "balance" }}>{featured.title}</h2>
                    {featured.excerpt && <p style={{ fontSize: 15.5, lineHeight: 1.85, color: "#46433d", margin: "18px 0 0", maxWidth: 520 }}>{featured.excerpt}</p>}
                    <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 24, flexWrap: "wrap" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 8, fontWeight: 700, fontSize: 14, color: "#16140f", borderBottom: "2px solid #ff5a3c", paddingBottom: 3 }}>분석 읽기 <span style={{ fontFamily: mono }}>&rarr;</span></span>
                      <span style={{ fontFamily: mono, fontSize: 12, color: "#9a9286" }}>성분연구소 · {fmtDate(featured.createdAt)}{featured.readMin ? ` · 읽기 ${featured.readMin}분` : ""}</span>
                    </div>
                  </div>
                  <FeaturedImageSlot cornerKey={featured.corner} image={featured.image} title={featured.title} label={beautyCategoryOf(featured.slug)?.label ?? "성분"} brand="성분연구소" />
                </Link>
              </section>
            )}

            {rows.length > 0 && (
              <section className="mz-wrap" style={{ paddingTop: 14, paddingBottom: 10 }}>
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", borderTop: "1px solid rgba(22,20,15,0.16)", paddingTop: 16, marginBottom: 6 }}>
                  <span style={{ fontWeight: 800, fontSize: 18 }}>{cat ? cat.label : "성분 분석"}</span>
                  <span style={{ fontFamily: mono, fontSize: 11, letterSpacing: "2px", color: "#9a9286" }}>{filtered.length}편</span>
                </div>
                {rows.map((a, i) => {
                  const rc = beautyCategoryOf(a.slug);
                  return (
                    <Link key={a.id} href={`/magazine/${a.slug}`} className="mz-row row-link">
                      <span className="mz-row-num" style={{ fontFamily: mono, fontSize: 13, fontWeight: 600, color: "#c0b8a9" }}>{String((page - 1) * PER + (page === 1 ? i + 2 : i + 1)).padStart(2, "0")}</span>
                      <span style={{ display: "flex", alignItems: "center", gap: 9 }}>
                        <span style={{ width: 8, height: 8, borderRadius: 9999, background: rc?.color ?? "#3f5a54", flex: "none" }} />
                        <span style={{ fontSize: 11.5, fontWeight: 700, color: rc?.color ?? "#3f5a54" }}>{rc?.label ?? "성분"}</span>
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

      <BeautyFooter />
    </>
  );
}
