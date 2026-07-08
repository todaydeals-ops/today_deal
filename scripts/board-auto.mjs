// 핫딜 게시판 완전 자동화 — 창 없이 4시간마다 Task Scheduler가 실행.
// 흐름: 하트비트 → 재수집(뽐뿌·루리웹) → 대기글 7개
//       → 네이버쇼핑 최저가 + 카카오카페 반응 보강
//       → Groq(무료) 각색 → 제휴재포장 → 발행
// 사용:  node scripts/board-auto.mjs [--dry]
import fs from "node:fs";
import { processText, naverShopSearch, kakaoSearch } from "../build/ai.mjs";

// ── .env.local 로드 ──
(function loadEnv() {
  for (const f of ["/../.env.local", "/../crawler/.env"]) {
    try {
      const t = fs.readFileSync(`${import.meta.dirname}${f}`, "utf8");
      for (const l of t.split(/\r?\n/)) { const m = l.match(/^([A-Z0-9_]+)=(.*)$/); if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].trim(); }
    } catch {}
  }
})();

const S = process.env.NEXT_PUBLIC_SUPABASE_URL, K = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!S || !K) { console.error("[board-auto] SUPA env 없음"); process.exit(1); }
const H = { apikey: K, Authorization: `Bearer ${K}`, "Content-Type": "application/json" };
const rest = (p, i = {}) => fetch(`${S}/rest/v1/${p}`, { ...i, headers: { ...H, ...(i.headers || {}) } });
const PENDING = "__pending__";
const dry = process.argv.includes("--dry");
const TAKE = 12;

// ── 제휴 재포장 ──
const ADBC_MEDIA = "959081531", AFF = "app1";
const ADBC_CMP = { ssg: "1259629521", emart: "450322980", ohou: "378130879", kurly: "1356118765", coupang: "211547715" };
const adbc = (m, url, sub1) => `https://adbc.io/${ADBC_CMP[m]}/${ADBC_MEDIA}?sub1=${encodeURIComponent(sub1)}&aff_id=${AFF}&redirect=${encodeURIComponent(url)}`;
const LP_ID = process.env.LINKPRICE_AFFILIATE_ID;
const linkprice = (m, url) => LP_ID ? `https://bestmore.net/click.php?${new URLSearchParams({ m, a: LP_ID, l: "9999", l_cd1: "3", l_cd2: "0", tu: url })}` : null;
const LINKPRICE_HOSTS = { "11st.co.kr": "11st", "auction.co.kr": "auction", "lotteon.com": "lotteon", "e-himart.co.kr": "himart", "hmall.com": "hmall", "lotteimall.com": "woori", "nsmall.com": "nsseshop", "gongyoungshop.kr": "gongyoung", "thirtymall.com": "thirtymall", "cjthemarket.com": "cjbrand", "wconcept.co.kr": "wconcept", "pulmuone.co.kr": "pulmuone", "hfashionmall.com": "hfashion", "clubclio.co.kr": "clubclio", "shein.com": "shein", "aliexpress.com": "aliexpress" };
function repackage(url, sub1) {
  try {
    const h = new URL(url).hostname.toLowerCase();
    if (h === "kurly.com" || h.endsWith(".kurly.com")) return adbc("kurly", url, sub1);
    if (h === "emart.ssg.com") return adbc("emart", url, sub1);
    if (h.endsWith(".ssg.com") || h === "ssg.com") return adbc("ssg", url, sub1);
    if (h === "store.ohou.se" || h.endsWith(".ohou.se") || h === "ohou.se") return adbc("ohou", url, sub1);
    if (h === "coupang.com" || h.endsWith(".coupang.com")) return adbc("coupang", url, sub1);
    if (h.endsWith("gmarket.co.kr") || h.endsWith("g9.co.kr")) return linkprice(process.env.LINKPRICE_GMARKET_MERCHANT || "gmarket", url);
    for (const sfx in LINKPRICE_HOSTS) if (h === sfx || h.endsWith("." + sfx)) return linkprice(LINKPRICE_HOSTS[sfx], url);
    return null;
  } catch { return null; }
}

