// .work/seo-titles/out-*.json → content/magazine-seo-titles.json 로 합친다.
// 사용: node scripts/seo-title-merge.mjs   (합친 뒤 seo-title-verify --final 을 돌려 통과해야 커밋)
// 기존 파일에 있던 제목은 유지하고 out 에 있는 것만 덮어쓴다 — 새 글 몇 편만 추가할 때도 같은 도구를 쓴다.
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const W = path.join(ROOT, ".work", "seo-titles");
const F = path.join(ROOT, "content", "magazine-seo-titles.json");

const cur = JSON.parse(fs.readFileSync(F, "utf8"));
let added = 0, changed = 0;
for (const f of fs.readdirSync(W).filter((x) => /^out-\d+\.json$/.test(x)).sort()) {
  const o = JSON.parse(fs.readFileSync(path.join(W, f), "utf8"));
  for (const [slug, t] of Object.entries(o)) {
    if (typeof t !== "string" || !t.trim()) continue;
    if (!(slug in cur.titles)) added++;
    else if (cur.titles[slug] !== t) changed++;
    cur.titles[slug] = t.trim();
  }
}
cur._meta.updated = new Date(Date.now() + 9 * 3600_000).toISOString().slice(0, 10);
cur._meta.count = Object.keys(cur.titles).length;
fs.writeFileSync(F, JSON.stringify(cur, null, 2) + "\n");
console.log(`합계 ${cur._meta.count}편 · 새로 ${added} · 바뀜 ${changed} → content/magazine-seo-titles.json`);
