// 오늘의딜 — 헤드리스(Playwright) 타임딜 수집기
//
// 지마켓 등은 서버 fetch를 Cloudflare로 차단(403)하므로, 실제 브라우저로 페이지를 열어
// (챌린지 통과) 제목·이미지·가격을 추출 → 완성 데이터를 /api/deals/ingest 로 전송한다.
//
// 준비:  cd crawler && npm install && npx playwright install chromium
// 실행:  node crawler/collect-headless.mjs              (crawler/urls.txt 읽음)
//        node crawler/collect-headless.mjs "URL1" "URL2"  (인자로 직접 전달도 가능)

import { chromium } from "playwright";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { postIngest, UA } from "./_ingest.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));

function detectPlatform(url) {
  const u = url.toLowerCase();
  if (/gmarket\./.test(u)) return "gmarket";
  if (/11st\./.test(u)) return "11st";
  if (/aliexpress\./.test(u)) return "ali";
  return null;
}

function urlsFromFile() {
  const p = join(__dirname, "urls.txt");
  if (!existsSync(p)) return [];
  return readFileSync(p, "utf8")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#"));
}

// 선택: 딜 목록 페이지에서 상품 링크 자동 발견 (브라우저 렌더 후). 필요 시 채우세요.
const LISTINGS = [
  // { url: "https://www.gmarket.co.kr/n/superdeal",
  //   linkRe: /https?:\/\/item\.gmarket\.co\.kr\/Item\?[^"'\s<>]*goodscode=\d+/i, max: 30 },
];

// 상품명 정리 (지마켓 og:title 접두 "G마켓-" 등 제거)
function cleanName(s) {
  return String(s || "").replace(/^\s*G마켓\s*[-–]?\s*/i, "").trim();
}

// 페이지(DOM)에서 상품 데이터 추출 — 브라우저 안에서 실행 (HTML 정규식보다 견고)
async function extractInPage(page) {
  return page.evaluate(() => {
    const metaC = (sel) => document.querySelector(sel)?.content || null;
    let name = null, image = null, price = null;

    // 1) JSON-LD Product
    for (const s of document.querySelectorAll('script[type="application/ld+json"]')) {
      try {
        const j = JSON.parse(s.textContent);
        for (const node of Array.isArray(j) ? j : [j]) {
          const t = node && node["@type"];
          const isProduct = t === "Product" || (Array.isArray(t) && t.includes("Product"));
          if (!isProduct) continue;
          name = name || node.name || null;
          if (node.image) image = image || (Array.isArray(node.image) ? node.image[0] : node.image);
          const off = Array.isArray(node.offers) ? node.offers[0] : node.offers;
          const p = off && (off.price ?? off.lowPrice);
          if (p && !price) price = Number(String(p).replace(/[^\d]/g, ""));
        }
      } catch (e) {
        /* ignore malformed ld+json */
      }
    }

    // 2) og/meta 폴백
    name = name || metaC('meta[property="og:title"]') || document.title || null;
    image = image || metaC('meta[property="og:image"]');
    if (!price) {
      const pm = metaC('meta[property="product:price:amount"]') || metaC('meta[property="og:price:amount"]');
      if (pm) price = Number(String(pm).replace(/[^\d]/g, ""));
    }
    // 3) DOM 가격 셀렉터 폴백 (우선순위대로 — 연관상품 가격 오인 방지)
    if (!price) {
      const pick = (sel) => {
        const e = document.querySelector(sel);
        if (!e) return 0;
        const n = Number(e.textContent.replace(/[^\d]/g, ""));
        return n > 0 ? n : 0;
      };
      price =
        pick("strong.price_real") ||
        pick(".price_real") ||
        pick(".price_innerwrap .num") ||
        pick('[class*="Price"] strong') ||
        null;
    }
    return { name, image: image || null, price: price > 0 ? price : null };
  });
}