// ── 페르소나 ──
const PERSONAS = ["가성비요정","지름신강림","짠테크중","직구고인물","육아템헌터","자취8년차","캠핑가자","겜돌이","뷰티덕질","헬스장출근","주방템마스터","최저가스나이퍼","월급요정","전자기기병","오늘도텅장","식탐대마왕","패션피플","꿀템수집가","쿠폰장인","신상가즈아","살림9단","여행적금중","반려견아빠","다이어터","홈카페사장","득템각","프로세일러","방구석평론가","알뜰살뜰","디지털노마드","맘카페터줏대감","건강챙겨","초보집사","테크리뷰러","절약왕","트렌드세터","집순이템","패밀리세일","꼼꼼이"];
const hash = (s) => { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h; };
const personaFor = (seed) => PERSONAS[hash(seed || "") % PERSONAS.length];

// ── 상품명에서 검색 키워드 추출 (옵션·용량·수량 제거) ──
function extractKeyword(title) {
  return title
    .replace(/\d+개입|\d+팩|\d+매|\d+롤|\d+g|\d+ml|\d+L|\d+kg|\d+매|\d+포/gi, "")
    .replace(/\(.*?\)/g, "")
    .replace(/,.*$/, "")          // 쉼표 뒤 옵션 제거
    .replace(/\s{2,}/g, " ")
    .trim()
    .slice(0, 30);
}

// ── 네이버 쇼핑 최저가 조회 ──
async function getNaverPrice(title, ourPrice) {
  if (!ourPrice || ourPrice <= 0) return null;
  try {
    const kw = extractKeyword(title);
    if (!kw || kw.length < 4) return null;
    const r = await naverShopSearch(kw, { display: 5 });
    if (!r.ok || !r.items.length) return null;
    // 숫자 가격만 있는 아이템
    const priced = r.items.filter(x => x.price && Number(x.price) > 0);
    if (!priced.length) return null;
    const minPrice = Math.min(...priced.map(x => Number(x.price)));
    const diff = minPrice - ourPrice; // 양수 = 우리가 더 저렴, 음수 = 우리가 더 비쌈
    const savePct = Math.round((diff / minPrice) * 100);
    return { minPrice, diff, savePct, mall: priced[0].mall };
  } catch { return null; }
}

// ── 카카오 카페 반응 조회 ──
async function getKakaoCafe(title) {
  try {
    const kw = extractKeyword(title) + " 핫딜";
    const r = await kakaoSearch(kw, { type: "cafe", size: 3 });
    if (!r.ok || !r.items.length) return null;
    // 카페명 모으기(중복제거)
    const cafes = [...new Set(r.items.map(x => x.cafe).filter(Boolean))].slice(0, 2);
    return { count: r.total, cafes };
  } catch { return null; }
}

// ── Groq 각색 (보강 컨텍스트 포함) ──
async function rewrite(post, enrich) {
  // 보강 컨텍스트 문자열 구성
  let ctx = "";
  if (enrich.naverPrice) {
    const { minPrice, diff, savePct } = enrich.naverPrice;
    if (diff > 500) {
      // 우리가 더 저렴 — 명확한 득템 포인트로 활용
      ctx += `\n• 가격비교: 네이버 최저가 ${minPrice.toLocaleString()}원보다 ${diff.toLocaleString()}원(${savePct}%) 저렴`;
    } else if (diff > -2000) {
      // 거의 비슷한 수준
      ctx += `\n• 가격비교: 네이버 최저가(${minPrice.toLocaleString()}원)와 비슷한 수준`;
    }
    // 우리가 확연히 더 비싼 경우(수량 차이 등)는 언급 안 함
  }
  if (enrich.cafe && enrich.cafe.count > 10) {
    const cafeStr = enrich.cafe.cafes.length ? `(${enrich.cafe.cafes.join(", ")} 등)` : "";
    ctx += `\n• 커뮤니티: 카카오 카페에서 ${enrich.cafe.count.toLocaleString()}건 이상 언급된 상품 ${cafeStr}`;
  }

  const prompt = `당신은 커뮤니티 핫딜 정보를 공유하는 "${post.persona}" 닉네임의 유저입니다.
아래 핫딜 정보와 추가 컨텍스트를 참고해 이 유저의 말투·성격으로 짧게 각색하세요.

규칙(절대 지킬 것):
- 상품명·가격·용량·수량 등 숫자 정보는 절대 변경 금지
- 쇼핑몰명 변경 금지
- 제목: 40자 이내 (상품명+핵심가격 포함)
- 본문: 1~2문장, 80자 이내
- 추가 컨텍스트(가격비교·커뮤니티 반응)는 자연스럽게 녹여도 좋고 안 써도 됨
- 과장/허위 금지, 출처(뽐뿌·루리웹 등) 언급 금지
- JSON만 출력 (설명 없이)

원본 핫딜:
제목: ${post.title}
본문: ${post.body || ""}
쇼핑몰: ${post.shop || ""}
가격: ${post.price ? post.price.toLocaleString() + "원" : ""}
${ctx ? "\n추가 컨텍스트:" + ctx : ""}

JSON 형식으로만 답하세요:
{"title":"각색된 제목","body":"각색된 본문"}`;

  const r = await processText(prompt);
  if (!r.ok || !r.text) return null;
  try {
    const m = r.text.match(/\{[\s\S]*?\}/);
    const j = JSON.parse(m ? m[0] : r.text);
    if (!j.title || !j.body) return null;
    return { title: String(j.title).slice(0, 60), body: String(j.body).slice(0, 180), via: r.via, ctx: ctx.trim() };
  } catch { return null; }
}

