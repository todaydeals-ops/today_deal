// 가격비교 매칭 엔진 드라이런 — 라이브 타임딜에 네이버/쿠팡 비교를 시뮬.
// 목적: 커버리지(몇 %나 확신 판정 가능?)와 오판 위험 점검. DB 변경 없음.
import crypto from "node:crypto";

const SUPA_URL = process.env.SUPA_URL, SUPA_KEY = process.env.SUPA_KEY;
const NAVER_ID = process.env.NAVER_ID, NAVER_SECRET = process.env.NAVER_SECRET;
const CPA = process.env.COUPANG_ACCESS_KEY, CPS = process.env.COUPANG_SECRET_KEY;
const H = { apikey: SUPA_KEY, Authorization: `Bearer ${SUPA_KEY}` };
const strip = (s) => (s || "").replace(/<[^>]+>/g, "").trim();

// ── 토큰/시그니처 추출 ───────────────────────────────────────────
// 수량/용량 시그니처(가장 변별력 높음): "60개","210g","24입","1.2kg","500ml"
function qtyTokens(t) {
  const s = t.toLowerCase().replace(/\s+/g, "");
  const out = new Set();
  const re1 = /(\d+)(개입|개|입|팩|매|구|병|캔|포|장|롤|p)/g;
  const re2 = /(\d+(?:\.\d+)?)(ml|l|kg|g)/g;
  let m;
  while ((m = re1.exec(s))) out.add(m[1] + m[2]);
  while ((m = re2.exec(s))) out.add(m[1] + m[2]);
  return out;
}
// 모델코드: 영문2+숫자 섞인 코드(AX948BWE, SM-X, NA230)
function modelCode(t) {
  const m = t.toUpperCase().match(/\b([A-Z]{2,}[A-Z0-9-]*\d[A-Z0-9-]*)\b/);
  return m ? m[1] : null;
}
// 시리즈/4자리 숫자(필립스 5000 등)
function seriesNums(t) {
  const out = new Set();
  let m; const re = /\b(\d{3,4})\s*시리즈/g;
  while ((m = re.exec(t))) out.add(m[1]);
  return out;
}
// 브랜드/핵심 한글·영문 토큰(2자+)
function coreTokens(t) {
  return (t.toLowerCase().match(/[가-힣a-z0-9]{2,}/g) || []).filter(
    (w) => !/^\d+$/.test(w)
  );
}

// 후보가 우리 상품과 "확신 매칭"인지 — 매우 보수적으로(틀린 비추가 최악).
function isStrictMatch(ours, candTitle) {
  const c = candTitle.toLowerCase();
  const cU = candTitle.toUpperCase();
  // 변형/모음 상품은 비교 불가
  if (ours.generic) return false;
  // 식별 강도: 모델코드 OR 수량시그니처가 반드시 있어야(둘 다 없으면 비교 자체 포기)
  const hasId = !!ours.model || ours.qty.size > 0;
  if (!hasId) return false;
  // 1) 모델코드 있으면 반드시 일치
  if (ours.model && !cU.includes(ours.model)) return false;
  // 2) 시리즈 숫자 반드시 일치
  for (const s of ours.series) if (!candTitle.includes(s)) return false;
  // 3) 수량 시그니처 — 전부 일치 + 후보가 추가 수량을 더 갖지 않게(양방향)
  const cq = qtyTokens(candTitle);
  for (const q of ours.qty) if (!cq.has(q)) return false;
  // 4) 핵심어 유사도: 우리 토큰의 60%+ 공유 AND 최소 2개(모델 있으면 1개)
  const shared = ours.core.filter((w) => c.includes(w));
  const need = ours.model ? 1 : Math.max(2, Math.ceil(ours.core.length * 0.6));
  if (shared.length < need) return false;
  return true;
}

