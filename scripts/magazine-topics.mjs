// 매거진 주제 레지스트리 — 기발행·재고·조사분 주제를 한데 모아 "중복 주제 발굴"을 막는 장치.
// 콘텐츠가 수백 편으로 늘면 눈으로 훑는 방식은 한계라, 조사 착수 전 이 도구로 겹침을 자동 대조한다.
//
// 데이터 소스 3종:
//   1) DB magazine 테이블  → 발행(is_published=true) / 재고(false)
//   2) content/research/facts/*.json → '조사만'(팩트는 있는데 아직 집필·적재 안 됨 = 파이프라인 누락)
//
// 사용:
//   node scripts/magazine-topics.mjs                      전체 인벤토리(코너별·상태별)
//   node scripts/magazine-topics.mjs --gaps               '조사만'(집필 안 된 조사분)만
//   node scripts/magazine-topics.mjs --check "삼각대,rug carpet,커피 그라인더"
//        후보 주제(콤마구분)가 기존과 겹치는지 대조. 강한 충돌이 있으면 exit 3(스크립트 게이트용).
//   node scripts/magazine-topics.mjs --json               기계가 읽을 전체 목록(JSON)
import fs from "node:fs";
(function loadEnv() {
  try {
    const t = fs.readFileSync(`${import.meta.dirname}/../.env.local`, "utf8");
    for (const l of t.split(/\r?\n/)) { const m = l.match(/^([A-Z0-9_]+)=(.*)$/); if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].trim(); }
  } catch { /* 무시 */ }
})();
const SB = process.env.NEXT_PUBLIC_SUPABASE_URL, KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SB || !KEY) { console.error("SUPA env 필요"); process.exit(1); }
const H = { apikey: KEY, Authorization: `Bearer ${KEY}` };

const CORNERS = [["repair", "AS셀프체크"], ["factcheck", "팩트체크"], ["trendlab", "트렌드랩"], ["smartguide", "스마트가이드"]];
// 슬러그·주제에서 의미 없는 꼬리표(코너 유형어). 토큰 비교 시 제거해 '주제 본질'만 남긴다.
const STOP = new Set(["selfcheck", "self", "check", "guide", "guide2", "trend", "factcheck", "fact", "compare",
  "longrun", "care", "vs", "buying", "types", "type", "worth", "it", "reset", "error", "code", "diagnosis",
  "the", "a", "for", "of", "and", "to", "how", "your", "with", "best", "review", "vs.", "vs2"]);

const slugTokens = (slug) => String(slug).toLowerCase().split(/[^a-z0-9]+/).filter((w) => w && !STOP.has(w));
const hangulChunks = (s) => String(s).toLowerCase().match(/[가-힣]{2,}/g) || []; // 한글 2자 이상 덩어리

const FACTS_DIR = `${import.meta.dirname}/../content/research/facts`;

const args = process.argv.slice(2);
const MODE = args.find((a) => a.startsWith("--")) || "";
const CHECK = args.includes("--check") ? (args[args.indexOf("--check") + 1] || "") : "";

// ── 코퍼스 구축 ──────────────────────────────────────────────
async function buildCorpus() {
  // DB: 발행/재고
  const r = await fetch(`${SB}/rest/v1/magazine?corner=neq.report&select=slug,corner,title,is_published,body_html`, { headers: H });
  const rows = await r.json();
  if (!Array.isArray(rows)) { console.error("DB 조회 실패"); process.exit(1); }

  const bySlug = new Map();
  const dbSlugLower = new Set(); // 대소문자 무시 대조용
  for (const x of rows) dbSlugLower.add(String(x.slug).toLowerCase());
  for (const x of rows) {
    let tags = [];
    const m = String(x.body_html || "").match(/^\s*<!--RAIL:([\s\S]*?)-->/);
    if (m) { try { const rail = JSON.parse(m[1]); if (Array.isArray(rail.tags)) tags = rail.tags; } catch { /* 무시 */ } }
    bySlug.set(x.slug, {
      slug: x.slug, corner: x.corner, title: x.title || "", tags,
      status: x.is_published ? "발행" : "재고",
    });
  }

  // 팩트 파일: 조사만(DB에 없는 것) — 파일명 접두어(공통_/apple_/samsung_…) 뒤가 슬러그
  let factsFiles = [];
  try { factsFiles = fs.readdirSync(FACTS_DIR).filter((f) => f.endsWith(".json")); } catch { /* 무시 */ }
  for (const f of factsFiles) {
    const raw = f.replace(/\.json$/, "");
    // 접두어 처리: '공통_x'는 x가 슬러그, 'lg_x'는 DB에서 'lg-x'(브랜드가 슬러그 일부)일 수 있다.
    // 두 형태 모두로 DB를 대조해, 브랜드 접두어 파일이 오탐(조사만)으로 잡히는 걸 막는다.
    const stripped = raw.replace(/^[^_]+_/, "");  // 공통_x→x, lg_x→x
    const hyphenedAll = raw.replace(/_/g, "-");     // lg_styler_selfcheck→lg-styler-selfcheck, HP_x→HP-x
    // 접두어 제거형 + 전체 언더스코어→하이픈형을, 대소문자 무시로 DB와 대조(표기 흔들림 흡수)
    const forms = [stripped, hyphenedAll].map((s) => s.toLowerCase());
    if (forms.some((s) => dbSlugLower.has(s))) continue; // 이미 DB(발행/재고)에 있으면 그 상태 유지
    let topic = "";
    try { topic = JSON.parse(fs.readFileSync(`${FACTS_DIR}/${f}`, "utf8")).topic || ""; } catch { /* 무시 */ }
    bySlug.set(stripped, { slug: stripped, corner: "?", title: topic, tags: [], status: "조사만", factsFile: f });
  }
  return [...bySlug.values()];
}