// ── 하트비트 ──
async function beat() {
  const now = new Date().toISOString();
  await rest("settings?on_conflict=key", { method: "POST", headers: { Prefer: "resolution=merge-duplicates" }, body: JSON.stringify({ key: "automation_heartbeat", value: { source: "board-auto", at: now }, updated_at: now }) });
}

// ── 재수집 트리거 ──
async function ingest() {
  const secret = process.env.INGEST_SECRET || process.env.CRON_SECRET;
  if (!secret) return;
  try {
    const r = await fetch(`https://www.todaydeals.co.kr/api/cron/board-ingest?key=${encodeURIComponent(secret)}`, { signal: AbortSignal.timeout(60000) });
    const j = await r.json().catch(() => ({}));
    console.log(`[ingest] collected=${j.collected} inserted=${j.inserted}`);
  } catch (e) { console.log("[ingest] 실패:", e.message); }
}

// ── 메인 ──
console.log(`[board-auto] 시작 ${new Date().toLocaleString("ko-KR")}${dry ? " (dry)" : ""}`);
await beat();
await ingest();

// 대기글 조회
const r = await rest(`board_deals?author=eq.${PENDING}&select=id,slug,shop,price,category,source_url,original_url,title,body&order=created_at.asc&limit=${TAKE}`);
const rows = await r.json();
const posts = (Array.isArray(rows) ? rows : []).map(x => ({ ...x, persona: personaFor(x.slug) }));
console.log(`[board-auto] 대기글 ${posts.length}건`);
if (!posts.length) { console.log("[board-auto] 대기글 없음. 종료."); process.exit(0); }

// 각 글: 보강 → 각색 → 발행
let published = 0, repacked = 0, failed = 0;
for (const post of posts) {
  // 네이버 쇼핑 + 카카오 카페 병렬 조회
  const [naverPrice, cafe] = await Promise.allSettled([
    getNaverPrice(post.title, post.price),
    getKakaoCafe(post.title),
  ]).then(rs => rs.map(r => r.status === "fulfilled" ? r.value : null));

  const enrich = { naverPrice, cafe };
  const enrichLog = [
    naverPrice ? `네이버최저가 ${naverPrice.minPrice?.toLocaleString()}원(${naverPrice.diff > 0 ? "+" : ""}${naverPrice.diff?.toLocaleString()})` : null,
    cafe?.count > 10 ? `카페반응 ${cafe.count}건` : null,
  ].filter(Boolean).join(" | ");

  const rewritten = await rewrite(post, enrich);
  if (!rewritten) { console.log(`  [skip] ${post.slug} — 각색 실패`); failed++; continue; }

  console.log(`  [${rewritten.via}] ${rewritten.title.slice(0, 35)}${enrichLog ? "  ← " + enrichLog : ""}`);
  if (dry) continue;

  // 제휴 재포장
  const orig = post.original_url || post.source_url;
  const ours = repackage(orig, post.slug || "board");
  if (ours) repacked++;

  const patch = {
    title: rewritten.title,
    body: rewritten.body,
    author: personaFor(post.slug),
    is_published: true,
    created_at: new Date(Date.now() - Math.floor(Math.random() * 9) * 60_000).toISOString(),
    views: 1 + Math.floor(Math.random() * 4),
    ...(ours ? { source_url: ours, affiliate_url: ours, original_url: orig } : {}),
  };
  const pr = await rest(`board_deals?id=eq.${post.id}`, { method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify(patch) });
  if (pr.ok) published++;
}

console.log(`[board-auto] 완료: 발행 ${published}건 / 재포장 ${repacked}건 / 실패 ${failed}건`);