// 변형/모음 상품(낱개 비교 불가) — 판정 자체를 포기해야 정직
const GENERIC = /(외\b|모음|택\s*1|택일|골라담기|균일가|특가전|모음전|best|베스트|기획전|선택|\d종)/i;
// 광고 접두사·잡음 제거 → 핵심 상품명만 남겨 검색/매칭 정확도↑
const PROMO = /(단하루|깜짝|오늘만|타임특가|한정특가|신선집중|혜택가|최종가?|공식(운영|판매처?)|내일도착|품질보장|무료배송|사은품|증정|복수구매|결제할인|쿠폰|특가|최저가|당도선별|실중량|new|핫딜)/gi;
function cleanTitle(t) {
  return t
    .replace(/\([^)]*\)/g, " ") // (…) 제거
    .replace(/\[[^\]]*\]/g, " ") // […] 제거
    .replace(/\d+%|\d+,\d+원|\d+원/g, " ") // 가격/퍼센트 제거
    .replace(PROMO, " ")
    .replace(/[\/~]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
function profile(rawTitle) {
  const title = cleanTitle(rawTitle) || rawTitle;
  return {
    raw: rawTitle,
    title,
    generic: GENERIC.test(rawTitle),
    generic: GENERIC.test(title),
    model: modelCode(title),
    series: seriesNums(title),
    qty: qtyTokens(title),
    core: coreTokens(title).slice(0, 8),
  };
}

// ── 네이버 쇼핑 검색 ─────────────────────────────────────────────
async function naverLowest(ours) {
  const q = encodeURIComponent(ours.title.slice(0, 60));
  const r = await fetch(`https://openapi.naver.com/v1/search/shop.json?query=${q}&display=10&sort=asc`, {
    headers: { "X-Naver-Client-Id": NAVER_ID, "X-Naver-Client-Secret": NAVER_SECRET },
  });
  if (!r.ok) return { error: r.status };
  const j = await r.json();
  const items = (j.items || []).map((it) => ({ title: strip(it.title), price: Number(it.lprice), mall: it.mallName }));
  const matches = items.filter((it) => it.price > 0 && isStrictMatch(ours, it.title));
  return { matches, raw: items.length };
}

// ── 쿠팡 검색 ───────────────────────────────────────────────────
function cpAuth(method, path, query) {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  const dt = `${p(d.getUTCFullYear() % 100)}${p(d.getUTCMonth() + 1)}${p(d.getUTCDate())}T${p(d.getUTCHours())}${p(d.getUTCMinutes())}${p(d.getUTCSeconds())}Z`;
  const sig = crypto.createHmac("sha256", CPS).update(dt + method + path + query).digest("hex");
  return `CEA algorithm=HmacSHA256, access-key=${CPA}, signed-date=${dt}, signature=${sig}`;
}
async function coupangLowest(ours) {
  if (!CPA || !CPS) return { matches: [], raw: 0 };
  const path = "/v2/providers/affiliate_open_api/apis/openapi/v1/products/search";
  const query = `keyword=${encodeURIComponent(ours.title.slice(0, 50))}&limit=10`;
  try {
    const r = await fetch(`https://api-gateway.coupang.com${path}?${query}`, {
      headers: { Authorization: cpAuth("GET", path, query), "Content-Type": "application/json" },
    });
    if (!r.ok) return { matches: [], raw: 0, error: r.status };
    const j = await r.json();
    const items = (j?.data?.productData || []).map((p) => ({ title: String(p.productName || ""), price: Number(p.productPrice || 0) }));
    const matches = items.filter((it) => it.price > 0 && isStrictMatch(ours, it.title));
    return { matches, raw: items.length };
  } catch (e) {
    return { matches: [], raw: 0, error: String(e).slice(0, 40) };
  }
}

// 이상치/편차 게이트: 매칭 가격 편차가 크면(부속품·오류 혼입) 판정 포기.
function cleanLowest(matches) {
  if (!matches.length) return null;
  const prices = matches.map((m) => m.price).sort((a, b) => a - b);
  const med = prices[Math.floor(prices.length / 2)];
  // 중앙값 70~150% 밴드만 신뢰(낱개·부속·오류 컷)
  const band = matches.filter((m) => m.price >= med * 0.7 && m.price <= med * 1.5);
  if (band.length < 1) return null;
  const lo = Math.min(...band.map((m) => m.price));
  const hi = Math.max(...band.map((m) => m.price));
  // 밴드 내에서도 편차 2배 넘으면 단위혼입 의심 → 포기
  if (band.length >= 2 && hi / lo > 2) return null;
  return band.reduce((a, b) => (b.price < a.price ? b : a));
}

function verdict(our, ref) {
  if (ref == null) return null;
  const diff = (our - ref) / ref;
  if (diff <= -0.02) return "추천"; // 2%+ 저렴
  if (diff >= 0.02) return "비추"; // 2%+ 비쌈
  return "비슷";
}

// ── 실행 ────────────────────────────────────────────────────────
(async () => {
  // 플랫폼 섞어서 표본(11번가·G마켓은 상품명이 자세함)
  const pull = async (p, n) => (await (await fetch(`${SUPA_URL}/rest/v1/deals?platform=eq.${p}&select=platform,product_name,sale_price&order=display_order.asc&limit=${n}`, { headers: H })).json());
  const deals = [...await pull("11st", 10), ...await pull("gmarket", 10), ...await pull("coupang", 6)];
  let cover = 0;
  for (const d of deals) {
    const ours = profile(d.product_name);
    ours.price = Number(d.sale_price);
    const nv = await naverLowest(ours);
    const cp = d.platform === "coupang" ? { matches: [] } : await coupangLowest(ours);
    const nvLow = cleanLowest(nv.matches || []);
    const cpLow = cleanLowest(cp.matches || []);
    const vN = verdict(ours.price, nvLow?.price);
    const vC = verdict(ours.price, cpLow?.price);
    if (vN || vC) cover++;
    console.log(`\n[${d.platform}] ${d.product_name.slice(0, 42)}  →  우리 ${ours.price.toLocaleString()}원`);
    console.log(`   네이버: ${nvLow ? nvLow.price.toLocaleString() + "원 → " + vN + ` (${nv.matches.length}/${nv.raw} 매칭)` : `판정불가 (0/${nv.raw || 0})`}`);
    if (d.platform !== "coupang")
      console.log(`   쿠팡  : ${cpLow ? cpLow.price.toLocaleString() + "원 → " + vC + ` (${cp.matches.length}/${cp.raw} 매칭)` : `판정불가 (0/${cp.raw || 0})`}`);
  }
  console.log(`\n===== 커버리지: ${cover}/${deals.length} (${Math.round((cover / deals.length) * 100)}%) 한 곳 이상 판정 가능 =====`);
})();
