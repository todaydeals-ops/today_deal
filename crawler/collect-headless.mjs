// 오늘의딜 — 헤드리스(Playwright) 타임딜 수집기 (소스별 어댑터 → 통합 ingest)
//
// 각 어댑터가 "통합 딜 레코드"를 만들어 /api/deals/ingest 로 전송.
// 레코드: { platform, badge, productName, imageUrl, productUrl, salePrice, discountRate, dealEndAt }
//   - 서버가 제휴링크 변환(LinkPrice)·badge 단위 교체·저장까지 처리.
//
// 준비:  cd crawler && npm install && npx playwright install chromium
// 실행:  node crawler/collect-headless.mjs

import { chromium } from "playwright";
import { postIngest, UA } from "./_ingest.mjs";

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

// 소스 어댑터 목록 (추후 11번가 등 추가)
const SOURCES = [["지마켓 오픈런", collectGmarketOpenrun]];

// ── main ──
const browser = await chromium.launch({ headless: true });
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