// ── 후보 대조(중복 탐지) ─────────────────────────────────────
// 후보 문자열 하나를 코퍼스 전체와 비교해 겹침 점수를 매긴다.
function collisions(candidate, corpus) {
  const cTokens = new Set(slugTokens(candidate));
  const cHangul = hangulChunks(candidate);
  const hits = [];
  for (const e of corpus) {
    const eTokens = new Set(slugTokens(e.slug));
    let overlap = 0;
    for (const t of cTokens) if (eTokens.has(t)) overlap++;
    // 한글: 후보의 한글 덩어리가 상대 제목·태그에 들어가면 가점
    const hay = (e.title + " " + e.tags.join(" ")).toLowerCase();
    let korHit = 0;
    for (const k of cHangul) if (hay.includes(k)) korHit++;
    // 영문 토큰이 제목/태그(영문 표기)에 substring으로 들어가는 경우도 약하게 반영
    let engInTitle = 0;
    for (const t of cTokens) if (t.length >= 3 && hay.includes(t)) engInTitle++;
    const score = overlap * 2 + korHit * 2 + engInTitle;
    if (score >= 2) hits.push({ ...e, score, overlap, korHit });
  }
  return hits.sort((a, b) => b.score - a.score).slice(0, 6);
}

// ── 실행 ─────────────────────────────────────────────────────
const corpus = await buildCorpus();
const badge = (s) => (s === "발행" ? "📗발행" : s === "재고" ? "📦재고" : "🔬조사만");

if (MODE === "--json") {
  console.log(JSON.stringify(corpus, null, 2));
  process.exit(0);
}

if (CHECK) {
  const cands = CHECK.split(",").map((s) => s.trim()).filter(Boolean);
  let strong = 0;
  console.log(`\n[중복 대조] 후보 ${cands.length}개\n${"─".repeat(50)}`);
  for (const c of cands) {
    const hits = collisions(c, corpus);
    if (!hits.length) { console.log(`\n✅ "${c}" — 겹침 없음, 신규 주제로 적합`); continue; }
    const hard = hits.filter((h) => h.score >= 4);
    if (hard.length) strong++;
    console.log(`\n${hard.length ? "⛔" : "⚠️ "} "${c}" — 유사 ${hits.length}건${hard.length ? " (강한 충돌!)" : ""}`);
    for (const h of hits) console.log(`   ${badge(h.status)} [${h.corner}] ${h.slug}  «${(h.title || "").slice(0, 30)}»  (점수 ${h.score})`);
  }
  console.log(`\n${"─".repeat(50)}\n강한 충돌 후보: ${strong}개 ${strong ? "→ 재검토 권장" : "→ 없음"}`);
  process.exit(strong ? 3 : 0);
}

// --gaps: 조사만(집필 안 된 조사분)
if (MODE === "--gaps") {
  const gaps = corpus.filter((e) => e.status === "조사만");
  console.log(`\n[조사만 = 팩트는 있는데 집필·적재 안 된 주제] ${gaps.length}건`);
  if (!gaps.length) console.log("   (없음 — 모든 조사분이 파이프라인에 반영됨)");
  for (const g of gaps.sort((a, b) => a.slug.localeCompare(b.slug))) console.log(`   🔬 ${g.slug}  «${(g.title || "").slice(0, 40)}»  [${g.factsFile}]`);
  process.exit(0);
}

// 기본: 전체 인벤토리
const pub = corpus.filter((e) => e.status === "발행").length;
const stock = corpus.filter((e) => e.status === "재고").length;
const only = corpus.filter((e) => e.status === "조사만").length;
console.log(`\n${"─".repeat(50)}\n 매거진 주제 레지스트리 · 총 ${corpus.length}개 주제\n 📗발행 ${pub} · 📦재고 ${stock} · 🔬조사만 ${only}\n${"─".repeat(50)}`);
for (const [key, name] of CORNERS) {
  const list = corpus.filter((e) => e.corner === key).sort((a, b) => a.slug.localeCompare(b.slug));
  console.log(`\n[${name}] ${list.length}개`);
  for (const e of list) console.log(`   ${badge(e.status)} ${e.slug}`);
}
const orphan = corpus.filter((e) => e.corner === "?");
if (orphan.length) {
  console.log(`\n[코너 미상(조사만)] ${orphan.length}개`);
  for (const e of orphan.sort((a, b) => a.slug.localeCompare(b.slug))) console.log(`   🔬 ${e.slug}  «${(e.title || "").slice(0, 36)}»`);
}
console.log(`\n${"─".repeat(50)}`);
console.log(`중복 대조:  node scripts/magazine-topics.mjs --check "후보1,후보2"`);
console.log(`${"─".repeat(50)}\n`);
