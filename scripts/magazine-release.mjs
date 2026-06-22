// 비축 초안 공개 — 슬러그를 받아 is_published=true + created_at=now(최신으로 노출).
// 사용: node scripts/magazine-release.mjs <slug> [slug2 ...]
// 목록: node scripts/magazine-release.mjs --list          (비공개 초안 나열)
// 균형: node scripts/magazine-release.mjs --balanced [N]  (5코너 골고루 N편 공개, 기본 1)
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

const args = process.argv.slice(2);
if (args.length === 0) { console.error("slug 필요 (또는 --list)"); process.exit(1); }

if (args[0] === "--list") {
  const r = await (await rest("magazine?is_published=eq.false&select=slug,corner,title,created_at&order=created_at.asc")).json();
  console.log(`비공개 초안 ${Array.isArray(r) ? r.length : 0}개:`);
  for (const a of (Array.isArray(r) ? r : [])) console.log(`  [${a.corner}] ${a.slug} — ${a.title}`);
  process.exit(0);
}

// 5코너 골고루 — 남은 개수 가장 많은 코너부터 한 편씩 뽑아(쏠림 방지) N편 공개.
if (args[0] === "--balanced") {
  const count = Math.max(1, Number(args[1]) || 1);
  const r = await (await rest("magazine?is_published=eq.false&select=slug,corner,title,created_at&order=created_at.asc")).json();
  const byCorner = {};
  for (const a of (Array.isArray(r) ? r : [])) (byCorner[a.corner] ||= []).push(a);
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
  console.log(`balanced released ${m}/${picked.length}`);
  process.exit(0);
}

const now = new Date().toISOString();
let n = 0;
for (const slug of args) {
  const r = await rest(`magazine?slug=eq.${encodeURIComponent(slug)}`, {
    method: "PATCH", headers: { Prefer: "return=minimal" },
    body: JSON.stringify({ is_published: true, created_at: now }),
  });
  if (r.ok) { console.log(`공개: ${slug}`); n++; } else { console.log(`실패(${r.status}): ${slug}`); }
}
console.log(`released ${n}/${args.length}`);
