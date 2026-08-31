import type { Metadata } from "next";
import Link from "next/link";
import { fetchMagazineList, fetchMagazineCountBy } from "@/lib/data/magazine";
import { FeaturedImageSlot } from "@/components/magazine/Chrome";
import SponsorHeader from "@/components/magazine/SponsorHeader";
import SponsorCategoryIndex from "@/components/magazine/SponsorCategoryIndex";
import Pagination from "@/components/magazine/Pagination";
import SponsorFooter from "@/components/magazine/SponsorFooter";
import { sponsorCategoryByKey, sponsorCategoryOf } from "@/lib/magazine/sponsorCategories";
import { sponsorHref, SUB_ORIGIN } from "@/lib/magazine/subdomain";
import "../magazine/magazine.css";

// 협찬연구소 — 협찬이 방송의 편성과 내용을 결정하는 구조를 기록한다. field="방송·협찬" + 고유 6분류.
// ★평가하지 않고 결론을 쓰지 않는다. 중립 서술은 톤이 아니라 전략이자 방어다(docs/협찬연구소-설계.md §1).
export const revalidate = 3600;
const mono = "'Pretendard', -apple-system, BlinkMacSystemFont, sans-serif";
const serif = "'Noto Serif KR', serif";
const PER = 12;
const fmtDate = (iso: string) => iso.slice(0, 10).replace(/-/g, ".");

// 분류 페이지(?cat=)는 자기 자신을 canonical 로 — 정적 metadata 면 전부 홈을 가리켜 색인이 안 된다.
export async function generateMetadata({ searchParams }: { searchParams: Promise<{ cat?: string }> }): Promise<Metadata> {
  const cat = sponsorCategoryByKey((await searchParams).cat);
  if (!cat) {
    return {
      alternates: { canonical: `${SUB_ORIGIN.sponsor}/` },
      title: "협찬연구소 — 방송 협찬을 기록합니다",
      description: "낮 시간대 방송에 나온 원료가 같은 날 어디서 팔렸는지, 편성 시각을 나란히 기록합니다. 연계편성·건강정보와 전문가·맛집과 업체·생활용품과 렌털·제도와 규제.",
    };
  }
  return {
    alternates: { canonical: `${SUB_ORIGIN.sponsor}/?cat=${cat.key}` },
    title: `${cat.label} | 협찬연구소`,
    description: `${cat.angle}. 방송 편성과 판매 시각을 그대로 나란히 기록합니다.`,
  };
}

