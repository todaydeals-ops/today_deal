import type { Metadata } from "next";
import { SUB_ORIGIN } from "@/lib/magazine/subdomain";
import Link from "next/link";
import { fetchMagazineList, fetchMagazineCountBy } from "@/lib/data/magazine";
import { FeaturedImageSlot } from "@/components/magazine/Chrome";
import SleepHeader from "@/components/magazine/SleepHeader";
import SleepCategoryIndex from "@/components/magazine/SleepCategoryIndex";
import Pagination from "@/components/magazine/Pagination";
import SleepFooter from "@/components/magazine/SleepFooter";
import { sleepCategoryByKey, sleepCategoryOf } from "@/lib/magazine/sleepCategories";
import "../magazine/magazine.css";

// 잠자리연구소 — 오늘의딜 파생 수면·침구 전문 미디어. field="수면·침구" + 고유 6분류.
export const revalidate = 3600;
const mono = "'Pretendard', -apple-system, BlinkMacSystemFont, sans-serif";
const serif = "'Noto Serif KR', serif";
const PER = 12;
const fmtDate = (iso: string) => iso.slice(0, 10).replace(/-/g, ".");

// ★분류 페이지(?cat=)는 자기 자신을 canonical 로 가리켜야 한다.
// 정적 metadata 로 두면 6개 분류가 전부 홈을 canonical 로 신고해서, 사이트맵에
// 제출해놓고 페이지 스스로 "나는 홈의 사본"이라고 말하는 꼴이 된다 — 색인이 안 된다
// (2026-08-18 GSC "리디렉션이 포함된 페이지" 경고로 발견. b4as 만 generateMetadata 라 멀쩡했다).
export async function generateMetadata({ searchParams }: { searchParams: Promise<{ cat?: string }> }): Promise<Metadata> {
  const cat = sleepCategoryByKey((await searchParams).cat);
  if (!cat) {
    return {
      alternates: { canonical: `${SUB_ORIGIN.sleep}/` },
      title: "잠자리연구소 — 근거로 검증하는 수면 미디어",
      description: "해외 수면 연구를 근거로 검증합니다. 성장하는 잠·공부잘하는 잠·일잘하는 잠·조화로운 잠·늙지않는 잠·잠자리장비학.",
    };
  }
  return {
    alternates: { canonical: `${SUB_ORIGIN.sleep}/?cat=${cat.key}` },
    title: `${cat.label} | 잠자리연구소`,
    description: `${cat.angle}을(를) 중심으로, 해외 수면 연구 근거만 골라 정리했습니다.`,
  };
}

