// AS연구소 9분류 인덱스 — 다른 서브 미디어와 같은 카드 틀(번호·점·제목·영문·설명).
// ★링크는 SUB_ORIGIN 절대 URL로 통일. 9분류라 한 줄에 다 넣으면 셀이 122px로 좁아져
//   라벨이 깨진다. 데스크톱 5열(5+4 두 줄), 태블릿 3열로 간다.
import { B4AS_CATEGORIES } from "@/lib/magazine/b4asCategories";
import { b4asHref } from "@/lib/magazine/subdomain";

const mono = "'Pretendard', -apple-system, BlinkMacSystemFont, sans-serif";

export default async function B4asCategoryIndex() {
  return (
    <section className="mz-wrap" style={{ paddingTop: 34 }}>
      <div className="sleep-cat-index" style={{ "--cat-cols": 5, "--cat-cols-md": 3 } as React.CSSProperties}>
        {B4AS_CATEGORIES.map((c, i) => (
          <a key={c.key} className="corner-cell" href={b4asHref(c.key)}>
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
