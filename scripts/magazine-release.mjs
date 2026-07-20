// 비축 초안 공개 — 슬러그를 받아 is_published=true + created_at=now(최신으로 노출).
// ⚠️ 공개 전 '검수 게이트' 통과 필수(분량·순한글·디자인 블록·read_min). 저품질 자동발행 방지.
// 사용: node scripts/magazine-release.mjs <slug> [slug2 ...]     (게이트 통과분만 공개)
//       node scripts/magazine-release.mjs <slug> --force         (게이트 무시 강제공개)
//       node scripts/magazine-release.mjs --list                 (비공개 초안 + 게이트 결과 나열)
//       node scripts/magazine-release.mjs --balanced [N]         (5코너 골고루, 게이트 통과분 N편)
import fs from "node:fs";
(function loadEnv() {
  try {
    const t = fs.readFileSync(`${import.meta.dirname}/../.env.local`, "utf8");
    for (const l of t.split(/\r?\n/)) { const m = l.match(/^([A-Z0-9_]+)=(.*)$/); if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].trim(); }
  } catch { /* 무시 */ }
  if (!process.env.SUPA_URL && process.env.NEXT_PUBLIC_SUPABASE_URL) process.env.SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!process.env.SUPA_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY) process.env.SUPA_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
})();
const URL = process.env.SUPA_URL, KEY = process.env.SUPA_KEY;
const H = { apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" };
const rest = (path, init = {}) => fetch(`${URL}/rest/v1/${path}`, { ...init, headers: { ...H, ...(init.headers || {}) } });

// ── 검수 게이트 ── 초기 고품질 편 기준. 하나라도 걸리면 공개 차단.
const CJK = /[㐀-䶿一-鿿Ѐ-ӿ぀-ゟ゠-ヺヽ-ヿ]/; // 한자·키릴·일본어 가나
function inspect(row) {
  const body = row.body_html || "";
  // RAIL 주석 제거 후 본문만 검사. 이미지 크레딧(사진작가 실명)에 키릴·한자가 들어가는데
  // 그건 원문 표기가 맞으므로 품질 검사 대상이 아니다.
  const bodyOnly = body.replace(/<!--[\s\S]*?-->/g, "");
  const plain = bodyOnly.replace(/<[^>]+>/g, "").trim().length;
  const reasons = [];
  if ((row.read_min || 0) < 7) reasons.push(`read_min<7(${row.read_min ?? 0})`);
  if (plain < 1200) reasons.push(`본문<1200자(${plain})`);
  if (CJK.test(bodyOnly)) reasons.push("한자·외국문자 혼입");
  // 디자인 블록: 의사결정트리(DTREE) / 표(TABLE·VS) / 번호목록(NUMLIST) 중 하나는 있어야
  const hasDesign = /DECISION TREE/.test(body) || /grid-template-columns/.test(body) || /rgba\(22,20,15,0\.12\)/.test(body);
  if (!hasDesign) reasons.push("디자인블록(표·의사결정트리·번호목록) 없음");
  return { ok: reasons.length === 0, reasons, plain };
}
async function fetchRow(slug) {
  const r = await rest(`magazine?slug=eq.${encodeURIComponent(slug)}&select=slug,corner,title,read_min,body_html`);
  const rows = await r.json();
  return Array.isArray(rows) && rows[0] ? rows[0] : null;
}

const args = process.argv.slice(2);
if (args.length === 0) { console.error("slug 필요 (또는 --list / --balanced)"); process.exit(1); }

if (args[0] === "--list") {
  const r = await (await rest("magazine?is_published=eq.false&corner=neq.report&select=slug,corner,title,read_min,body_html,created_at&order=created_at.asc")).json();
  const list = Array.isArray(r) ? r : [];
  console.log(`비공개 초안 ${list.length}개 (report 제외):`);
  for (const a of list) {
    const g = inspect(a);
    console.log(`  ${g.ok ? "✅통과" : "⛔차단"} [${a.corner}] ${a.slug} — ${a.title}${g.ok ? "" : "  · " + g.reasons.join(", ")}`);
  }
  process.exit(0);
}

// 5코너 골고루 — 게이트 통과 초안만, 남은 개수 많은 코너부터 한 편씩 N편 공개.
if (args[0] === "--balanced") {
  const count = Math.max(1, Number(args[1]) || 1);
  const r = await (await rest("magazine?is_published=eq.false&corner=neq.report&select=slug,corner,title,read_min,body_html,created_at&order=created_at.asc")).json();
  const byCorner = {};
  let blocked = 0;
  for (const a of (Array.isArray(r) ? r : [])) {
    const g = inspect(a);
    if (!g.ok) { blocked++; console.log(`  ⛔ 게이트 차단 [${a.corner}] ${a.slug} — ${g.reasons.join(", ")}`); continue; }
    (byCorner[a.corner] ||= []).push(a);
  }
  const picked = [];
  for (let i = 0; i < count; i++) {
    let best = null;
    for (const c of Object.keys(byCorner)) if (byCorner[c].length && (best === null || byCorner[c].length > byCorner[best].length)) best = c;
    if (best === null) break;
    picked.push(byCorner[best].shift());
  }
  let m = 0;
  for (let i = 0; i < picked.length; i++) {
    const a = picked[i];
    const ts = new Date(Date.now() - (picked.length - 1 - i) * 60000).toISOString(); // 공개순 = 최신
    const res = await rest(`magazine?slug=eq.${encodeURIComponent(a.slug)}`, { method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ is_published: true, created_at: ts }) });
    if (res.ok) { console.log(`공개[${a.corner}]: ${a.slug} — ${a.title}`); m++; }
  }
  console.log(`balanced released ${m}/${picked.length}  (게이트 차단 ${blocked}건)`);
  process.exit(0);
}

// 개별 공개 — 게이트 통과분만(--force로 무시 가능)
const force = args.includes("--force");
const slugs = args.filter((a) => a !== "--force");
const now = new Date().toISOString();
let n = 0;
for (const slug of slugs) {
  const row = await fetchRow(slug);
  if (!row) { console.log(`없음: ${slug}`); continue; }
  const g = inspect(row);
  if (!g.ok && !force) { console.log(`⛔ 게이트 차단: ${slug} — ${g.reasons.join(", ")}  (강제하려면 --force)`); continue; }
  const r = await rest(`magazine?slug=eq.${encodeURIComponent(slug)}`, {
    method: "PATCH", headers: { Prefer: "return=minimal" },
    body: JSON.stringify({ is_published: true, created_at: now }),
  });
  if (r.ok) { console.log(`공개${g.ok ? "" : "(강제)"}: ${slug}`); n++; } else { console.log(`실패(${r.status}): ${slug}`); }
}
console.log(`released ${n}/${slugs.length}`);
