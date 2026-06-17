// 오늘의딜 — 헤드리스(Playwright) 타임딜 URL 자동수집기
//
// JS로 렌더되는 딜 목록 페이지를 실제 브라우저로 열어 상품 링크를 추출 → /api/deals/ingest 전송.
//
// 준비:  cd crawler && npm install && npx playwright install chromium
// 실행:  node crawler/collect-headless.mjs   (또는 cd crawler && npm run collect:headless)
//
// LISTINGS 에 딜 섹션을 추가하면 11번가·알리도 같은 방식으로 확장됩니다.

import { chromium } from "playwright";
import { sendToIngest, UA } from "./_ingest.mjs";

// 수집 대상 딜 목록 페이지 + 상품 링크 패턴
const LISTINGS = [
  {
    name: "지마켓 슈퍼딜",
    url: "https://www.gmarket.co.kr/n/superdeal",
    linkRe: /item\.gmarket\.co\.kr\/Item\?[^"'\s<>]*goodscode=\d+/i,
    max: 30,
  },
  // {
  //   name: "11번가 쇼킹딜",
  //   url: "https://www.11st.co.kr/browsing/MallPlaza.tmall?method=...",
  //   linkRe: /(?:www\.)?11st\.co\.kr\/products\/\d+/i,
  //   max: 30,
  // },
  // {
  //   name: "알리 타임딜",
  //   url: "https://www.aliexpress.com/...",
  //   linkRe: /(?:[a-z]+\.)?aliexpress\.com\/item\/\d+\.html/i,
  //   max: 30,
  // },
];

async function scrape(page, { name, url, linkRe, max }) {
  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
    // 지연 로딩 유도: 몇 번 스크롤
    for (let i = 0; i < 6; i++) {
      await page.mouse.wheel(0, 3000);
      await page.waitForTimeout(800);
    }
    const hrefs = await page.$$eval("a[href]", (as) => as.map((a) => a.href));
    const matched = [...new Set(hrefs.filter((h) => linkRe.test(h)))].slice(0, max);
    console.log(`[${name}] 상품 링크 ${matched.length}개`);
    return matched;
  } catch (e) {
    console.warn(`[${name}] 실패: ${e.message}`);
    return [];
  }
}

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ userAgent: UA, locale: "ko-KR" });
const page = await ctx.newPage();

const all = [];
for (const listing of LISTINGS) {
  all.push(...(await scrape(page, listing)));
}
await browser.close();

await sendToIngest(all);
