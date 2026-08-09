// 서브 미디어 분류 등록 검사 — DB에 있는 글이 택소노미 slugs[]에 빠지지 않았는지 확인한다.
// ★빠지면 카테고리 페이지가 비고, 관련글이 오늘의딜 코너명(팩트체크 등)으로 폴백한다. 실제로 겪은 사고.
// 사용: node scripts/magazine-catcheck.mjs            검사만(누락 있으면 exit 1)
//       node scripts/magazine-catcheck.mjs --topics   미등록분을 topics 계획서에서 찾아 어느 분류인지 제안
import fs from "node:fs";
(function loadEnv() {
  try { const t = fs.readFileSync(`${import.meta.dirname}/../.env.local`, "utf8");
    for (const l of t.split(/\r?\n/)) { const m = l.match(/^([A-Z0-9_]+)=(.*)$/); if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].trim(); } } catch {}
})();
const SUPA = process.env.NEXT_PUBLIC_SUPABASE_URL, KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPA || !KEY) { console.error("SUPA env 필요"); process.exit(1); }
const H = { apikey: KEY, Authorization: `Bearer ${KEY}` };

// 서브 미디어별 field ↔ 택소노미 파일
const MEDIA = [
  { name: "잠자리연구소", field: "수면·침구", file: "lib/magazine/sleepCategories.ts", topics: [".work/goodsleep-batch2/topics.json", ".work/goodsleep-batch3/topics.json"] },
  { name: "알약연구소", field: "건강기능식품", file: "lib/magazine/pillCategories.ts", topics: [".work/pill-batch/topics-92.json"] },
  { name: "성분연구소", field: "뷰티·성분", file: "lib/magazine/beautyCategories.ts", topics: [".work/beauty-batch/topics.json"] },
];

const WANT_TOPICS = process.argv.includes("--topics");
let bad = 0;

for (const m of MEDIA) {
  const path = `${import.meta.dirname}/../${m.file}`;
  if (!fs.existsSync(path)) { console.log(`- ${m.name}: 택소노미 파일 없음(미신설) — 건너뜀`); continue; }
  const src = fs.readFileSync(path, "utf8");
  // slugs: [...] 안의 문자열만 추출
  const registered = new Set();
  for (const blk of src.match(/slugs:\s*\[[^\]]*\]/g) || []) {
    for (const s of blk.match(/"[^"]+"/g) || []) registered.add(s.slice(1, -1));
  }

  const r = await fetch(`${SUPA}/rest/v1/magazine?field=eq.${encodeURIComponent(m.field)}&select=slug,is_published`, { headers: H });
  const rows = await r.json();
  if (!Array.isArray(rows)) { console.error(`✗ ${m.name}: DB 조회 실패`); bad++; continue; }

  const missing = rows.filter((x) => !registered.has(x.slug)).map((x) => x.slug);
  const orphan = [...registered].filter((s) => !rows.some((x) => x.slug === s));

  const mark = missing.length ? "✗" : "✓";
  console.log(`${mark} ${m.name}: DB ${rows.length}편 · 등록 ${registered.size} · 미등록 ${missing.length}${orphan.length ? ` · DB에 없는 등록분 ${orphan.length}` : ""}`);
  if (missing.length) {
    bad++;
    // topics 계획서에서 분류(cat) 찾아 제안
    const catOf = {};
    if (WANT_TOPICS) {
      for (const tf of m.topics) {
        const p = `${import.meta.dirname}/../${tf}`;
        if (!fs.existsSync(p)) continue;
        try { for (const t of JSON.parse(fs.readFileSync(p, "utf8")).topics || []) catOf[t.slug] = t.cat; } catch {}
      }
    }
    for (const s of missing) console.log(`    미등록: ${s}${catOf[s] ? `  → cat="${catOf[s]}"` : ""}`);
  }
  if (orphan.length) for (const s of orphan) console.log(`    (DB에 없음: ${s})`);
}

if (bad) {
  console.log("\n★미등록 글은 카테고리 페이지에 안 나오고 관련글이 오늘의딜 코너명으로 폴백합니다. 택소노미 slugs[]에 추가하세요.");
  process.exit(1);
}
console.log("\n모든 서브 미디어 분류 등록 정상.");
