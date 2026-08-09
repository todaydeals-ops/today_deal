// 알약연구소 6분류 인덱스 — 잠자리연구소 SleepCategoryIndex와 같은 카드 틀(번호·점·제목·영문·설명).
// ★링크는 SUB_ORIGIN 절대 URL로 통일.
import { PILL_CATEGORIES } from "@/lib/magazine/pillCategories";
import { pillHref } from "@/lib/magazine/subdomain";

const mono = "'Pretendard', -apple-system, BlinkMacSystemFont, sans-serif";

export default async function PillCategoryIndex() {
  return (
    <section className="mz-wrap" style={{ paddingTop: 34 }}>
      {/* 알약연구소만 7분류(성분 6 + 기초·가이드 1) — 그리드 열 수를 변수로 넘긴다 */}
      <div className="sleep-cat-index" style={{ "--cat-cols": 7, "--cat-cols-md": 4 } as React.CSSProperties}>
        {PILL_CATEGORIES.map((c, i) => (
          <a key={c.key} className="corner-cell" href={pillHref(c.key)}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span className="cc-n" style={{ fontFamily: mono, fontSize: 11, fontWeight: 600, color: "#9a9286" }}>{String(i + 1).padStart(2, "0")}</span>
              <span style={{ width: 9, height: 9, borderRadius: 9999, background: c.color }} />
            </div>
            <div className="cc-t" style={{ fontWeight: 800, fontSize: 16, marginTop: 14 }}>{c.label}</div>
            <div className="cc-en" style={{ fontFamily: mono, fontSize: 9.5, letterSpacing: "1px", color: c.color, marginTop: 2 }}>{c.en}</div>
            <div className="cc-d" style={{ fontSize: 11.5, color: "#76726b", lineHeight: 1.5, marginTop: 9 }}>{c.angle}</div>
          </a>
        ))}
      </div>
    </section>
  );
}
