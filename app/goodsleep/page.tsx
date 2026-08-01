import type { Metadata } from "next";
import Link from "next/link";
import { fetchMagazineList } from "@/lib/data/magazine";
import { FieldPill, FeaturedImageSlot } from "@/components/magazine/Chrome";
import SleepHeader from "@/components/magazine/SleepHeader";
import { cornerOf } from "@/lib/magazine/corners";
import { sleepCategoryByKey, sleepCategoryOf } from "@/lib/magazine/sleepCategories";
import "../magazine/magazine.css";

// 잠자리연구소 — 오늘의딜 파생 수면·침구 전문 미디어. field="수면·침구" + 고유 6분류.
export const revalidate = 3600;
const mono = "'JetBrains Mono', monospace";
const serif = "'Noto Serif KR', serif";
const MAIN = "https://www.todaydeals.co.kr";
const fmtDate = (iso: string) => iso.slice(0, 10).replace(/-/g, ".");

export const metadata: Metadata = {
  title: "잠자리연구소 — 근거로 검증하는 수면 미디어",
  description: "광고도 협찬도 없이, 해외 수면 연구를 근거로 검증합니다. 성장하는 잠·공부잘하는 잠·일잘하는 잠·조화로운 잠·늙지않는 잠·잠자리장비학.",
};

export default async function GoodSleepHome({ searchParams }: { searchParams: Promise<{ cat?: string }> }) {
  const sp = await searchParams;
  const cat = sleepCategoryByKey(sp.cat);
  const all = await fetchMagazineList({ field: "수면·침구", limit: 60 });
  const list = cat ? all.filter((a) => cat.slugs.includes(a.slug)) : all;
  const featured = list[0];
  const rows = list.slice(1);

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
                광고 말고, <span style={{ color: "#ff5a3c" }}>논문</span>으로 검증하는 잠.
              </h1>
              <p style={{ fontSize: 15.5, lineHeight: 1.85, color: "#46433d", margin: "18px 0 0", maxWidth: 640 }}>
                체험단이나 광고가 아니라 해외 수면 연구를 근거로 정리합니다. 아기부터 시니어까지, 인생 단계마다 다른 잠의 이야기입니다.
              </p>
            </>
          )}
        </section>

        {list.length === 0 ? (
          <section className="mz-wrap" style={{ paddingTop: 20, paddingBottom: 80, color: "#9a9286" }}>
            <div style={{ fontFamily: serif, fontSize: 20, fontWeight: 600, color: "#46433d" }}>이 분류의 칼럼을 준비하고 있어요.</div>
          </section>
        ) : (
          <>
            {featured && (
              <section className="mz-wrap" style={{ paddingTop: 8, paddingBottom: 30 }}>
                <Link href={`/magazine/${featured.slug}`} className="mz-feat">
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                      <FieldPill field={featured.field} />
                      <span style={{ fontFamily: mono, fontSize: 11, letterSpacing: "1px", color: "#9a9286" }}>FEATURED</span>
                    </div>
                    <h2 className="feat-title" style={{ fontFamily: serif, fontWeight: 700, fontSize: 40, letterSpacing: "-1.4px", lineHeight: 1.22, margin: "18px 0 0", color: "#16140f", textWrap: "balance" }}>{featured.title}</h2>
                    {featured.excerpt && <p style={{ fontSize: 15.5, lineHeight: 1.85, color: "#46433d", margin: "18px 0 0", maxWidth: 520 }}>{featured.excerpt}</p>}
                    <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 24, flexWrap: "wrap" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 8, fontWeight: 700, fontSize: 14, color: "#16140f", borderBottom: "2px solid #ff5a3c", paddingBottom: 3 }}>칼럼 읽기 <span style={{ fontFamily: mono }}>&rarr;</span></span>
                      <span style={{ fontFamily: mono, fontSize: 12, color: "#9a9286" }}>잠자리연구소 · {fmtDate(featured.createdAt)}{featured.readMin ? ` · 읽기 ${featured.readMin}분` : ""}</span>
                    </div>
                  </div>
                  <FeaturedImageSlot cornerKey={featured.corner} image={featured.image} title={featured.title} />
                </Link>
              </section>
            )}

            {rows.length > 0 && (
              <section className="mz-wrap" style={{ paddingTop: 14, paddingBottom: 24 }}>
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", borderTop: "1px solid rgba(22,20,15,0.16)", paddingTop: 16, marginBottom: 6 }}>
                  <span style={{ fontWeight: 800, fontSize: 18 }}>{cat ? cat.label : "수면 칼럼"}</span>
                  <span style={{ fontFamily: mono, fontSize: 11, letterSpacing: "2px", color: "#9a9286" }}>{cat ? String(list.length) + "편" : "ALL"}</span>
                </div>
                {rows.map((a, i) => {
                  const rc = sleepCategoryOf(a.slug);
                  return (
                    <Link key={a.id} href={`/magazine/${a.slug}`} className="mz-row row-link">
                      <span className="mz-row-num" style={{ fontFamily: mono, fontSize: 13, fontWeight: 600, color: "#c0b8a9" }}>{String(i + 1).padStart(2, "0")}</span>
                      <span style={{ display: "flex", alignItems: "center", gap: 9 }}>
                        <span style={{ width: 8, height: 8, borderRadius: 9999, background: "#3f5a54", flex: "none" }} />
                        <span style={{ fontFamily: mono, fontSize: 11, fontWeight: 700, color: "#3f5a54" }}>{rc?.label ?? "수면"}</span>
                      </span>
                      <span className="mz-row-title" style={{ fontFamily: serif, fontWeight: 600, fontSize: 21, letterSpacing: "-0.6px", lineHeight: 1.35, color: "#16140f" }}>{a.title}</span>
                      <span className="mz-row-go row-go" style={{ fontFamily: mono, fontSize: 16, color: "#16140f" }}>&rarr;</span>
                    </Link>
                  );
                })}
              </section>
            )}
          </>
        )}

        {/* 오늘의딜 연결 */}
        <section className="mz-wrap" style={{ paddingTop: 34, paddingBottom: 60 }}>
          <a href={MAIN} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, padding: "18px 22px", border: "1px solid #e4dccc", borderRadius: 12, background: "#faf8f5", textDecoration: "none", color: "#16140f" }}>
            <span style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.5 }}>잠자리연구소는 오늘의딜 매거진에서 독립했습니다.<br /><span style={{ fontWeight: 500, fontSize: 13.5, color: "#76726b" }}>가전·리빙·디지털 등 그 외 분야는 오늘의딜에서.</span></span>
            <span style={{ fontFamily: mono, fontSize: 13, color: "#ff5a3c", fontWeight: 700, whiteSpace: "nowrap" }}>오늘의딜 &rarr;</span>
          </a>
        </section>
      </div>

      <footer style={{ background: "#0f0e0a", color: "#8a857c" }}>
        <div className="mz-wrap" style={{ paddingTop: 26, paddingBottom: 26, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap", fontFamily: mono, fontSize: 11 }}>
          <span>잠자리연구소 · 광고 0 · 협찬 0 · 해외 논문 근거</span>
          <a href={MAIN} style={{ color: "#cdc6ba", textDecoration: "none" }}>오늘의딜 &rarr;</a>
        </div>
      </footer>
    </>
  );
}
