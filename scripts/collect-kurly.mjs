// 마켓컬리 CPS 딜 수집 — 컬리 컬렉션 API → ADBC 딥링크(redirect=) → board_deals 적재.
// 사용: node scripts/collect-kurly.mjs [collection=halfhome] [limit=24]
import fs from "node:fs";
(function loadEnv() {
  try { const t = fs.readFileSync(`${import.meta.dirname}/../.env.local`, "utf8");
    for (const l of t.split(/\r?\n/)) { const m = l.match(/^([A-Z0-9_]+)=(.*)$/); if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].trim(); } } catch {}
  if (!process.env.SUPA_URL) process.env.SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!process.env.SUPA_KEY) process.env.SUPA_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
})();
const SUPA = process.env.SUPA_URL, KEY = process.env.SUPA_KEY;
if (!SUPA || !KEY) { console.error("SUPA env 필요"); process.exit(1); }
const H = { apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" };
const rest = (p, i = {}) => fetch(`${SUPA}/rest/v1/${p}`, { ...i, headers: { ...H, ...(i.headers || {}) } });

const CAMPAIGN = "1356118765", MEDIA = "959081531", AFF = "app1"; // 마켓컬리
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0 Safari/537.36";
const adbc = (url, sub1) => `https://adbc.io/${CAMPAIGN}/${MEDIA}?sub1=${encodeURIComponent(sub1)}&aff_id=${AFF}&redirect=${encodeURIComponent(url)}`;
function cat(name) {
  if (/세제|샴푸|화장지|물티슈|청결|치약|칫솔|생리대|섬유유연|탈취|클렌|로션|크림|마스크팩|선크림|틴트|쿠션/.test(name)) return "생활";
  if (/팬\b|냄비|그릇|텀블러|밀폐|주방|수세미|도마/.test(name)) return "주방";
  return "식품";
}

const collection = process.argv[2] || "sale231107"; // 컬리 세일 컬렉션(사장님 지정)
const limit = Number(process.argv[3]) || 24;
const r = await fetch(`https://api.kurly.com/collection/v2/home/sites/market/product-collections/${collection}/products?sort_type=4&page=1&per_page=${limit}`, { headers: { "User-Agent": UA, Accept: "application/json" } });
const j = await r.json();
const items = (Array.isArray(j.data) ? j.data : []).filter((p) => !p.is_sold_out && p.discounted_price > 0);
if (!items.length) { console.error("상품 없음 — 응답:", JSON.stringify(j).slice(0, 200)); process.exit(1); }
const rows = items.map((p) => {
  const url = `https://www.kurly.com/goods/${p.no}`;
  const slug = `kurly-${p.no}`;
  const link = adbc(url, slug);
  return { slug, board_type: "cps", category: cat(p.name), title: p.name, shop: "마켓컬리",
    price: p.discounted_price, image_url: p.list_image_url, source_url: link, affiliate_url: link,
    original_url: url, is_published: true, author: "오늘의딜", source: null, views: 1 };
});
const res = await rest("board_deals?on_conflict=slug", { method: "POST", headers: { Prefer: "resolution=merge-duplicates,return=minimal" }, body: JSON.stringify(rows) });
console.log(`마켓컬리 적재: HTTP ${res.status} · ${rows.length}건 (collection=${collection})`);
if (!res.ok) console.error(await res.text());
else console.log("예시 슬러그:", rows.slice(0, 3).map((x) => `/board/${x.slug}`).join(", "));
