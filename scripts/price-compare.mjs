// 가격비교 진단 — 라이브 타임딜(deals)을 네이버/쿠팡 최저가와 대조해 추천/비추 판정.
// 정밀도 우선: 모델·수량 강제 매칭 + 광고잡음 제거 + 변형묶음 제외 + 밴드 2건↑ + 편차 게이트.
// 확신 안 서면 판정 안 함(null) — 틀린 추천/비추가 최악이라.
//
// 사용:  node scripts/price-compare.mjs run        # 라이브 딜 전체 판정 후 DB기록
//        node scripts/price-compare.mjs dry [n]    # 기록 없이 콘솔만(점검)
// 환경:  SUPA_URL, SUPA_KEY, NAVER_CLIENT_ID, NAVER_CLIENT_SECRET, COUPANG_ACCESS_KEY, COUPANG_SECRET_KEY
import crypto from "node:crypto";

const SUPA_URL = process.env.SUPA_URL, SUPA_KEY = process.env.SUPA_KEY;
const NAVER_ID = process.env.NAVER_CLIENT_ID, NAVER_SECRET = process.env.NAVER_CLIENT_SECRET;
const CPA = process.env.COUPANG_ACCESS_KEY, CPS = process.env.COUPANG_SECRET_KEY;
if (!SUPA_URL || !SUPA_KEY) { console.error("SUPA_URL/SUPA_KEY 필요"); process.exit(1); }
if (!NAVER_ID || !NAVER_SECRET) { console.error("NAVER_CLIENT_ID/SECRET 필요"); process.exit(1); }
const H = { apikey: SUPA_KEY, Authorization: `Bearer ${SUPA_KEY}`, "Content-Type": "application/json" };
const strip = (s) => (s || "").replace(/<[^>]+>/g, "").trim();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ── 토큰/시그니처 ────────────────────────────────────────────────
function qtyTokens(t) {
  const s = t.toLowerCase().replace(/\s+/g, "");
  const out = new Set();
  let m;
  const re1 = /(\d+)(개입|개|입|팩|매|구|병|캔|포|장|롤|정|캡슐|캡|알|인분|인용|인|권|p)/g;
  const re2 = /(\d+(?:\.\d+)?)(ml|l|kg|g)/g;
  const re3 = /[x×*](\d+)/g; // 묶음 수량(예: 80g×24)
  while ((m = re1.exec(s))) out.add(m[1] + m[2]);
  while ((m = re2.exec(s))) out.add(m[1] + m[2]);
  while ((m = re3.exec(s))) out.add("x" + m[1]);
  return out;
}
const modelCode = (t) => { const m = t.toUpperCase().match(/\b([A-Z]{2,}[A-Z0-9-]*\d[A-Z0-9-]*)\b/); return m ? m[1] : null; };
function seriesNums(t) { const out = new Set(); let m; const re = /\b(\d{3,4})\s*시리즈/g; while ((m = re.exec(t))) out.add(m[1]); return out; }
const coreTokens = (t) => (t.toLowerCase().match(/[가-힣a-z0-9]{2,}/g) || []).filter((w) => !/^\d+$/.test(w));