export default async function GoodSleepHome({ searchParams }: { searchParams: Promise<{ cat?: string; page?: string }> }) {
  const sp = await searchParams;
  const cat = sleepCategoryByKey(sp.cat);
  const page = Math.max(1, Number(sp.page) || 1);
  // ★페이징은 DB 에서 끝낸다. 전 편을 받아 메모리에서 자르면 12편 띄우자고
  //   본문 전체(평균 15KB)를 68편치 끌어오게 된다 — 사람이 몰릴 때 그대로 터진다.
  const where = { field: "수면·침구", slugs: cat?.slugs };
  const [total, pageList] = await Promise.all([
    fetchMagazineCountBy(where),
    fetchMagazineList({ ...where, offset: (page - 1) * PER, limit: PER }),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PER));
  const featured = page === 1 ? pageList[0] : undefined;
  const rows = page === 1 ? pageList.slice(1) : pageList;
  const showIndex = !cat && page === 1;

  const pageHref = (p: number) => {
    const q = new URLSearchParams();
    if (cat) q.set("cat", cat.key);
    if (p > 1) q.set("page", String(p));
    const s = q.toString();
    return s ? `${SUB_ORIGIN.sleep}/?${s}` : `${SUB_ORIGIN.sleep}/`;
  };

  return (
    <>
      <SleepHeader />

      <div className="mz-page">
        {/* 슬로건 / 카테고리 헤더 */}
        <section className="mz-wrap mz-slogan" style={{ paddingTop: 46, paddingBottom: 34 }}>
          <div style={{ fontFamily: mono, fontSize: 12, letterSpacing: "3px", textTransform: "uppercase", color: "#9a9286" }}>{cat ? "잠자리연구소" : "Neutral Sleep Media"}</div>
          {cat ? (
            <>
              <h1 style={{ fontFamily: serif, fontWeight: 700, fontSize: "clamp(28px,4.4vw,44px)", lineHeight: 1.32, letterSpacing: "-1px", color: "#16140f", margin: "18px 0 0" }}>{cat.label}</h1>
              <p style={{ fontSize: 15.5, lineHeight: 1.85, color: "#46433d", margin: "16px 0 0", maxWidth: 640 }}>{cat.angle}을(를) 중심으로, 해외 수면 연구 근거만 골라 정리했습니다.</p>
            </>
          ) : (
            <>
              <h1 style={{ fontFamily: serif, fontWeight: 700, fontSize: "clamp(28px,4.4vw,44px)", lineHeight: 1.32, letterSpacing: "-1px", color: "#16140f", margin: "18px 0 0", maxWidth: 820, textWrap: "balance" }}>
                세상의 모든 잠, 오직 <span style={{ color: "#ff5a3c" }}>과학적 근거</span>로만 말합니다.
              </h1>
              <p style={{ fontSize: 15.5, lineHeight: 1.85, color: "#46433d", margin: "18px 0 0", maxWidth: 640 }}>
                해외 전문 수면 연구를 기반으로 아이부터 부모님까지, 인생 단계마다 꼭 필요한 수면 솔루션을 정립합니다.
              </p>
            </>
          )}
        </section>

        {showIndex && <SleepCategoryIndex />}

        {total === 0 ? (
          <section className="mz-wrap" style={{ paddingTop: 20, paddingBottom: 80, color: "#9a9286" }}>
            <div style={{ fontFamily: serif, fontSize: 20, fontWeight: 600, color: "#46433d" }}>이 분류의 칼럼을 준비하고 있어요.</div>
          </section>
        ) : (
          <>
            {featured && (
              <section className="mz-wrap" style={{ paddingTop: 34, paddingBottom: 30 }}>
                <Link href={`/magazine/${featured.slug}`} className="mz-feat">
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 11.5, fontWeight: 600, color: sleepCategoryOf(featured.slug)?.color ?? "#46433d", background: "#efeae1", borderRadius: 9999, padding: "4px 12px" }}>{sleepCategoryOf(featured.slug)?.label ?? "수면·침구"}</span>
                      <span style={{ fontFamily: mono, fontSize: 11, letterSpacing: "1px", color: "#9a9286" }}>FEATURED</span>
                    </div>
                    <h2 className="feat-title" style={{ fontFamily: serif, fontWeight: 700, fontSize: 40, letterSpacing: "-1.4px", lineHeight: 1.22, margin: "18px 0 0", color: "#16140f", textWrap: "balance" }}>{featured.title}</h2>
                    {featured.excerpt && <p style={{ fontSize: 15.5, lineHeight: 1.85, color: "#46433d", margin: "18px 0 0", maxWidth: 520 }}>{featured.excerpt}</p>}
                    <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 24, flexWrap: "wrap" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 8, fontWeight: 700, fontSize: 14, color: "#16140f", borderBottom: "2px solid #ff5a3c", paddingBottom: 3 }}>칼럼 읽기 <span style={{ fontFamily: mono }}>&rarr;</span></span>
                      <span style={{ fontFamily: mono, fontSize: 12, color: "#9a9286" }}>잠자리연구소 · {fmtDate(featured.createdAt)}{featured.readMin ? ` · 읽기 ${featured.readMin}분` : ""}</span>
                    </div>
                  </div>
                  <FeaturedImageSlot cornerKey={featured.corner} image={featured.image} title={featured.title} label={sleepCategoryOf(featured.slug)?.label ?? "수면"} brand="잠자리연구소" />
                </Link>
              </section>
            )}

            {rows.length > 0 && (
              <section className="mz-wrap" style={{ paddingTop: 14, paddingBottom: 10 }}>
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", borderTop: "1px solid rgba(22,20,15,0.16)", paddingTop: 16, marginBottom: 6 }}>
                  <span style={{ fontWeight: 800, fontSize: 18 }}>{cat ? cat.label : "수면 칼럼"}</span>
                  <span style={{ fontFamily: mono, fontSize: 11, letterSpacing: "2px", color: "#9a9286" }}>{total}편</span>
                </div>
                {rows.map((a, i) => {
                  const rc = sleepCategoryOf(a.slug);
                  return (
                    <Link key={a.id} href={`/magazine/${a.slug}`} className="mz-row row-link">
                      <span className="mz-row-num" style={{ fontFamily: mono, fontSize: 13, fontWeight: 600, color: "#c0b8a9" }}>{String((page - 1) * PER + (page === 1 ? i + 2 : i + 1)).padStart(2, "0")}</span>
                      <span style={{ display: "flex", alignItems: "center", gap: 9 }}>
                        <span style={{ width: 8, height: 8, borderRadius: 9999, background: rc?.color ?? "#3f5a54", flex: "none" }} />
                        <span style={{ fontSize: 11.5, fontWeight: 700, color: rc?.color ?? "#3f5a54" }}>{rc?.label ?? "수면"}</span>
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

      <SleepFooter />
    </>
  );
}
