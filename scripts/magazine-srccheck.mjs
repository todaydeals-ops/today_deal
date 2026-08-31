// 원고 sources[].url이 근거 파일(content/research/facts)에 실재하는 URL인지 대조한다.
//
// 집필 에이전트(magazine-writer)는 웹 접근이 없다. 그런데 실측상 "실재 확인된 URL로
// 대체했다"고 보고하는 일이 있었다. 확인할 방법이 없는 주장이라 기계로 대조한다.
// 근거 파일에 없는 URL = 집필자가 지어냈을 가능성 → 적재 전에 반드시 사람이 확인.
//
//   node scripts/magazine-srccheck.mjs .work/pill-batch/*.json
//
// ※ URL에 괄호가 들어가는 출처(Elsevier의 S1051-2276(26)00082-8 등)가 있어
//   추출 정규식에서 괄호를 제외하면 오탐이 난다. 실제로 한 번 겪었다.
//
// ※ 세미콜론도 제외한다. 근거 파일 28건이 한 source_url 필드에 URL 두 개를
//   "a; b" 로 붙여 넣고 있어서(스키마상 원래 하나여야 한다), 세미콜론을 URL 문자로
//   취급하면 앞 URL이 "…08003;" 로 수집돼 원고의 정상 URL과 대조가 어긋난다.
//   실제로 초록입홍합 편이 이 이유로 "지어낸 URL"로 잘못 잡혔다(2026-09-01).
//   세미콜론을 끊으면 뒤쪽 URL도 따로 수집돼 둘 다 대조된다.
import fs from "node:fs";
import path from "node:path";

const FACTS = path.join(process.cwd(), "content/research/facts");
const URL_RE = /https?:\/\/[^"'\s\\;]+/g;
const norm = (u) => (u || "").replace(/[);,.]+$/, "").replace(/\/$/, "");

const pool = new Set();
for (const f of fs.readdirSync(FACTS)) {
  const s = fs.readFileSync(path.join(FACTS, f), "utf8");
  for (const m of s.matchAll(URL_RE)) pool.add(norm(m[0]));
}
console.log(`근거 파일 내 실재 URL ${pool.size}개\n`);

let bad = 0, total = 0;
for (const file of process.argv.slice(2)) {
  const arts = JSON.parse(fs.readFileSync(file, "utf8")).articles || [];
  for (const a of arts) {
    for (const s of a.sources || []) {
      total++;
      if (!pool.has(norm(s.url))) { console.log(`  ✗ [${a.slug}] ${s.url}`); bad++; }
    }
  }
}
console.log(bad ? `\n대조 ${total}건 중 ${bad}건이 근거 파일에 없음 — 확인 필요` : `\n대조 ${total}건 전부 근거 파일에 실재`);
