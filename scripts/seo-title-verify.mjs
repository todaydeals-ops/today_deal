// 아티클 검색결과 제목(seoTitle) 검증 — .claude/agents/seo-titler.md 의 금지 규칙을 기계로 잡는다.
// 사용: node scripts/seo-title-verify.mjs 03        (.work/seo-titles/batch-03.json ↔ out-03.json)
//       node scripts/seo-title-verify.mjs --final   (content/magazine-seo-titles.json 전체)
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const W = path.join(ROOT, ".work", "seo-titles");

const BAN = [
  [/추천|BEST|베스트|순위|TOP\s?\d/i, "추천·순위형(중립 매체)"],
  [/정말|진짜|과연|사실일까|믿어도|허와 ?실|진위/, "의심제기형"],
  // "사기"는 속임 뜻일 때만 — "사기 전에"(구매 전)까지 막으면 좋은 검색어를 잃는다(10-20 오탐)
  [/효과\s*(?:가\s*)?없|돈 ?낭비|과대 ?광고|속지 마|사기(?:다|꾼|극|입니다|였)/, "부정 단정"],
  [/—/, "em-dash"],
  [/충격|무조건|꼭 보세요|역대급|대박/, "낚시어"],
];
// 앞머리가 원래 글과 같은 대상인지 — 흔한 말을 뺀 2글자 이상 토큰이 하나라도 겹쳐야 한다.
// 흔한 말까지 세면 "다른·있는" 같은 단어로 엉뚱한 주제도 통과한다(10-20 시험에서 잡힘).
const STOP = new Set("다른 있는 하는 위한 어떤 무엇 어떻게 언제 정리 방법 이유 기준 경우 확인 먼저 정말 진짜 그리고 하나 우리 가이드 완전정리 총정리 차이 효과 고르는 고르기 알아보기 체크 셀프체크 자가점검 점검 해결 순서 부터 까지 에서 으로 이것 그것 수도 있다 없다 될까 할까 일까 인가".split(" "));
const tokens = (s) => new Set((s || "").toLowerCase().replace(/[^0-9a-z가-힣\s]/g, " ").split(/\s+/).filter((t) => t.length >= 2 && !STOP.has(t)));
const overlap = (a, b) => { const B = tokens(b); for (const t of tokens(a)) for (const u of B) if (t.includes(u) || u.includes(t)) return true; return false; };

function check(items, out, label) {
  let bad = 0, withQ = 0;
  const seen = new Map();
  for (const it of items) {
    const t = out[it.slug];
    const errs = [];
    if (typeof t !== "string" || !t.trim()) errs.push("없음");
    else {
      if (t.length < 18 || t.length > 38) errs.push(`길이 ${t.length}(18~38)`);
      for (const [re, why] of BAN) if (re.test(t)) errs.push(why);
      if (/\|/.test(t) || /연구소$|매거진$/.test(t)) errs.push("브랜드 표기 금지(시스템이 붙인다)");
      const head = t.split(/[,?]/)[0];
      // 제목 전체로 본다 — 앞머리만 보면 "아파서→통증" 같은 동의어 바꿈을 주제 이탈로 오판한다
      if (!overlap(t, `${it.title} ${(it.tags || []).join(" ")} ${(it.gscQueries || []).map((q) => q.q).join(" ")}`)) errs.push("원래 제목·태그·검색어와 대상이 다름");
      if (/20\d\d/.test(t) && !/20\d\d/.test(`${it.title} ${it.subtitle} ${it.excerpt}`)) errs.push("근거 없는 연도");
      if (seen.has(t)) errs.push(`중복(${seen.get(t)})`);
      seen.set(t, it.slug);
      if (it.gscQueries?.length && overlap(head, it.gscQueries.map((q) => q.q).join(" "))) withQ++;
    }
    if (errs.length) { bad++; console.log(`✗ ${it.slug}: ${t ?? "-"}  ← ${errs.join(" · ")}`); }
  }
  console.log(`${label}: ${items.length - bad}/${items.length} 통과 · 검색어 반영 ${withQ}/${items.filter((x) => x.gscQueries?.length).length}`);
  return bad;
}

const arg = process.argv[2];
if (arg === "--final") {
  const all = fs.readdirSync(W).filter((f) => /^batch-\d+\.json$/.test(f)).flatMap((f) => JSON.parse(fs.readFileSync(path.join(W, f), "utf8")));
  const final = JSON.parse(fs.readFileSync(path.join(ROOT, "content", "magazine-seo-titles.json"), "utf8")).titles;
  process.exit(check(all.filter((x) => final[x.slug] !== undefined), final, "최종") ? 1 : 0);
}
const n = String(arg || "").padStart(2, "0");
const items = JSON.parse(fs.readFileSync(path.join(W, `batch-${n}.json`), "utf8"));
const out = JSON.parse(fs.readFileSync(path.join(W, `out-${n}.json`), "utf8"));
process.exit(check(items, out, `배치 ${n}`) ? 1 : 0);
