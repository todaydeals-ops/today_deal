// 오늘의딜 — CPS 머천트(이마트·오늘의집) 헤드리스 수집기.
// 11번가 어댑터와 동일 방식: Playwright로 진짜 브라우저 렌더 → 스크롤로 lazy-load → DOM 카드 파싱.
// 상품 URL을 ADBC redirect= 딥링크로 wrap → board_deals 직접 적재.
// 사용:  cd crawler && node collect-cps.mjs emart [dry]
//        cd crawler && node collect-cps.mjs ohou  [dry]
import { chromium } from "playwright";
import fs from "node:fs";

(function loadEnv() {
  try { const t = fs.readFileSync(`${import.meta.dirname}/../.env.local`, "utf8");
    for (const l of t.split(/\r?\n/)) { const m = l.match(/^([A-Z0-9_]+)=(.*)$/); if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].trim(); } } catch {}
})();
const SUPA = process.env.NEXT_PUBLIC_SUPABASE_URL, KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const H = { apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" };
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";
const MEDIA = "959081531", AFF = "app1";
const adbc = (cmp, url, sub1) => `https://adbc.io/${cmp}/${MEDIA}?sub1=${encodeURIComponent(sub1)}&aff_id=${AFF}&redirect=${encodeURIComponent(url)}`;
const cat = (name) => /세제|샴푸|화장지|물티슈|치약|칫솔|생리대|섬유|탈취|클렌|로션|크림|마스크팩|선크림|샤워|바디/.test(name) ? "생활"
  : /냄비|프라이팬|그릇|텀블러|밀폐|수세미|도마|주방|식기/.test(name) ? "주방"
  : /가구|소파|침대|매트|조명|커튼|러그|선반|행거|수납|서랍/.test(name) ? "가구"
  : "식품";

// ── 이마트몰 (SSG 플랫폼) — 오반장 특가. itemView 앵커 → 카드 파싱 ──
async function collectEmart(ctx) {
  const page = await ctx.newPage();
  await page.route("**/*", (r) => (["media", "font"].includes(r.request().resourceType()) ? r.abort() : r.continue()));
  try {
    await page.goto("https://emart.ssg.com/page/pc/obanjang.ssg", { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForTimeout(2500);
    for (let i = 0; i < 8; i++) { await page.mouse.wheel(0, 3000); await page.waitForTimeout(600); }
    return await page.evaluate(() => {
      const seen = new Set(), out = [];
      for (const a of document.querySelectorAll('a[href*="itemView.ssg"]')) {
        const m = a.href.match(/itemId=(\d+)/); if (!m || seen.has(m[1])) continue;
        let card = a.parentElement, pm = null; // 가격은 상위에 있음 → 위로 올라가며 단일상품 카드 찾기
        for (let up = 0; up < 7 && card; up++) {
          pm = (card.textContent || "").match(/([0-9]{1,3}(?:,[0-9]{3})+)\s*원/);
          if (pm && card.querySelectorAll('a[href*="itemView.ssg"]').length <= 2) break;
          pm = null; card = card.parentElement;
        }
        if (!pm) continue;
        const price = Number(pm[1].replace(/[^\d]/g, ""));
        if (!(price > 0) || price > 3000000) continue;
        const img = a.querySelector("img") || card?.querySelector("img");
        const name = (img?.alt || "").replace(/\s+/g, " ").trim();
        if (!name || name.length < 4) continue;
        seen.add(m[1]);
        out.push({ id: m[1], name, price, imageUrl: img?.src, productUrl: a.href.split("#")[0] });
      }
      return out;
    });
  } finally { await page.close(); }
}

// ── 오늘의집 — 스토어 특가/베스트. productions 앵커 → 카드 파싱 ──
async function collectOhou(ctx) {
  const page = await ctx.newPage();
  await page.route("**/*", (r) => (["media", "font"].includes(r.request().resourceType()) ? r.abort() : r.continue()));
  try {
    await page.goto("https://ohou.se/store/category", { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForTimeout(3000);
    for (let i = 0; i < 8; i++) { await page.mouse.wheel(0, 3000); await page.waitForTimeout(700); }
    return await page.evaluate(() => {
      const seen = new Set(), out = [];
      for (const a of document.querySelectorAll('a[href*="/productions/"]')) {
        const m = a.href.match(/productions\/(\d+)/); if (!m || seen.has(m[1])) continue;
        let card = a.parentElement, pm = null;
        for (let up = 0; up < 7 && card; up++) {
          pm = (card.textContent || "").match(/([0-9]{1,3}(?:,[0-9]{3})+)\s*원/);
          if (pm && card.querySelectorAll('a[href*="/productions/"]').length <= 2) break;
          pm = null; card = card.parentElement;
        }
        if (!pm) continue;
        const price = Number(pm[1].replace(/[^\d]/g, ""));
        if (!(price > 0) || price > 5000000) continue;
        const img = a.querySelector("img") || card?.querySelector("img");
        const name = (img?.alt || a.textContent || "").replace(/\s+/g, " ").trim();
        if (!name || name.length < 4) continue;
        seen.add(m[1]);
        out.push({ id: m[1], name, price, imageUrl: img?.src, productUrl: `https://ohou.se/productions/${m[1]}` });
      }
      return out;
    });
  } finally { await page.close(); }
}

const MERCHANTS = {
  emart: { campaign: "450322980", shop: "이마트몰", slug: "emart", fn: collectEmart },
  ohou: { campaign: "378130879", shop: "오늘의집", slug: "ohou", fn: collectOhou },
};

const which = process.argv[2] || "emart";
const dry = process.argv.includes("dry");
const M = MERCHANTS[which];
if (!M) { console.error("emart | ohou"); process.exit(1); }

const browser = await chromium.launch({ headless: true, args: ["--disable-dev-shm-usage", "--no-sandbox"] });
const ctx = await browser.newContext({ userAgent: UA, locale: "ko-KR" });
let items = [];
try { items = await M.fn(ctx); } catch (e) { console.error("수집 실패:", e.message); }
await browser.close();
console.log(`[${M.shop}] ${items.length}건 수집`);
console.log(items.slice(0, 5).map((x) => `  · ${x.name} / ${x.price.toLocaleString()}원 / ${x.productUrl.slice(0, 60)}`).join("\n"));

if (dry || !items.length) { console.log(dry ? "(dry — 적재 안 함)" : "(수집 0건)"); process.exit(0); }

const rows = items.slice(0, 30).map((p) => {
  const slug = `${M.slug}-${p.id}`;
  const link = adbc(M.campaign, p.productUrl, slug);
  return { slug, board_type: "cps", category: cat(p.name), title: p.name, shop: M.shop,
    price: p.price, image_url: p.imageUrl, source_url: link, affiliate_url: link,
    original_url: p.productUrl, is_published: true, author: "오늘의딜", source: null, views: 1 };
});
const res = await fetch(`${SUPA}/rest/v1/board_deals?on_conflict=slug`, { method: "POST", headers: { ...H, Prefer: "resolution=merge-duplicates,return=minimal" }, body: JSON.stringify(rows) });
console.log(`적재: HTTP ${res.status} · ${rows.length}건`);
if (!res.ok) console.error(await res.text());
