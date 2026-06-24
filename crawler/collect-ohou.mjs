// 오늘의집 오늘의딜 → 타임딜 수집기.
// Akamai 봇차단 우회: 번들 크로미움 대신 "설치된 진짜 크롬(channel:chrome)" + 워밍업(ohou.se→store) 필수.
// 추출 → ADBC redirect 딥링크 → /api/deals/ingest (platform=ohou, badge=ohou_today).
// 사용:  cd crawler && node collect-ohou.mjs [dry]
import { chromium } from "playwright";
import fs from "node:fs";
(function loadEnv() {
  for (const f of ["/.env", "/../.env.local"]) {
    try { const t = fs.readFileSync(`${import.meta.dirname}${f}`, "utf8");
      for (const l of t.split(/\r?\n/)) { const m = l.match(/^([A-Z0-9_]+)=(.*)$/); if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].trim(); } } catch {}
  }
})();
const SECRET = process.env.INGEST_SECRET || process.env.CRON_SECRET;
const INGEST = "https://www.todaydeals.co.kr/api/deals/ingest";
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
const OHOU_CAMPAIGN = "378130879", MEDIA = "959081531", AFF = "app1";
const adbc = (url, sub1) => `https://adbc.io/${OHOU_CAMPAIGN}/${MEDIA}?sub1=${encodeURIComponent(sub1)}&aff_id=${AFF}&redirect=${encodeURIComponent(url)}`;
const dry = process.argv.includes("dry");

async function scrape() {
  const browser = await chromium.launch({ channel: "chrome", headless: true, args: ["--disable-blink-features=AutomationControlled", "--no-sandbox"] });
  const ctx = await browser.newContext({ userAgent: UA, locale: "ko-KR", viewport: { width: 1440, height: 900 }, extraHTTPHeaders: { "Accept-Language": "ko-KR,ko;q=0.9" } });
  await ctx.addInitScript(() => { Object.defineProperty(navigator, "webdriver", { get: () => undefined }); Object.defineProperty(navigator, "plugins", { get: () => [1, 2, 3] }); window.chrome = { runtime: {} }; });
  const page = await ctx.newPage();
  for (const url of ["https://ohou.se/", "https://store.ohou.se/today_deals"]) { try { await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 }); await page.waitForTimeout(2500); } catch {} }
  // 끝까지 천천히 스크롤 — 모든 카드가 뷰포트를 지나 lazy 이미지가 실제 로드되게
  const docH = await page.evaluate(() => document.body.scrollHeight);
  for (let y = 0; y < docH + 3000; y += 700) { await page.mouse.wheel(0, 700); await page.waitForTimeout(250); }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(1800);
  const rows = await page.evaluate(() => {
    const seen = new Set(), out = [];
    const JUNK = /남음|오늘만|쿠폰|할인가|무료배송|판매됐|적립|개나|회원가입|카테고리|고객센터|로그인|글쓰기|오늘의딜|단독상품|원하는날|쇼룸|기획전|베스트|리뷰|평점|별점|후기|구매중|^\d+(\.\d+)?\s*$/;
    for (const a of document.querySelectorAll('a[href*="/goods/"]')) {
      const m = a.href.match(/goods\/(\d+)/); if (!m || seen.has(m[1])) continue;
      let card = a, pm = null;
      for (let up = 0; up < 6 && card; up++) {
        const tc = card.textContent || "";
        pm = tc.match(/([0-9]{1,3}(?:,[0-9]{3})+)\s*(?:원|외)/);
        if (pm && /\d{1,2}:\d{2}:\d{2}\s*남음/.test(tc) && card.querySelectorAll('a[href*="/goods/"]').length <= 2) break;
        pm = null; card = card.parentElement;
      }
      if (!pm) continue;
      const price = Number(pm[1].replace(/[^\d]/g, ""));
      if (!(price > 0)) continue;
      const lines = (card.innerText || "").split("\n").map((s) => s.trim()).filter(Boolean);
      const name = lines.filter((l) => l.length >= 6 && /[가-힣A-Za-z]/.test(l) && !JUNK.test(l) && !/^[\d,]+\s*(원|외)?$/.test(l) && !/^\d+%/.test(l)).sort((a, b) => b.length - a.length)[0] || "";
      if (!name || name.length < 5) continue;
      // 카드 내 img 중 진짜 상품사진(/deal/) 우선 — 브랜드 로고 배지(thumbnail_badges)·data: placeholder 제외
      let im = "";
      const imgs = [...a.querySelectorAll("img"), ...(card ? card.querySelectorAll("img") : [])];
      for (const g of imgs) {
        let s = g.currentSrc || g.src || "";
        if (s.startsWith("data:")) { const ss = (g.getAttribute("srcset") || "").split(",")[0].trim().split(/\s+/)[0]; s = ss && !ss.startsWith("data:") ? ss : ""; }
        if (!s || s.startsWith("data:") || /thumbnail_badges/.test(s)) continue; // 배지 로고·placeholder 제외
        if (/\/deal/.test(s)) { im = s; break; } // 진짜 상품사진 우선
        if (!im) im = s; // 폴백(배지 아닌 다른 이미지)
      }
      const tc = card.textContent || "";
      const dm = tc.match(/오늘만\s*(\d{1,2})\s*%/);
      const rm = tc.match(/(\d{1,2}):(\d{2}):(\d{2})\s*남음/);
      seen.add(m[1]);
      out.push({ id: m[1], name: name.slice(0, 80), price, image: im || null, discount: dm ? Number(dm[1]) : null, remainSec: rm ? +rm[1] * 3600 + +rm[2] * 60 + +rm[3] : null });
    }
    return out;
  });
  await browser.close();
  return rows;
}

const all = await scrape();
const items = all.filter((p) => p.image); // 이미지 없는 딜 제외(타임딜 회색 빈칸 방지)
console.log(`오늘의집 추출: ${all.length}건 → 이미지있는 ${items.length}건`);
console.log(items.slice(0, 4).map((x) => `  · ${x.name.slice(0, 40)} / ${x.price.toLocaleString()}원 / ${x.discount ? x.discount + "%" : "-"} / ${x.remainSec ? Math.floor(x.remainSec / 3600) + "h" : "-"}`).join("\n"));
if (!items.length) process.exit(1);

const deals = items.map((p) => {
  const url = `https://store.ohou.se/goods/${p.id}`;
  return { platform: "ohou", badge: "ohou_today", productName: p.name, imageUrl: p.image || undefined, productUrl: url,
    affiliateUrl: adbc(url, `ohou-${p.id}`), salePrice: p.price, discountRate: p.discount ?? undefined,
    dealEndAt: p.remainSec ? new Date(Date.now() + p.remainSec * 1000).toISOString() : undefined };
});

if (dry) { console.log("(dry — ingest 안 함)"); process.exit(0); }
if (!SECRET) { console.error("INGEST_SECRET 없음"); process.exit(1); }
const res = await fetch(INGEST, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${SECRET}` }, body: JSON.stringify({ deals, replace: true }) });
const j = await res.json().catch(() => ({}));
console.log(`ingest: HTTP ${res.status} · registered=${j.registered} byPlatform=${JSON.stringify(j.byPlatform || {})}`);
if (j.skipped?.length) console.log("skipped 예:", j.skipped.slice(0, 3).map((s) => s.reason).join(", "));
