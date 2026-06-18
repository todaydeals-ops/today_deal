// 오늘의딜 — 헤드리스(Playwright) 타임딜 수집기 (소스별 어댑터 → 통합 ingest)
//
// 각 어댑터가 "통합 딜 레코드"를 만들어 /api/deals/ingest 로 전송.
// 레코드: { platform, badge, productName, imageUrl, productUrl, salePrice, discountRate, dealEndAt }
//   - 서버가 제휴링크 변환(LinkPrice)·badge 단위 교체·저장까지 처리.
//
// 준비:  cd crawler && npm install && npx playwright install chromium
// 실행:  node crawler/collect-headless.mjs

import { chromium } from "playwright";
import { postIngest, UA, INGEST_URL, SECRET } from "./_ingest.mjs";

// KST 벽시계 문자열("2026-06-18T09:59:59") → ISO(UTC)
const kstToIso = (s) => (s ? new Date(s + "+09:00").toISOString() : undefined);

// ── 어댑터: 지마켓 오픈런 타임딜 (슈퍼딜 페이지 __NEXT_DATA__ 파싱) ──
async function collectGmarketOpenrun(ctx) {
  const page = await ctx.newPage();
  try {
    await page.goto("https://www.gmarket.co.kr/n/superdeal", { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForFunction(() => !!document.getElementById("__NEXT_DATA__"), { timeout: 25000 }).catch(() => {});
    await page.waitForTimeout(1200);
    const raw = await page.evaluate(() => document.getElementById("__NEXT_DATA__")?.textContent);
    if (!raw) return [];
    let json;
    try {
      json = JSON.parse(raw);
    } catch {
      return [];
    }
    const deals = json?.props?.pageProps?.initialStates?.home?.superdeal?.totalDeals ?? [];
    const out = [];
    for (const d of deals) {
      const theme = d.themeDealInfo || {};
      if (theme.themeDealType !== "TIME") continue; // 오픈런 타임딜만
      const price = Number(d.itemPrice);
      if (!d.itemName || !(price > 0)) continue;
      out.push({
        platform: "gmarket",
        badge: "gmarket_openrun",
        productName: d.itemName,
        imageUrl: d.itemImageUrl || undefined,
        productUrl: d.itemUrl || `https://item.gmarket.co.kr/Item?goodscode=${d.itemNo}`,
        salePrice: price,
        discountRate: Number(d.itemDiscountRate) || undefined,
        dealEndAt: kstToIso(theme.displayEndDate),
      });
    }
    return out;
  } finally {
    await page.close();
  }
}

// 다음 HH:MM(KST) ISO (마감 폴백용)
function kstResetIso(hh, mm = 0) {
  const now = Date.now();
  const kst = new Date(now + 9 * 3600 * 1000);
  let end = Date.UTC(kst.getUTCFullYear(), kst.getUTCMonth(), kst.getUTCDate(), hh, mm, 0) - 9 * 3600 * 1000;
  if (end <= now) end += 24 * 3600 * 1000;
  return new Date(end).toISOString();
}

// ── 어댑터: 11번가 (타임딜/오늘의딜) — Cloudflare 없음, HTML 카드 파싱 ──
async function collect11st(ctx, { url, badge, resetHour, limit = 30 }) {
  const page = await ctx.newPage();
  // 11번가 페이지는 무거움 → 이미지·폰트·미디어 차단(메모리 절약·크래시 방지). img.src는 그대로 읽힘.
  await page.route("**/*", (route) => {
    const t = route.request().resourceType();
    if (t === "image" || t === "media" || t === "font") route.abort();
    else route.continue();
  });
  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForTimeout(2500);
    for (let i = 0; i < 6; i++) {
      await page.mouse.wheel(0, 3000);
      await page.waitForTimeout(500);
    }
    const recs = await page.evaluate(() => {
      const seen = new Set();
      const out = [];
      for (const a of document.querySelectorAll('a[href*="/products/"]')) {
        const m = a.href.match(/products\/(\d+)/);
        if (!m) continue;
        const prd = m[1];
        if (seen.has(prd)) continue;
        const card = a.closest("li") || a.closest("div");
        if (!card) continue;
        const priceEl = card.querySelector("strong.sale_price");
        if (!priceEl) continue; // 딜 카드만 (가격 있는 것)
        const price = Number(priceEl.textContent.replace(/[^\d]/g, ""));
        if (!(price > 0)) continue;
        const img = card.querySelector("img");
        const name = (
          img?.alt ||
          card.querySelector('[class*="benefit" i],[class*="pname" i],[class*="name" i]')?.textContent ||
          ""
        ).replace(/\s+/g, " ").trim();
        if (!name) continue;
        seen.add(prd);
        const rateM = (card.querySelector("span.sale")?.textContent || "").match(/(\d+)%/);
        const tag = card.querySelector("em.tag")?.textContent || "";
        const tm = tag.match(/(\d{1,2}):(\d{2}):(\d{2})/);
        out.push({
          name,
          price,
          discountRate: rateM ? Number(rateM[1]) : undefined,
          imageUrl: img?.src || undefined,
          productUrl: `https://www.11st.co.kr/products/${prd}`,
          remainSec: tm ? +tm[1] * 3600 + +tm[2] * 60 + +tm[3] : null,
        });
      }
      return out;
    });
    const fallbackEnd = kstResetIso(resetHour);
    return recs.slice(0, limit).map((r) => ({
      platform: "11st",
      badge,
      productName: r.name,
      imageUrl: r.imageUrl,
      productUrl: r.productUrl,
      salePrice: r.price,
      discountRate: r.discountRate,
      dealEndAt: r.remainSec ? new Date(Date.now() + r.remainSec * 1000).toISOString() : fallbackEnd,
    }));
  } finally {
    await page.close();
  }
}

const D11 = "https://deal.11st.co.kr/browsing/DealAction.tmall";

// 소스 어댑터 목록
const SOURCES = [
  ["지마켓 오픈런", (ctx) => collectGmarketOpenrun(ctx)],
  ["11번가 타임딜", (ctx) => collect11st(ctx, { url: `${D11}?method=getTimeDeal`, badge: "11st_time", resetHour: 11, limit: 30 })],
  ["11번가 오늘의딜", (ctx) => collect11st(ctx, { url: `${D11}?method=getTodayDeal`, badge: "11st_today", resetHour: 0, limit: 24 })],
];

// ── main ──
const browser = await chromium.launch({
  headless: true,
  args: ["--disable-dev-shm-usage", "--no-sandbox"],
});
const ctx = await browser.newContext({ userAgent: UA, locale: "ko-KR" });

const deals = [];
for (const [name, fn] of SOURCES) {
  try {
    const r = await fn(ctx);
    console.log(`[${name}] ${r.length}건 수집`);
    deals.push(...r);
  } catch (e) {
    console.warn(`[${name}] 실패: ${e.message}`);
  }
}
await browser.close();

// 자동수집 → badge(코너) 단위 교체. 서버가 제휴링크 변환·저장.
await postIngest({ deals, replace: true });

// 쿠팡 골드박스(서버 공식 API)도 함께 갱신 → 1회 실행 = 전체 최신
try {
  const gb = new URL("/api/cron/goldbox", INGEST_URL);
  gb.searchParams.set("key", SECRET);
  const r = await fetch(gb);
  const j = await r.json().catch(() => ({}));
  console.log(`[쿠팡 골드박스] ${j.registered ?? j.error ?? "갱신"}건`);
} catch (e) {
  console.warn(`[쿠팡 골드박스] 트리거 실패: ${e.message}`);
}
