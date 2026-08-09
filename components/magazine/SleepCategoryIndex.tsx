// 잠자리연구소 6분류 인덱스 — 오늘의딜 CornerIndex와 같은 카드 틀(번호·점·제목·영문·설명).
import { SUB_ORIGIN } from "@/lib/magazine/subdomain";
import { SLEEP_CATEGORIES } from "@/lib/magazine/sleepCategories";

const mono = "'Pretendard', -apple-system, BlinkMacSystemFont, sans-serif";
const GS = SUB_ORIGIN.sleep;

export default function SleepCategoryIndex() {
  return (
    <section className="mz-wrap" style={{ paddingTop: 34 }}>
      <div className="sleep-cat-index">
        {SLEEP_CATEGORIES.map((c, i) => (
          <a key={c.key} className="corner-cell" href={`${GS}/?cat=${c.key}`}>
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
