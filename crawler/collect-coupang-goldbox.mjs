// 쿠팡 골드박스 → 타임딜 수집기.
// Akamai 봇차단 우회: 번들 크로미움 대신 "설치된 진짜 크롬(channel:chrome)" + 워밍업(coupang.com→goldbox) 필수.
// 상품 데이터는 클라이언트 XHR(POST /api/products, body {goldbox:true})로 로드 → 응답을 가로채 파싱.
//   (직접 서버 POST는 Akamai 403 — 브라우저 렌더링 경유만 통과. 2026-06-26 실측)
// pickScore(메인과 동일 로직)로 '눌릴 만한' 주요상품 20개 선별 → 쿠팡 ADBC 딥링크 → /api/deals/ingest
//   (platform=coupang, badge=coupang_goldbox).  ※ ADBC 트래킹이라 쿠팡 파트너스 API 정지와 무관.
// 사용:  cd crawler && node collect-coupang-goldbox.mjs [dry]
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
const GOLDBOX = "https://pages.coupang.com/p/121237?sourceType=gm_crm_goldbox&subSourceType=gm_crm_gwsrtcut";
const CP_CAMPAIGN = "211547715", MEDIA = "959081531", AFF = "app1";
const adbc = (url, sub1) => `https://adbc.io/${CP_CAMPAIGN}/${MEDIA}?sub1=${encodeURIComponent(sub1)}&aff_id=${AFF}&redirect=${encodeURIComponent(url)}`;
const TAKE = 20;
const dry = process.argv.includes("dry");

// 메인(app/page.tsx)과 동일한 '눌릴 만한' 점수 — 먹거리·일상소비재·유명브랜드 우대, 가구·대형가전 감점.
function pickScore(name, price, discount) {
  let s = 0;
  if (/쌀|한우|삼겹|돼지고기|소고기|닭가슴|닭갈비|족발|곱창|생선|고등어|새우|오징어|장어|회\b|과일|사과|수박|복숭아|딸기|포도|멜론|체리|망고|토마토|옥수수|고구마|감자|채소|야채|나물|김치|반찬|만두|떡볶이|핫도그|피자|치킨|라면|국수|파스타|과자|쿠키|초콜릿|아이스크림|커피|음료|주스|생수|우유|두유|요거트|치즈|버터|햄|소시지|어묵|견과|간식|즉석밥|컵밥|시리얼|소스|양념|참기름|올리브유|꿀|잼|차류|만두/.test(name)) s += 50;
  if (/세제|샴푸|치약|칫솔|물티슈|화장지|휴지|키친타올|생리대|기저귀|섬유유연|주방세제|비누|바디워시|클렌징|선크림|마스크팩|로션|크림|틴트|쿠션|영양제|비타민|유산균|콜라겐|오메가|마그네슘|루테인|건강기능/.test(name)) s += 36;
  if (/삼성|엘지|LG|애플|다이슨|필립스|나이키|아디다스|뉴발란스|퓨마|언더아머|크록스|CJ|농심|오뚜기|풀무원|동원|청정원|삼양|롯데|해태|빙그레|코카콜라|펩시|스타벅스|네스카페|맥심|켈로그|하림|비비고|종근당|GNC|일동|광동|유한|애경|아모레|메디힐|닥터지/.test(name)) s += 24;
  if (/식탁|소파|쇼파|침대|매트리스|책상|옷장|장롱|서랍장|수납장|선반|행거|커튼|러그|조명|가구|냉장고|세탁기|건조기|에어컨|에어컨디셔너|티비|\bTV\b|모니터|의자|안마의자|러닝머신|골프|타이어/.test(name)) s -= 45;
  if (price <= 20000) s += 20; else if (price <= 50000) s += 8; else if (price > 150000) s -= 20;
  s += Math.min(discount || 0, 80) * 0.2;
  return s;
}