export default async function SponsorHome({ searchParams }: { searchParams: Promise<{ cat?: string; page?: string }> }) {
  const sp = await searchParams;
  const cat = sponsorCategoryByKey(sp.cat);
  const page = Math.max(1, Number(sp.page) || 1);
  // 페이징은 DB 에서 끝낸다(전 편 본문을 끌어오지 않기 위해). goodsleep 과 동일 구조.
  const where = { field: "방송·협찬", slugs: cat?.slugs };
  const [total, pageList] = await Promise.all([
    fetchMagazineCountBy(where),
    fetchMagazineList({ ...where, offset: (page - 1) * PER, limit: PER }),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PER));
  const featured = page === 1 ? pageList[0] : undefined;
  const rows = page === 1 ? pageList.slice(1) : pageList;
  const showIndex = !cat && page === 1;

  const pageHref = (p: number) => sponsorHref(cat?.key, p);

  return (
    <>
      <SponsorHeader />

      <div className="mz-page">
        <section className="mz-wrap mz-slogan" style={{ paddingTop: 46, paddingBottom: 34 }}>
          <div style={{ fontFamily: mono, fontSize: 12, letterSpacing: "3px", textTransform: "uppercase", color: "#9a9286" }}>{cat ? "협찬연구소" : "Broadcast Sponsorship Record"}</div>
          {cat ? (
            <>
              <h1 style={{ fontFamily: serif, fontWeight: 700, fontSize: "clamp(28px,4.4vw,44px)", lineHeight: 1.32, letterSpacing: "-1px", color: "#16140f", margin: "18px 0 0" }}>{cat.label}</h1>
              <p style={{ fontSize: 15.5, lineHeight: 1.85, color: "#46433d", margin: "16px 0 0", maxWidth: 640 }}>{cat.angle}. 평가하지 않고 시각만 나란히 놓습니다.</p>
            </>
          ) : (
            <>
              <h1 style={{ fontFamily: serif, fontWeight: 700, fontSize: "clamp(28px,4.4vw,44px)", lineHeight: 1.32, letterSpacing: "-1px", color: "#16140f", margin: "18px 0 0", maxWidth: 820, textWrap: "balance" }}>
                같은 날, <span style={{ color: "#ff5a3c" }}>같은 원료</span>.
              </h1>
              <p style={{ fontSize: 15.5, lineHeight: 1.85, color: "#46433d", margin: "18px 0 0", maxWidth: 640 }}>
                방송 편성은 공개 정보입니다. 낮 방송에 나온 원료가 같은 날 어디서 팔렸는지 시각을 그대로 놓습니다. 판단은 읽는 분의 몫입니다.
              </p>
            </>
          )}
        </section>

        {showIndex && <SponsorCategoryIndex />}

        {total === 0 ? (
          <section className="mz-wrap" style={{ paddingTop: 20, paddingBottom: 80, color: "#9a9286" }}>
            <div style={{ fontFamily: serif, fontSize: 20, fontWeight: 600, color: "#46433d" }}>이 분류의 기록을 모으고 있어요.</div>
          </section>
        ) : (
          <>
            {featured && (
              <section className="mz-wrap" style={{ paddingTop: 34, paddingBottom: 30 }}>
                <Link href={`/magazine/${featured.slug}`} className="mz-feat">
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 11.5, fontWeight: 600, color: sponsorCategoryOf(featured.slug)?.color ?? "#46433d", background: "#efeae1", borderRadius: 9999, padding: "4px 12px" }}>{sponsorCategoryOf(featured.slug)?.label ?? "방송·협찬"}</span>
                      <span style={{ fontFamily: mono, fontSize: 11, letterSpacing: "1px", color: "#9a9286" }}>FEATURED</span>
                    </div>
                    <h2 className="feat-title" style={{ fontFamily: serif, fontWeight: 700, fontSize: 40, letterSpacing: "-1.4px", lineHeight: 1.22, margin: "18px 0 0", color: "#16140f", textWrap: "balance" }}>{featured.title}</h2>
                    {featured.excerpt && <p style={{ fontSize: 15.5, lineHeight: 1.85, color: "#46433d", margin: "18px 0 0", maxWidth: 520 }}>{featured.excerpt}</p>}
                    <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 24, flexWrap: "wrap" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 8, fontWeight: 700, fontSize: 14, color: "#16140f", borderBottom: "2px solid #ff5a3c", paddingBottom: 3 }}>기록 보기 <span style={{ fontFamily: mono }}>&rarr;</span></span>
                      <span style={{ fontFamily: mono, fontSize: 12, color: "#9a9286" }}>협찬연구소 · {fmtDate(featured.createdAt)}{featured.readMin ? ` · 읽기 ${featured.readMin}분` : ""}</span>
                    </div>
                  </div>
                  <FeaturedImageSlot cornerKey={featured.corner} image={featured.image} title={featured.title} label={sponsorCategoryOf(featured.slug)?.label ?? "기록"} brand="협찬연구소" />
                </Link>
              </section>
            )}

            {rows.length > 0 && (
              <section className="mz-wrap" style={{ paddingTop: 14, paddingBottom: 10 }}>
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", borderTop: "1px solid rgba(22,20,15,0.16)", paddingTop: 16, marginBottom: 6 }}>
                  <span style={{ fontWeight: 800, fontSize: 18 }}>{cat ? cat.label : "기록"}</span>
                  <span style={{ fontFamily: mono, fontSize: 11, letterSpacing: "2px", color: "#9a9286" }}>{total}편</span>
                </div>
                {rows.map((a, i) => {
                  const rc = sponsorCategoryOf(a.slug);
                  return (
                    <Link key={a.id} href={`/magazine/${a.slug}`} className="mz-row row-link">
                      <span className="mz-row-num" style={{ fontFamily: mono, fontSize: 13, fontWeight: 600, color: "#c0b8a9" }}>{String((page - 1) * PER + (page === 1 ? i + 2 : i + 1)).padStart(2, "0")}</span>
                      <span style={{ display: "flex", alignItems: "center", gap: 9 }}>
                        <span style={{ width: 8, height: 8, borderRadius: 9999, background: rc?.color ?? "#3f5a54", flex: "none" }} />
                        <span style={{ fontSize: 11.5, fontWeight: 700, color: rc?.color ?? "#3f5a54" }}>{rc?.label ?? "기록"}</span>
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

      <SponsorFooter />
    </>
  );
}