const GENERIC = /(외\b|모음|택\s*1|택일|골라담기|균일가|특가전|모음전|best|베스트|기획전|선택|\d종)/i;
const PROMO = /(단하루|깜짝|오늘만|타임특가|한정특가|신선집중|혜택가|최종가?|공식(운영|판매처?)|내일도착|품질보장|무료배송|사은품|증정|복수구매|결제할인|쿠폰|특가|최저가|당도선별|실중량|new|핫딜)/gi;
function cleanTitle(t) {
  return t.replace(/\([^)]*\)/g, " ").replace(/\[[^\]]*\]/g, " ")
    .replace(/\d+%|\d+,\d+원|\d+원/g, " ").replace(PROMO, " ")
    .replace(/[\/~]+/g, " ").replace(/\s+/g, " ").trim();
}
function profile(rawTitle, price) {
  const title = cleanTitle(rawTitle) || rawTitle;
  return { raw: rawTitle, title, price, generic: GENERIC.test(rawTitle), model: modelCode(title), series: seriesNums(title), qty: qtyTokens(title), core: coreTokens(title).slice(0, 8) };
}
function isStrictMatch(ours, candTitle) {
  if (ours.generic) return false;
  if (!ours.model && ours.qty.size === 0) return false; // 식별 불가
  const c = candTitle.toLowerCase(), cU = candTitle.toUpperCase();
  if (ours.model && !cU.includes(ours.model)) return false;
  for (const s of ours.series) if (!candTitle.includes(s)) return false;
  const cq = qtyTokens(candTitle);
  for (const q of ours.qty) if (!cq.has(q)) return false;
  const shared = ours.core.filter((w) => c.includes(w));
  const need = ours.model ? 1 : Math.max(2, Math.ceil(ours.core.length * 0.6));
  return shared.length >= need;
}
// 정밀도 핵심: 밴드 내 매칭 2건↑ + 편차 2배 이내일 때만 신뢰 최저가 반환.
function cleanLowest(matches) {
  if (matches.length < 2) return null;
  const prices = matches.map((m) => m.price).sort((a, b) => a - b);
  const med = prices[Math.floor(prices.length / 2)];
  const band = matches.filter((m) => m.price >= med * 0.7 && m.price <= med * 1.5);
  if (band.length < 2) return null;
  const lo = Math.min(...band.map((m) => m.price)), hi = Math.max(...band.map((m) => m.price));
  if (hi / lo > 2) return null;
  return { price: lo, n: band.length };
}
function verdict(our, ref) {
  if (ref == null) return null;
  const diff = (our - ref) / ref;
  if (diff <= -0.02) return "추천";
  if (diff >= 0.02) return "비추";
  return "비슷";
}

// ── 외부 검색 ────────────────────────────────────────────────────
async function naverMatches(ours) {
  const q = encodeURIComponent(ours.title.slice(0, 60));
  const r = await fetch(`https://openapi.naver.com/v1/search/shop.json?query=${q}&display=10&sort=asc`, { headers: { "X-Naver-Client-Id": NAVER_ID, "X-Naver-Client-Secret": NAVER_SECRET } });
  if (!r.ok) return [];
  const j = await r.json();
  return (j.items || []).map((it) => ({ title: strip(it.title), price: Number(it.lprice) })).filter((it) => it.price > 0 && isStrictMatch(ours, it.title));
}
function cpAuth(method, path, query) {
  const d = new Date(), p = (n) => String(n).padStart(2, "0");
  const dt = `${p(d.getUTCFullYear() % 100)}${p(d.getUTCMonth() + 1)}${p(d.getUTCDate())}T${p(d.getUTCHours())}${p(d.getUTCMinutes())}${p(d.getUTCSeconds())}Z`;
  const sig = crypto.createHmac("sha256", CPS).update(dt + method + path + query).digest("hex");
  return `CEA algorithm=HmacSHA256, access-key=${CPA}, signed-date=${dt}, signature=${sig}`;
}
async function coupangMatches(ours) {
  if (!CPA || !CPS) return [];
  const path = "/v2/providers/affiliate_open_api/apis/openapi/v1/products/search";
  const query = `keyword=${encodeURIComponent(ours.title.slice(0, 50))}&limit=10`;
  try {
    const r = await fetch(`https://api-gateway.coupang.com${path}?${query}`, { headers: { Authorization: cpAuth("GET", path, query), "Content-Type": "application/json" } });
    if (!r.ok) return [];
    const j = await r.json();
    return (j?.data?.productData || []).map((p) => ({ title: String(p.productName || ""), price: Number(p.productPrice || 0) })).filter((it) => it.price > 0 && isStrictMatch(ours, it.title));
  } catch { return []; }
}

