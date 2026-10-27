// 생활백과 후보 주제의 수요 실측 — 네이버 지식iN·블로그 문서 수(누적, 추정 지표). 무료 검색 API(fleet research).
// 사용: node scripts/wiki-demand.mjs        → content/research/wave/demand.json 에 저장(이미 잰 키워드는 건너뜀)
// ★지식iN 총 문서 수 = 묻는 사람의 규모, 블로그 총 문서 수 = 경쟁 콘텐츠의 규모. 정확한 검색량이 아니라 상대 비교용이다.
// ★완만하게 부른다(요청 사이 0.35초).
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { pathToFileURL } from "node:url";

const ROOT = path.resolve(import.meta.dirname, "..");
const OUT = path.join(ROOT, "content", "research", "wave", "demand.json");
const CAND = path.join(ROOT, "content", "research", "wave", "candidates.txt");
const { research, researchKin } = await import(pathToFileURL(path.join(os.homedir(), ".claude", "fleet.mjs")).href);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const cands = fs.readFileSync(CAND, "utf8").split(/\r?\n/).filter((l) => l && !l.startsWith("#")).map((l) => { const [w, t, g, slug, title, kw] = l.split("|"); return { slug, title, kw }; });
const done = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, "utf8")) : {};
let n = 0;
for (const c of cands) {
  if (done[c.slug]) continue;
  try {
    const k = await researchKin(c.kw, { display: 1 }); await sleep(350);
    const b = await research(c.kw, { display: 1 }); await sleep(350);
    done[c.slug] = { kw: c.kw, kin: k.total, blog: b.total };
    n++;
  } catch (e) { console.log(`✗ ${c.slug} ${e.message.slice(0, 60)}`); }
  if (n % 20 === 0) fs.writeFileSync(OUT, JSON.stringify(done, null, 1));
}
fs.writeFileSync(OUT, JSON.stringify(done, null, 1));
const rows = Object.entries(done).sort((a, b) => b[1].kin - a[1].kin);
console.log(`측정 ${n}개(누계 ${rows.length}). 지식iN 상위 8: ` + rows.slice(0, 8).map(([s, v]) => `${s} ${v.kin.toLocaleString()}`).join(" · "));
console.log(`하위 12: ` + rows.slice(-12).map(([s, v]) => `${s} ${v.kin.toLocaleString()}`).join(" · "));
