// 서브 미디어 발행분을 잠자리연구소와 같은 밀도로 맞춘다.
//
// 잠자리: 65편 · 2025-12-30 ~ 2026-08-06 · 주 2편(화·금)
// 알약·성분도 65편이 되도록 리저브에서 끌어올리고, created_at 을 각자 요일 격자에
// 소급 배치한다. 오래된 슬롯부터 채우되 분류가 뭉치지 않게 라운드로빈으로 섞는다.
//
//   node backdate.mjs pill  --dry     알약 미리보기
//   node backdate.mjs pill            실제 적용
import fs from "node:fs";

const env = fs.readFileSync(".env.local", "utf8");
for (const l of env.split(/\r?\n/)) { const m = l.match(/^([A-Z0-9_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim(); }
const S = process.env.NEXT_PUBLIC_SUPABASE_URL, K = process.env.SUPABASE_SERVICE_ROLE_KEY;
const H = { apikey: K, Authorization: `Bearer ${K}`, "Content-Type": "application/json" };

const TARGET = 65;          // 잠자리 발행 편수에 맞춘다
const END = "2026-08-10";   // 마지막 슬롯(오늘)

const CFG = {
  pill:   { field: "건강기능식품", days: [1, 4], cats: "lib/magazine/pillCategories.ts",   name: "알약연구소" },
  beauty: { field: "뷰티·성분",   days: [3, 6], cats: "lib/magazine/beautyCategories.ts", name: "성분연구소" },
  sleep:  { field: "수면·침구",   days: [2, 5], cats: "lib/magazine/sleepCategories.ts",  name: "잠자리연구소" },
};

const which = process.argv[2];
const DRY = process.argv.includes("--dry");
const cfg = CFG[which];
if (!cfg) { console.error("사용: node backdate.mjs pill|beauty|sleep [--dry]"); process.exit(1); }

/** END 에서 거꾸로 세어 해당 요일 슬롯 n개를 만든다(과거→현재 순으로 반환). */
function slots(n, days, endISO) {
  const out = [];
  const d = new Date(`${endISO}T07:00:00+09:00`);
  while (out.length < n) {
    if (days.includes(new Date(d.getTime() + 9 * 3600e3).getUTCDay())) out.push(new Date(d));
    d.setUTCDate(d.getUTCDate() - 1);
  }
  return out.reverse();
}

/** 택소노미 파일에서 slug → 분류키 맵을 만든다(라운드로빈 섞기에 쓴다). */
function catMap(file) {
  const src = fs.readFileSync(file, "utf8");
  const m = {};
  for (const blk of src.matchAll(/key:\s*"(\w+)"[\s\S]*?slugs:\s*\[([^\]]*)\]/g)) {
    for (const s of blk[2].match(/"[^"]+"/g) || []) m[s.slice(1, -1)] = blk[1];
  }
  return m;
}

const r = await fetch(`${S}/rest/v1/magazine?field=eq.${encodeURIComponent(cfg.field)}&select=slug,title,is_published,created_at&order=created_at.asc`, { headers: H });
const rows = await r.json();
const cm = catMap(cfg.cats);

// 분류별로 나눈 뒤 라운드로빈으로 뽑아 순서를 만든다 — 같은 분류가 연달아 나가지 않게.
const byCat = {};
for (const a of rows) (byCat[cm[a.slug] ?? "기타"] ||= []).push(a);
const keys = Object.keys(byCat);
const ordered = [];
for (let i = 0; ordered.length < rows.length; i++) {
  for (const k of keys) if (byCat[k][i]) ordered.push(byCat[k][i]);
}

const take = Math.min(TARGET, ordered.length);
const pub = ordered.slice(0, take);           // 발행할 것
const keep = ordered.slice(take);             // 리저브로 남길 것
const grid = slots(take, cfg.days, END);

console.log(`${cfg.name} — 전체 ${rows.length}편`);
console.log(`  발행 대상 ${take}편 (목표 ${TARGET}) · 리저브 유지 ${keep.length}편`);
if (take < TARGET) console.log(`  ★ ${TARGET - take}편 부족 — 콘텐츠 생성 필요`);
console.log(`  기간 ${grid[0].toISOString().slice(0, 10)} ~ ${grid[grid.length - 1].toISOString().slice(0, 10)}`);

let done = 0, fail = 0;
for (let i = 0; i < pub.length; i++) {
  const a = pub[i], when = grid[i].toISOString();
  if (DRY) { if (i < 3 || i > pub.length - 3) console.log(`   ${when.slice(0, 10)}  [${cm[a.slug] ?? "-"}] ${a.slug}`); continue; }
  const up = await fetch(`${S}/rest/v1/magazine?slug=eq.${encodeURIComponent(a.slug)}`, {
    method: "PATCH", headers: { ...H, Prefer: "return=minimal" },
    body: JSON.stringify({ is_published: true, created_at: when }),
  });
  up.ok ? done++ : (fail++, console.log(`   ✖ ${a.slug} ${up.status}`));
}
// 남는 것은 리저브로 되돌린다(이미 발행된 게 목표를 넘어설 때)
if (!DRY) for (const a of keep) {
  if (!a.is_published) continue;
  const up = await fetch(`${S}/rest/v1/magazine?slug=eq.${encodeURIComponent(a.slug)}`, {
    method: "PATCH", headers: { ...H, Prefer: "return=minimal" }, body: JSON.stringify({ is_published: false }),
  });
  if (up.ok) console.log(`   ↩ 리저브로 되돌림: ${a.slug}`);
}
console.log(DRY ? "\n(dry run — 반영 안 함)" : `\n적용 ${done}편 · 실패 ${fail}`);
