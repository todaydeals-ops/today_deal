// 핫딜글 드레이너 — 대기(__pending__) 커뮤니티 글을 "내가 각색한 결과"로 발행.
// 흐름: fetch N → (내가 각색) → apply <file>
//   apply: 각 글 = 제휴링크 재포장(지마켓 LinkPrice / 컬리·이마트·SSG ADBC) + 페르소나 + 발행(is_published=true)
// 사용:  node scripts/board-drain.mjs fetch 7
//        node scripts/board-drain.mjs apply .work/drain.json
// apply 입력: {"posts":[{"id","slug","title","body"}, ...]}
import fs from "node:fs";
(function loadEnv() {
  for (const f of ["/../.env.local", "/../crawler/.env"]) {
    try { const t = fs.readFileSync(`${import.meta.dirname}${f}`, "utf8");
      for (const l of t.split(/\r?\n/)) { const m = l.match(/^([A-Z0-9_]+)=(.*)$/); if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].trim(); } } catch {}
  }
})();
const S = process.env.NEXT_PUBLIC_SUPABASE_URL, K = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!S || !K) { console.error("SUPA env 필요"); process.exit(1); }
const H = { apikey: K, Authorization: `Bearer ${K}`, "Content-Type": "application/json" };
const rest = (p, i = {}) => fetch(`${S}/rest/v1/${p}`, { ...i, headers: { ...H, ...(i.headers || {}) } });
const PENDING = "__pending__";

// ── 제휴 재포장(lib/board/repackage.ts 인라인) ──
const ADBC_MEDIA = "959081531", AFF = "app1";
const ADBC_CMP = { ssg: "1259629521", emart: "450322980", ohou: "378130879", kurly: "1356118765" };
const adbc = (m, url, sub1) => `https://adbc.io/${ADBC_CMP[m]}/${ADBC_MEDIA}?sub1=${encodeURIComponent(sub1)}&aff_id=${AFF}&redirect=${encodeURIComponent(url)}`;
const LP_ID = process.env.LINKPRICE_AFFILIATE_ID;
const linkprice = (m, url) => (LP_ID ? `https://bestmore.net/click.php?${new URLSearchParams({ m, a: LP_ID, l: "9999", l_cd1: "3", l_cd2: "0", tu: url })}` : null);
function repackage(url, sub1) {
  try {
    const h = new URL(url).hostname.toLowerCase();
    if (h.endsWith("gmarket.co.kr") || h.endsWith("g9.co.kr")) return linkprice(process.env.LINKPRICE_GMARKET_MERCHANT || "gmarket", url);
    if (h === "kurly.com" || h.endsWith(".kurly.com")) return adbc("kurly", url, sub1);
    if (h === "emart.ssg.com") return adbc("emart", url, sub1);
    if (h.endsWith(".ssg.com") || h === "ssg.com") return adbc("ssg", url, sub1);
    if (h === "store.ohou.se" || h.endsWith(".ohou.se") || h === "ohou.se") return adbc("ohou", url, sub1);
    return null; // 11번가 미승인·쿠팡 정지 등 → 원본 유지
  } catch { return null; }
}

// ── 페르소나(표시 닉) ──
const PERSONAS = ["가성비요정", "지름신강림", "짠테크중", "직구고인물", "육아템헌터", "자취8년차", "캠핑가자", "겜돌이", "뷰티덕질", "헬스장출근", "주방템마스터", "최저가스나이퍼", "월급요정", "전자기기병", "오늘도텅장", "식탐대마왕", "패션피플", "꿀템수집가", "쿠폰장인", "신상가즈아", "살림9단", "여행적금중", "반려견아빠", "다이어터", "홈카페사장", "득템각", "프로세일러", "방구석평론가", "알뜰살뜰", "디지털노마드", "맘카페터줏대감", "건강챙겨", "초보집사", "테크리뷰러", "절약왕", "트렌드세터", "집순이템", "패밀리세일", "꼼꼼이"];
const hash = (s) => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; };
const personaFor = (seed) => PERSONAS[hash(seed || "") % PERSONAS.length];

// 하트비트 — "맥스(나)가 살아있음" 표시 → 서버 ingest가 각색을 내게 양보(키 폴백 발행 방지)
async function beat() {
  const now = new Date().toISOString();
  await rest("settings?on_conflict=key", { method: "POST", headers: { Prefer: "resolution=merge-duplicates" }, body: JSON.stringify({ key: "automation_heartbeat", value: { source: "local", at: now }, updated_at: now }) });
  return now;
}

// 재수집 — 서버 board-ingest 트리거(뽐뿌·루리웹 → 대기풀 적재). INGEST_SECRET 필요.
async function ingest() {
  const secret = process.env.INGEST_SECRET || process.env.CRON_SECRET;
  if (!secret) return { error: "no-secret" };
  try {
    const r = await fetch(`https://www.todaydeals.co.kr/api/cron/board-ingest?key=${encodeURIComponent(secret)}`, { signal: AbortSignal.timeout(60000) });
    const j = await r.json().catch(() => ({}));
    return { collected: j.collected, inserted: j.inserted };
  } catch (e) { return { error: String(e.message || e) }; }
}

async function fetchN(n) {
  const r = await rest(`board_deals?author=eq.${PENDING}&select=id,slug,shop,price,category,source_url,title,body&order=created_at.asc&limit=${n}`);
  const rows = await r.json();
  const out = (Array.isArray(rows) ? rows : []).map((x) => ({ id: x.id, slug: x.slug, shop: x.shop, price: x.price, category: x.category, persona: personaFor(x.slug), title: x.title, body: x.body }));
  console.log(JSON.stringify(out, null, 2));
}

async function apply(file) {
  const data = JSON.parse(fs.readFileSync(file, "utf8"));
  const posts = data.posts ?? data;
  let n = 0, repk = 0;
  for (const p of posts) {
    if (!p.id || !p.title) continue;
    // 원본 링크 재포장
    const cur = await (await rest(`board_deals?id=eq.${p.id}&select=source_url,original_url,slug`)).json();
    const row = Array.isArray(cur) ? cur[0] : null;
    if (!row) continue;
    const orig = row.original_url || row.source_url;
    const ours = repackage(orig, row.slug || p.slug || "board");
    if (ours) repk++;
    const patch = {
      title: String(p.title).slice(0, 60),
      body: p.body ? String(p.body).slice(0, 180) : null,
      author: personaFor(row.slug || p.slug || ""),
      is_published: true,
      created_at: new Date(Date.now() - Math.floor(Math.random() * 9) * 60_000).toISOString(), // 갓 올라온 글로(0~9분 분산)
      views: 1 + Math.floor(Math.random() * 4),
      ...(ours ? { source_url: ours, affiliate_url: ours, original_url: orig } : {}),
    };
    const r = await rest(`board_deals?id=eq.${p.id}`, { method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify(patch) });
    if (r.ok) n++;
  }
  console.log(`발행 ${n}건 (제휴재포장 ${repk}건)`);
}

const [cmd, arg] = process.argv.slice(2);
if (cmd === "fetch") await fetchN(Number(arg) || 7);
else if (cmd === "apply") { if (!arg) { console.error("apply <file>"); process.exit(1); } await apply(arg); }
else if (cmd === "cycle") {
  // 29분 루프 1회분: 하트비트 + 재수집 + 대기글 N개 출력(→ 내가 각색 → apply)
  const at = await beat();
  const ing = await ingest();
  console.error(`beat ${at} · ingest ${JSON.stringify(ing)}`);
  await fetchN(Number(arg) || 7);
} else console.error("cmd: fetch [n] | apply <file> | cycle [n]");
