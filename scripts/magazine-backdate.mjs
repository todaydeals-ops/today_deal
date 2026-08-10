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

const TARGET = 65;            // 잠자리 발행 편수에 맞춘다
// 첫 슬롯 기준일. 잠자리 시작일(2025-12-30)에 맞추되 슬롯이 모자라지 않게 여유를 둔다.
// (12-29로 잡았더니 END까지 수·토 슬롯이 64칸뿐이라 65편을 못 담고 터졌다.)
const START = "2025-12-15";
const END = "2026-08-10";     // 마지막 슬롯(오늘)

const CFG = {
  pill:   { field: "건강기능식품", days: [1, 4], cats: "lib/magazine/pillCategories.ts",   name: "알약연구소" },
  beauty: { field: "뷰티·성분",   days: [3, 6], cats: "lib/magazine/beautyCategories.ts", name: "성분연구소" },
  sleep:  { field: "수면·침구",   days: [2, 5], cats: "lib/magazine/sleepCategories.ts",  name: "잠자리연구소" },
};

const which = process.argv[2];
const DRY = process.argv.includes("--dry");
const cfg = CFG[which];
if (!cfg) { console.error("사용: node backdate.mjs pill|beauty|sleep [--dry]"); process.exit(1); }

/** 슬롯 격자를 만든다.
 *
 *  기본은 END 에서 거꾸로 n칸을 세는 것이다. 편수가 목표만큼 있으면 이 방식이
 *  세 사이트의 시작일을 자연히 맞춰준다(주 2편 × 65편 = 같은 기간).
 *
 *  편수가 목표에 못 미칠 때만 START~END 전 구간에 균등 분포시킨다. 거꾸로만 세면
 *  편수가 적은 사이트의 시작일이 뒤로 밀려버린다(성분 61편일 때 2026-01-09로 밀렸다). */
function slots(n, days, startISO, endISO) {
  // 목표 편수를 채웠으면 끝에서 거꾸로 — 이게 다른 사이트와 시작일이 맞는 정본 경로다.
  if (n >= TARGET) {
    const out = [];
    const d = new Date(`${endISO}T07:00:00+09:00`);
    while (out.length < n) {
      if (days.includes(new Date(d.getTime() + 9 * 3600e3).getUTCDay())) out.push(new Date(d));
      d.setUTCDate(d.getUTCDate() - 1);
    }
    return out.reverse();
  }
  const all = [];
  const d = new Date(`${startISO}T07:00:00+09:00`);
  const end = new Date(`${endISO}T07:00:00+09:00`);
  while (d <= end) {
    if (days.includes(new Date(d.getTime() + 9 * 3600e3).getUTCDay())) all.push(new Date(d));
    d.setUTCDate(d.getUTCDate() + 1);
  }
  if (n > all.length) throw new Error(`슬롯 부족: ${startISO}~${endISO} 사이 해당 요일 ${all.length}칸인데 ${n}편이 필요하다. START를 앞으로 당겨라.`);
  if (n === all.length) return all;
  // 첫 칸과 마지막 칸은 반드시 쓰고, 나머지를 균등 간격으로 고른다.
  const out = [];
  for (let i = 0; i < n; i++) out.push(all[Math.round((i * (all.length - 1)) / (n - 1))]);
  return out;
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
const grid = slots(take, cfg.days, START, END);

console.log(`${cfg.name} — 전체 ${rows.length}편`);
console.log(`  발행 대상 ${take}편 (목표 ${TARGET}) · 리저브 유지 ${keep.length}편`);
if (take < TARGET) console.log(`  ★ ${TARGET - take}편 부족 — 콘텐츠 생성 필요`);
console.log(`  기간 ${grid[0].toISOString().slice(0, 10)} ~ ${grid[grid.length - 1].toISOString().slice(0, 10)}`);
const weeks = (grid[grid.length - 1] - grid[0]) / (7 * 86400e3);
console.log(`  밀도 주 ${(take / weeks).toFixed(1)}편 (편수가 채워지면 주 2편에 수렴)`);

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
