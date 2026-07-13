// 매거진 본문 이미지 수집 — slug 키워드로 Pexels(우선)·Openverse(fallback) 검색 → RAIL 주석 images[]에 저장.
// 글당 서로 다른 최대 2장 수집(렌더에서 글 길이에 따라 짧으면 1장·길면 2장 사용). 무료·상업이용·중립 스톡.
// 이미 images 있으면 스킵(고정/캐시). 재수집은 --force. 사용: node scripts/magazine-images.mjs [--dry] [--force] [--limit=N]
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
const ONLY = (process.argv.find((a) => a.startsWith("--slugs="))?.split("=")[1] || "").split(",").filter(Boolean); // 특정 slug만 재수집

const DROP = new Set(["guide", "fact", "factcheck", "check", "compare", "trend", "longrun", "care", "vs", "buying", "types", "type", "dosage", "size", "capacity", "999", "refresh", "self", "maintenance", "sweetener", "safety", "organic", "inbody", "worth", "it", "direct", "tank", "dose", "absorption", "ratio"]);
// 다의어·약자로 자동 키워드가 엉뚱한 이미지를 부르는 글은 수동 교정(drum=악기, msg=약자, scale=저울 등)
const KW_OVERRIDE = {
  "toploader-vs-drum-compare": "washing machine",
  "stick-vs-robot-vacuum": "vacuum cleaner",
  "induction-vs-highlight-vs-gas": "induction cooktop",
  "castiron-stainless-pan-care-longrun": "cast iron skillet",
  "msg-safety-fact": "seasoning powder",
  "smart-scale-inbody-trend": "bathroom scale",
  "open-ear-earbuds-trend": "wireless earbuds",
  "zero-drink-sweetener-fact": "soda can drink",
  "magnesium-vitamind-fact-check": "vitamin supplement pills",
  "solid-wood-furniture-care-longrun": "wooden furniture",
  "clothing-care-machine-trend": "clothes steamer",
  "smart-ring-trend": "smart ring wearable",
  "led-mask-fact": "led face mask beauty",
  "ai-speaker-trend": "smart speaker",
};
function keyword(slug) {
  if (KW_OVERRIDE[slug]) return KW_OVERRIDE[slug];
  const parts = slug.split("-").filter((w) => !DROP.has(w));
  return parts.slice(0, 2).join(" ").trim() || parts[0] || slug;
}
const hash = (s) => [...s].reduce((a, c) => a + c.charCodeAt(0), 0);

// 서로 다른 n장 균등 추출
function spread(list, n, mapper) {
  const out = [], seen = new Set();
  for (let i = 0; i < n; i++) {
    let k = Math.min(list.length - 1, Math.floor((i * list.length) / n));
    while (seen.has(k) && k < list.length) k++;
    if (k >= list.length || seen.has(k)) break;
    seen.add(k); out.push(mapper(list[k]));
  }
  return out;
}
async function pexels(q, page, n = 2) {
  const r = await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(q)}&page=${page}&per_page=15&orientation=landscape`, { headers: { Authorization: PEX } });
  if (!r.ok) return [];
  const j = await r.json();
  return spread(j.photos || [], n, (p) => ({ url: p.src.large, credit: p.photographer, source: "Pexels", link: p.url }));
}
async function openverse(q, page, n = 2) {
  const r = await fetch(`https://api.openverse.org/v1/images/?q=${encodeURIComponent(q)}&page=${page}&page_size=8&license_type=commercial,modification`, { headers: UA });
  if (!r.ok) return [];
  const j = await r.json();
  return spread(j.results || [], n, (x) => ({ url: x.thumbnail || x.url, credit: x.creator || "Unknown", source: `Openverse · ${x.license}`, link: x.foreign_landing_url }));
}

function railGet(bodyHtml) {
  const m = (bodyHtml || "").match(/^\s*<!--RAIL:([\s\S]*?)-->\s*/);
  if (!m) return { rail: {}, rest: bodyHtml || "" };
  let rail = {}; try { rail = JSON.parse(m[1]); } catch {}
  return { rail, rest: (bodyHtml || "").slice(m[0].length) };
}
function railSet(bodyHtml, images) {
  const { rail, rest } = railGet(bodyHtml);
  rail.images = images;
  delete rail.image; // 구 단수 필드 정리
  return `<!--RAIL:${JSON.stringify(rail)}-->\n` + rest.trim();
}

const rows = await (await rest("magazine?corner=neq.report&select=slug,corner,field,title,body_html&order=created_at.desc&limit=1000")).json();
let done = 0, skip = 0, fail = 0, n = 0;
for (const row of rows) {
  if (LIMIT && n >= LIMIT) break;
  if (ONLY.length && !ONLY.includes(row.slug)) continue;
  const { rail } = railGet(row.body_html);
  if ((rail.images?.length >= 2 || (!FORCE && rail.images?.length)) && !FORCE) { skip++; continue; }
  n++;
  const kw = keyword(row.slug);
  const page = (hash(row.slug) % 3) + 1;
  let imgs = [];
  try { imgs = await pexels(kw, page, 2); } catch {}
  if (imgs.length < 2) { try { imgs = imgs.concat(await openverse(kw, page, 2 - imgs.length)); } catch {} }
  if (!imgs.length) { console.log(`  ✖ [${row.slug}] "${kw}" 이미지 없음`); fail++; continue; }
  console.log(`  ✓ [${row.slug}] "${kw}" → ${imgs.length}장 (${imgs.map((x) => x.source.split(" ")[0]).join(",")})`);
  if (!DRY) {
    const body_html = railSet(row.body_html, imgs);
    const up = await rest(`magazine?slug=eq.${encodeURIComponent(row.slug)}`, { method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ body_html }) });
    if (up.ok) done++; else { console.log(`      PATCH 실패 ${up.status}`); fail++; }
  } else done++;
  await new Promise((r) => setTimeout(r, 250));
}
console.log(`\n[magazine-images] ${DRY ? "DRY " : ""}수집 ${done} · 스킵 ${skip} · 실패 ${fail}`);