async function compareDeal(d) {
  const ours = profile(d.product_name, Number(d.sale_price));
  // 가격 상식 게이트: 참조가가 우리값의 0.35~3배 밖이면 오매칭(부속·벌크)으로 보고 폐기
  const sane = (ref) => ref >= ours.price * 0.35 && ref <= ours.price * 3;
  const nv = cleanLowest(await naverMatches(ours));
  const cp = d.platform === "coupang" ? null : cleanLowest(await coupangMatches(ours));
  let nVal = nv && sane(nv.price) ? nv : null;
  let cVal = cp && sane(cp.price) ? cp : null;
  // 충돌 게이트: 두 몰이 다 있는데 참조가 1.8배↑ 차이 → 매칭 불신, 둘 다 폐기
  if (nVal && cVal) {
    const hi = Math.max(nVal.price, cVal.price), lo = Math.min(nVal.price, cVal.price);
    if (hi / lo > 1.8) { nVal = null; cVal = null; }
  }
  const result = {};
  if (nVal) { const v = verdict(ours.price, nVal.price); if (v) result.naver = { verdict: v, ref: nVal.price, n: nVal.n }; }
  if (cVal) { const v = verdict(ours.price, cVal.price); if (v) result.coupang = { verdict: v, ref: cVal.price, n: cVal.n }; }
  // 충돌 게이트2: 둘 다 판정인데 정반대(추천↔비추)면 폐기
  if (result.naver && result.coupang && result.naver.verdict !== result.coupang.verdict
      && result.naver.verdict !== "비슷" && result.coupang.verdict !== "비슷") return null;
  return Object.keys(result).length ? result : null;
}

const rest = (path, init = {}) => fetch(`${SUPA_URL}/rest/v1/${path}`, { ...init, headers: { ...H, ...(init.headers || {}) } });
// deal_archive 키: dealSlug(platform, productUrl) = `${platform}-${숫자ID}` (lib/slug.ts와 동일 규칙)
function dealSlug(platform, url) {
  const m = String(url || "").match(/(\d{6,})/);
  return m ? `${platform}-${m[1]}` : null;
}

(async () => {
  const mode = process.argv[2] || "run";
  const limit = Number(process.argv[3]) || 200;
  const deals = await (await rest(`deals?select=id,platform,product_name,sale_price,product_url&order=display_order.asc&limit=${limit}`)).json();
  if (!Array.isArray(deals)) { console.error("deals 조회 실패:", JSON.stringify(deals).slice(0, 200)); process.exit(1); }
  let judged = 0, wrote = 0;
  for (const d of deals) {
    let res = null;
    try { res = await compareDeal(d); } catch (e) { /* skip */ }
    const stamped = res ? { ...res, at: new Date().toISOString() } : null;
    if (res) {
      judged++;
      const parts = [];
      if (res.naver) parts.push(`네이버 ${res.naver.verdict}(${res.naver.ref.toLocaleString()})`);
      if (res.coupang) parts.push(`쿠팡 ${res.coupang.verdict}(${res.coupang.ref.toLocaleString()})`);
      console.log(`✓ [${d.platform}] ${String(d.product_name).slice(0, 38)} | 우리 ${Number(d.sale_price).toLocaleString()} → ${parts.join(", ")}`);
    }
    if (mode === "run") {
      // deals(카드/피드)
      const u1 = await rest(`deals?id=eq.${d.id}`, { method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ price_compare: stamped }) });
      if (u1.ok) wrote++;
      // deal_archive(상세페이지) — slug 매칭분만
      const slug = dealSlug(d.platform, d.product_url);
      if (slug) await rest(`deal_archive?slug=eq.${encodeURIComponent(slug)}`, { method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ price_compare: stamped }) });
    }
    await sleep(120); // API 매너(레이트리밋 여유)
  }
  console.log(`\n판정 ${judged}/${deals.length} (${Math.round((judged / deals.length) * 100)}%)${mode === "run" ? ` · DB기록 ${wrote}건` : " · dry(기록안함)"}`);
})();
