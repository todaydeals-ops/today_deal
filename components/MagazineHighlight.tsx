import Link from "next/link";
import { fetchMagazineList } from "@/lib/data/magazine";
import { cornerOf, CATCH } from "@/lib/magazine/corners";

const mono = "'JetBrains Mono', monospace";
const serif = "'Noto Serif KR', serif";

// 홈 히어로 = 매거진 정체성(슬로건·중립) + 피처드 1 + 최신 6. 콘텐츠가 히어로 역할.
export default async function MagazineHighlight() {
  const list = await fetchMagazineList({ limit: 7 });
  if (!list.length) return null;
  const [feat, ...rest] = list;
  const fc = cornerOf(feat.corner);
  const [hiPre, hiPost] = CATCH.media.tail.split(CATCH.media.hi);

  return (
    <section aria-label="오늘의딜 매거진" style={{ margin: "10px 0 46px" }}>
      {/* 정체성 히어로 박스 */}
      <div style={{ background: "#16140f", borderRadius: 18, padding: "clamp(28px, 4vw, 44px)", marginBottom: 22 }}>
        <div style={{ fontFamily: mono, fontSize: 11.5, letterSpacing: "1px", color: "#ff8a6f", fontWeight: 700 }}>
          오늘의딜 매거진 · 광고·제휴 없는 중립 쇼핑 가이드
        </div>
        <h1 style={{ fontFamily: serif, fontSize: "clamp(25px, 3.6vw, 38px)", fontWeight: 700, lineHeight: 1.38, letterSpacing: "-0.6px", color: "#f3efe9", margin: "16px 0 0", maxWidth: 740, textWrap: "balance" }}>
          {CATCH.media.lead}
          <br />
          {hiPre}
          <span style={{ color: "#ff8a6f" }}>{CATCH.media.hi}</span>
          {hiPost}
        </h1>
        <Link href="/magazine" style={{ display: "inline-block", marginTop: 24, fontSize: 14, fontWeight: 700, color: "#16140f", background: "#ff5a3c", padding: "11px 20px", borderRadius: 9, textDecoration: "none" }}>
          매거진 전체 보기 →
        </Link>
      </div>

      {/* 피처드 (대표 가이드) */}
      <Link href={`/magazine/${feat.slug}`} style={{ display: "flex", flexWrap: "wrap", gap: 0, textDecoration: "none", border: "1px solid var(--border-soft)", borderRadius: 16, overflow: "hidden", background: "var(--bg-surface)", marginBottom: 18 }}>
        <div style={{ flex: "1 1 300px", minHeight: 210, background: "#ece5d9", position: "relative" }}>
          {feat.image?.url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={feat.image.url} alt={feat.title} loading="lazy" decoding="async" style={{ width: "100%", height: "100%", objectFit: "cover", position: "absolute", inset: 0 }} />
          )}
        </div>
        <div style={{ flex: "2 1 340px", padding: "26px 28px" }}>
          <div style={{ fontFamily: mono, fontSize: 11, fontWeight: 700, letterSpacing: ".5px", color: fc.color }}>{fc.name}</div>
          <div style={{ fontFamily: serif, fontSize: 27, fontWeight: 700, lineHeight: 1.3, letterSpacing: "-0.6px", color: "var(--text-strong)", margin: "12px 0 0" }}>{feat.title}</div>
          {feat.excerpt && <p style={{ fontSize: 15, lineHeight: 1.75, color: "var(--text-body)", margin: "14px 0 0", maxWidth: 500 }}>{feat.excerpt}</p>}
          <span style={{ display: "inline-block", marginTop: 18, fontSize: 13.5, fontWeight: 700, color: "var(--text-strong)", borderBottom: "2px solid var(--accent-deal)", paddingBottom: 2 }}>가이드 읽기 →</span>
        </div>
      </Link>

      {/* 최신 가이드 그리드 */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))", gap: 16 }}>
        {rest.map((a) => {
          const cc = cornerOf(a.corner);
          return (
            <Link key={a.id} href={`/magazine/${a.slug}`} style={{ textDecoration: "none", border: "1px solid var(--border-soft)", borderRadius: 12, overflow: "hidden", background: "var(--bg-surface)", display: "flex", flexDirection: "column" }}>
              <div style={{ aspectRatio: "16 / 10", background: "#ece5d9", position: "relative" }}>
                {a.image?.url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={a.image.url} alt={a.title} loading="lazy" decoding="async" style={{ width: "100%", height: "100%", objectFit: "cover", position: "absolute", inset: 0 }} />
                )}
              </div>
              <div style={{ padding: "12px 14px 16px" }}>
                <div style={{ fontFamily: mono, fontSize: 10.5, fontWeight: 700, color: cc.color }}>{cc.name}</div>
                <div style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.42, color: "var(--text-strong)", margin: "6px 0 0" }}>{a.title}</div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