async function discoverFromListings(ctx) {
  if (LISTINGS.length === 0) return [];
  const page = await ctx.newPage();
  const found = [];
  try {
    for (const { url, linkRe, max } of LISTINGS) {
      try {
        await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
        for (let i = 0; i < 6; i++) {
          await page.mouse.wheel(0, 3000);
          await page.waitForTimeout(800);
        }
        const hrefs = await page.$$eval("a[href]", (as) => as.map((a) => a.href));
        const picked = [...new Set(hrefs.filter((h) => linkRe.test(h)))].slice(0, max);
        console.log(`[목록] ${url} → ${picked.length}개`);
        found.push(...picked);
      } catch (e) {
        console.warn(`[목록] ${url} 실패: ${e.message}`);
      }
    }
  } finally {
    await page.close();
  }
  return found;
}

// URL마다 "새 탭"에서 처리 — 이전 페이지 DOM 잔존으로 가격이 누락되는 문제 방지.
// Cloudflare 챌린지 통과 + 상품 데이터 로드까지 대기, 최대 3회 재시도.
async function readDeal(browser, url) {
  const ctx = await browser.newContext({ userAgent: UA, locale: "ko-KR" });
  const page = await ctx.newPage();
  try {
    let best = {};
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        if (attempt === 1) {
          await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
        } else {
          await page.waitForTimeout(1500);
          await page.reload({ waitUntil: "domcontentloaded", timeout: 60000 }); // 새로고침 후 재시도
        }
        await page
          .waitForFunction(
            () => {
              const t = document.title || "";
              if (/just a moment|잠시|robot|attention required/i.test(t)) return false;
              return (
                !!document.querySelector('meta[property="og:title"]') ||
                !!document.querySelector('script[type="application/ld+json"]')
              );
            },
            { timeout: 25000 }
          )
          .catch(() => {});
        // 가격이 "숫자로 채워질 때까지" 대기 (지마켓은 가격 위젯이 늦게/재방문 시 누락)
        await page
          .waitForFunction(
            () => {
              const e = document.querySelector("strong.price_real, .price_real, .price_innerwrap .num");
              return e && /\d{3,}/.test(e.textContent);
            },
            { timeout: 15000 }
          )
          .catch(() => {});
        await page.waitForTimeout(800);
        const d = await extractInPage(page);
        if (d.name) {
          // 이름+가격 다 있으면 완료, 가격이 비면 새로고침해서 한 번 더
          if (d.price) return { name: cleanName(d.name), image: d.image || undefined, price: d.price };
          if (!best.name) best = { name: cleanName(d.name), image: d.image || undefined };
        }
      } catch {
        /* 재시도 */
      }
    }
    return best; // 가격 못 구하면 이름만 반환 → 서버가 '가격없음' 스킵, /admin/timedeal에서 보정
  } finally {
    await ctx.close(); // 세션 완전 폐기 (재방문 경량페이지 회피)
  }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ── main ──
const argUrls = process.argv.slice(2).filter((a) => /^https?:\/\//i.test(a));
const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ userAgent: UA, locale: "ko-KR" });

const urls = [...new Set([...argUrls, ...urlsFromFile(), ...(await discoverFromListings(ctx))])];
if (urls.length === 0) {
  console.log("URL이 없습니다. crawler/urls.txt에 넣거나 인자로 전달하세요.");
  await browser.close();
  process.exit(0);
}

const deals = [];
for (const url of urls) {
  const platform = detectPlatform(url);
  if (!platform) {
    console.warn(`[스킵] 미지원 플랫폼: ${url}`);
    continue;
  }
  const { name, image, price } = await readDeal(browser, url);
  console.log(`[${platform}] ${name ? "✓이름" : "✗이름"} ${price ? "✓가격" : "✗가격"}  ${url.slice(0, 70)}`);
  if (!name) continue;
  deals.push({ platform, productName: name, imageUrl: image, productUrl: url, salePrice: price });
  await sleep(3500); // 연속요청 스로틀 회피
}

await browser.close();
await postIngest({ deals });
