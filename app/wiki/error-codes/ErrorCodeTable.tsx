"use client";
// 에러코드 사전 표 + 코드 검색. 서버가 전체 행을 그려 넘기므로(SSR) 검색엔진은 전부 읽고,
// 사람은 코드("UE", "03")나 브랜드로 걸러 본다.
import { useMemo, useState } from "react";

export interface CodeRow { group: string; brand: string; product: string; codes: string[]; title: string; href: string }

const norm = (s: string) => s.toLowerCase().replace(/\s+/g, "");

export default function ErrorCodeTable({ rows, groups }: { rows: CodeRow[]; groups: string[] }) {
  const [q, setQ] = useState("");
  const shown = useMemo(() => {
    const k = norm(q);
    if (!k) return rows;
    return rows.filter((r) => norm([r.brand, r.product, r.title, ...r.codes].join(" ")).includes(k) || r.codes.some((c) => norm(c) === k));
  }, [q, rows]);

  return (
    <div>
      <input
        className="wk-search"
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="화면에 뜬 코드나 브랜드를 넣어 보세요 · 예: UE, 4C, 03, 린나이"
        aria-label="에러코드 검색"
      />
      {q && <p style={{ fontSize: 14, color: "#76726b", margin: "10px 0 0" }}>{shown.length ? `${shown.length}건` : "맞는 코드가 아직 없어요. 브랜드 이름으로 다시 찾아보거나 아래 분류에서 제품을 골라 보세요."}</p>}
      {groups.map((g) => {
        const list = shown.filter((r) => r.group === g);
        if (!list.length) return null;
        return (
          <section key={g} className="wk-sec">
            <div className="wk-sec-h"><h2>{g}</h2><span>{list.length}개 제품</span></div>
            <div className="wk-tablewrap">
              <table className="wk-table">
                <thead><tr><th>브랜드·제품</th><th>대표 코드</th><th>뜻과 셀프 조치</th></tr></thead>
                <tbody>
                  {list.map((r) => (
                    <tr key={r.href}>
                      <td><b>{r.brand}</b> {r.product}</td>
                      <td>{r.codes.length ? r.codes.join(" · ") : "코드별 안내"}</td>
                      <td><a href={r.href} style={{ color: "#16140f" }}>{r.title}</a></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        );
      })}
    </div>
  );
}
