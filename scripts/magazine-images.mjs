// 매거진 대표 이미지 수집 — slug 키워드로 Pexels(우선)·Openverse(fallback) 검색 → RAIL 주석에 image 저장.
// 이미 image 있는 글은 스킵(고정/캐시). 무료·상업이용·중립 스톡. 크레딧 자동 표기.
// 사용: node scripts/magazine-images.mjs [--dry] [--force] [--limit N]
import fs from "node:fs";
(function loadEnv() {
  try {
    const t = fs.readFileSync(`${import.meta.dirname}/../.env.local`, "utf8");
    for (const l of t.split(/\r?\n/)) { const m = l.match(/^([A-Z0-9_]+)=(.*)$/); if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].trim(); }
  } catch {}
})();
const S = process.env.NEXT_PUBLIC_SUPABASE_URL, K = process.env.SUPABASE_SERVICE_ROLE_KEY;
const PEX = process.env.PEXELS_API_KEY;
const H = { apikey: K, Authorization: `Bearer ${K}`, "Content-Type": "application/json" };
const rest = (p, i = {}) => fetch(`${S}/rest/v1/${p}`, { ...i, headers: { ...H, ...(i.headers || {}) } });
const UA = { "User-Agent": "todaydeals-magazine/1.0 (hello@todaydeals.co.kr)" };

const DRY = process.argv.includes("--dry");
const FORCE = process.argv.includes("--force");
const LIMIT = Number(process.argv.find((a) => a.startsWith("--limit="))?.split("=")[1] || 0);

// slug → 영어 검색 키워드 (접미사·수식어 제거 후 핵심 명사 1~2개)
const DROP = new Set(["guide", "fact", "factcheck", "check", "compare", "trend", "longrun", "care", "vs", "buying", "types", "type", "dosage", "size", "capacity", "999", "refresh", "self", "maintenance", "sweetener", "safety", "organic", "inbody", "worth", "it", "direct", "tank", "dose", "absorption", "999", "ratio"]);
function keyword(slug) {
  const parts = slug.split("-").filter((w) => !DROP.has(w));
  return parts.slice(0, 2).join(" ").trim() || parts[0] || slug;
}
const hash = (s) => [...s].reduce((a, c) => a + c.charCodeAt(0), 0);

async function pexels(q, page) {
  const r = await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(q)}&page=${page}&per_page=5&orientation=landscape`, { headers: { Authorization: PEX } });
  if (!r.ok) return null;
  const j = await r.json();
  const p = (j.photos || [])[0];
  if (!p) return null;
  return { url: p.src.large, credit: p.photographer, source: "Pexels", link: p.url };
}
async function openverse(q, page) {
  const r = await fetch(`https://api.openverse.org/v1/images/?q=${encodeURIComponent(q)}&page=${page}&page_size=3&license_type=commercial,modification`, { headers: UA });
  if (!r.ok) return null;
  const j = await r.json();
  const x = (j.results || [])[0];
  if (!x) return null;
  return { url: x.thumbnail || x.url, credit: x.creator || "Unknown", source: `Openverse · ${x.license}`, link: x.foreign_landing_url };
}

function railGet(bodyHtml) {
  const m = (bodyHtml || "").match(/^\s*<!--RAIL:([\s\S]*?)-->\s*/);
  if (!m) return { rail: {}, rest: bodyHtml || "" };
  let rail = {}; try { rail = JSON.parse(m[1]); } catch {}
  return { rail, rest: (bodyHtml || "").slice(m[0].length) };
}
function railSet(bodyHtml, image) {
  const { rail, rest } = railGet(bodyHtml);
  rail.image = image;
  return `<!--RAIL:${JSON.stringify(rail)}-->\n` + rest.trim();
}

const rows = await (await rest("magazine?corner=neq.report&select=slug,corner,field,title,body_html&order=created_at.desc&limit=1000")).json();
let done = 0, skip = 0, fail = 0, n = 0;
for (const row of rows) {
  if (LIMIT && n >= LIMIT) break;
  const { rail } = railGet(row.body_html);
  if (rail.image?.url && !FORCE) { skip++; continue; }
  n++;
  const kw = keyword(row.slug);
  const page = (hash(row.slug) % 3) + 1;
  let img = null;
  try { img = await pexels(kw, page); } catch {}
  if (!img) { try { img = await openverse(kw, page); } catch {} }
  if (!img) { console.log(`  ✖ [${row.slug}] "${kw}" 이미지 없음`); fail++; continue; }
  console.log(`  ✓ [${row.slug}] "${kw}" → ${img.source} · ${img.credit}\n      ${img.url}`);
  if (!DRY) {
    const body_html = railSet(row.body_html, img);
    const up = await rest(`magazine?slug=eq.${encodeURIComponent(row.slug)}`, { method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ body_html }) });
    if (up.ok) done++; else { console.log(`      PATCH 실패 ${up.status}`); fail++; }
  } else done++;
  await new Promise((r) => setTimeout(r, 250)); // rate 보호
}
console.log(`\n[magazine-images] ${DRY ? "DRY " : ""}수집 ${done} · 스킵(이미있음) ${skip} · 실패 ${fail}`);