async function scrape() {
  const browser = await chromium.launch({ channel: "chrome", headless: true, args: ["--disable-blink-features=AutomationControlled", "--no-sandbox"] });
  const ctx = await browser.newContext({ userAgent: UA, locale: "ko-KR", viewport: { width: 1440, height: 1600 }, extraHTTPHeaders: { "Accept-Language": "ko-KR,ko;q=0.9" } });
  await ctx.addInitScript(() => { Object.defineProperty(navigator, "webdriver", { get: () => undefined }); Object.defineProperty(navigator, "plugins", { get: () => [1, 2, 3] }); window.chrome = { runtime: {} }; });
  const page = await ctx.newPage();
  let raw = null;
  page.on("response", async (res) => { if (/\/api\/products/.test(res.url())) { try { raw = await res.text(); } catch {} } });
  // 워밍업: 쿠팡 메인 먼저(Akamai 쿠키 확보) → 골드박스
  try { await page.goto("https://www.coupang.com/", { waitUntil: "domcontentloaded", timeout: 45000 }); await page.waitForTimeout(2000); } catch {}
  try { await page.goto(GOLDBOX, { waitUntil: "domcontentloaded", timeout: 45000 }); } catch {}
  // /api/products 응답 대기(최대 15s)
  for (let i = 0; i < 30 && !raw; i++) await page.waitForTimeout(500);
  await browser.close();
  if (!raw) throw new Error("/api/products 응답 못받음(Akamai 차단 가능)");
  const j = JSON.parse(raw);
  let list;
  (function f(o, d) { if (list || d > 10 || !o || typeof o !== "object") return; if (Array.isArray(o) && o[0] && o[0].productId && o[0].imageAndTitleArea) { list = o; return; } for (const v of Array.isArray(o) ? o : Object.values(o)) f(v, d + 1); })(j, 0);
  if (!list) throw new Error("상품 배열 파싱 실패(구조 변경)");
  return list.map((p) => {
    const ita = p.imageAndTitleArea || {}, pa = p.priceArea || {};
    const name = (ita.title || "").trim();
    const price = Number(String(pa.price ?? pa.salesPrice ?? "").replace(/[^\d]/g, ""));
    const image = ita.defaultUrl ? (ita.defaultUrl.startsWith("//") ? "https:" + ita.defaultUrl : ita.defaultUrl) : null;
    const link = p.link ? "https://www.coupang.com" + p.link : null;
    return { id: String(p.productId), name, price, image, discount: Number(pa.discountRate) || null, link };
  }).filter((p) => p.name && p.price > 0 && p.image && p.link);
}

const all = await scrape();
// pickScore 상위 주요상품 TAKE개
const ranked = all.map((p) => ({ ...p, score: pickScore(p.name, p.price, p.discount || 0) })).sort((a, b) => b.score - a.score);
const items = ranked.slice(0, TAKE);
console.log(`쿠팡 골드박스 추출: ${all.length}건 → 주요상품 ${items.length}건(pickScore 상위)`);
console.log(items.slice(0, 6).map((x) => `  · [${x.score.toFixed(0)}] ${x.name.slice(0, 38)} / ${x.price.toLocaleString()}원 / ${x.discount ? x.discount + "%" : "-"}`).join("\n"));
if (!items.length) process.exit(1);

const deals = items.map((p) => ({
  platform: "coupang", badge: "coupang_goldbox", productName: p.name, imageUrl: p.image, productUrl: p.link,
  affiliateUrl: adbc(p.link, `coupang-${p.id}`), salePrice: p.price, discountRate: p.discount ?? undefined,
}));

if (dry) { console.log("(dry — ingest 안 함)"); process.exit(0); }
if (!SECRET) { console.error("INGEST_SECRET 없음"); process.exit(1); }
const res = await fetch(INGEST, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${SECRET}` }, body: JSON.stringify({ deals, replace: true }) });
const txt = await res.text(); let jj = {}; try { jj = JSON.parse(txt); } catch {}
console.log(`ingest: HTTP ${res.status} · registered=${jj.registered} byPlatform=${JSON.stringify(jj.byPlatform || {})}`);
if (res.status !== 200) console.log("응답:", txt.slice(0, 300));
if (jj.skipped?.length) console.log("skipped 예:", jj.skipped.slice(0, 3).map((s) => s.reason).join(", "));
