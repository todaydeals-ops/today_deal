// 비축 초안을 '과거 날짜로 분산' 공개 — 하루에 수십 편이 한꺼번에 뜨는 걸 막는다.
// 자동발행과 같은 배분(하루 = AS셀프체크 1편 + 나머지 3코너 1편)을 과거 N일에 거꾸로 깔아준다.
// 사용: node scripts/magazine-backfill-release.mjs [일수] [--dry]
//   예) node scripts/magazine-backfill-release.mjs 20        → 어제부터 20일간 하루 2편씩 40편 공개
//       node scripts/magazine-backfill-release.mjs 20 --dry  → 무엇이 언제로 잡히는지만 출력
import fs from "node:fs";
(function loadEnv() {
  try {
    const t = fs.readFileSync(`${import.meta.dirname}/../.env.local`, "utf8");
    for (const l of t.split(/\r?\n/)) { const m = l.match(/^([A-Z0-9_]+)=(.*)$/); if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].trim(); }
  } catch { /* 무시 */ }
  if (!process.env.SUPA_URL && process.env.NEXT_PUBLIC_SUPABASE_URL) process.env.SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!process.env.SUPA_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY) process.env.SUPA_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
})();
const SB = process.env.SUPA_URL, KEY = process.env.SUPA_KEY;
const H = { apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" };
const rest = (path, init = {}) => fetch(`${SB}/rest/v1/${path}`, { ...init, headers: { ...H, ...(init.headers || {}) } });

// 검수 게이트 — magazine-release.mjs와 동일 기준(RAIL 주석 제외 후 본문만 검사)
const CJK = /[㐀-䶿一-鿿Ѐ-ӿ぀-ゟ゠-ヺヽ-ヿ]/;
function inspect(row) {
  const bodyOnly = (row.body_html || "").replace(/<!--[\s\S]*?-->/g, "");
  const plain = bodyOnly.replace(/<[^>]+>/g, "").trim().length;
  const reasons = [];
  if ((row.read_min || 0) < 7) reasons.push(`read_min<7`);
  if (plain < 1200) reasons.push(`본문<1200자(${plain})`);
  if (CJK.test(bodyOnly)) reasons.push("한자·외국문자 혼입");
  const hasDesign = /DECISION TREE/.test(bodyOnly) || /grid-template-columns/.test(bodyOnly) || /rgba\(22,20,15,0\.12\)/.test(bodyOnly);
  if (!hasDesign) reasons.push("디자인블록 없음");
  return { ok: reasons.length === 0, reasons };
}

const days = Math.max(1, Number(process.argv[2]) || 20);
const dry = process.argv.includes("--dry");
const OTHERS = ["factcheck", "smartguide", "trendlab"];

const r = await (await rest("magazine?is_published=eq.false&corner=neq.report&select=slug,corner,title,read_min,body_html,created_at&order=created_at.asc")).json();
const byCorner = {};
let blocked = 0;
for (const a of (Array.isArray(r) ? r : [])) {
  const g = inspect(a);
  if (!g.ok) { blocked++; console.log(`  ⛔ 게이트 차단 [${a.corner}] ${a.slug} — ${g.reasons.join(", ")}`); continue; }
  (byCorner[a.corner] ||= []).push(a);
}
const pickFrom = (pool) => {
  const avail = pool.filter((c) => byCorner[c]?.length);
  if (!avail.length) return null;
  avail.sort((a, b) => byCorner[b].length - byCorner[a].length);
  return byCorner[avail[0]].shift() ?? null;
};
// 나머지 3코너는 순환으로 고른다. 재고 많은 순으로만 뽑으면 한 코너가 열흘씩 연속으로 깔려
// '과거에 꾸준히 발행한 것처럼' 보이지 않는다.
let rr = 0;
const pickOtherRoundRobin = () => {
  for (let i = 0; i < OTHERS.length; i++) {
    const c = OTHERS[(rr + i) % OTHERS.length];
    if (byCorner[c]?.length) { rr = (rr + i + 1) % OTHERS.length; return byCorner[c].shift(); }
  }
  return null;
};

// 어제부터 거꾸로 하루씩 — 가장 과거 날짜에 가장 오래된 초안이 가도록 뒤에서부터 채운다
const plan = [];
for (let d = days; d >= 1; d--) {
  const day = new Date(Date.now() - d * 86400_000);
  const ymd = new Date(day.getTime() + 9 * 3600_000).toISOString().slice(0, 10); // KST 기준 날짜
  const repair = pickFrom(["repair"]);
  const other = pickOtherRoundRobin() ?? pickFrom(["repair"]);
  // 실제 자동발행 시각(07:00 KST)에 가깝게, 두 편을 10분 간격으로
  if (repair) plan.push({ row: repair, at: `${ymd}T07:10:00+09:00` });
  if (other) plan.push({ row: other, at: `${ymd}T07:20:00+09:00` });
}

console.log(`\n분산 공개 계획 — ${days}일 · ${plan.length}편 (게이트 차단 ${blocked}건)`);
for (const p of plan) console.log(`  ${p.at.slice(0, 10)}  [${p.row.corner}] ${p.row.slug}`);
if (dry) { console.log("\n--dry: 실제 반영하지 않음"); process.exit(0); }

let n = 0;
for (const p of plan) {
  const res = await rest(`magazine?slug=eq.${encodeURIComponent(p.row.slug)}`, {
    method: "PATCH", headers: { Prefer: "return=minimal" },
    body: JSON.stringify({ is_published: true, created_at: new Date(p.at).toISOString() }),
  });
  if (res.ok) n++; else console.log(`실패(${res.status}): ${p.row.slug}`);
}
console.log(`\nbackfill released ${n}/${plan.length}`);
