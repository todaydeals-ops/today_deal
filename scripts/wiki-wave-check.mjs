// 생활백과 웨이브 검수 — 게이트 + 숫자 대조 + 출처 링크 생존 + 연결 항목 검사를 한 번에 돌려 항목당 한 줄로 낸다.
// 사용: node scripts/wiki-wave-check.mjs <slug...>
//       node scripts/wiki-wave-check.mjs --wave 1          (candidates.txt 의 웨이브 N 전체, 파일이 있는 것만)
//
// 각 검사의 뜻(전부 집필 에이전트의 자기보고와 독립이다 — 순환 검증 금지):
//   게이트   scripts/wiki-verify.mjs (출처 수·기관 공식·금전 경고·문체·조사 과정 노출·묶음)
//   숫자     본문의 날짜·금액·비율 토큰이 인용한 facts(claim·caution) 안에 있는가. 없으면 지어냈을 가능성 → 사람이 본다.
//            (확인 날짜 "10월 27일" 같은 오늘 날짜는 제외)
//   링크     sources[].url 이 실제로 열리는가(403/429 는 봇 차단 의심으로 따로)
//   연결     related.entries 가 존재하는 항목이거나 후보 목록에 있는가(없는 slug 는 화면에 안 나온다)
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const ROOT = path.resolve(import.meta.dirname, "..");
const WIKI = path.join(ROOT, "content", "wiki");
const FACTS = path.join(ROOT, "content", "research", "facts");
const CAND = path.join(ROOT, "content", "research", "wave", "candidates.txt");
const TODAY = new Date(Date.now() + 9 * 3600_000).toISOString().slice(0, 10);
const [, tm, td] = TODAY.split("-").map(Number);
const TODAY_TOKENS = new Set([`${tm}월${td}일`, `${tm}월${td - 1}일`]);

const cands = fs.readFileSync(CAND, "utf8").split(/\r?\n/).filter((l) => l && !l.startsWith("#")).map((l) => { const [w, t, g, slug] = l.split("|"); return { w, t, g, slug }; });
const candSlugs = new Set(cands.map((c) => c.slug));

const args = process.argv.slice(2);
let slugs = args.filter((a) => !a.startsWith("--") && !/^\d+$/.test(a));
const wi = args.indexOf("--wave");
if (wi >= 0) slugs = cands.filter((c) => c.w === args[wi + 1]).map((c) => c.slug);
const existing = new Set(fs.readdirSync(WIKI).filter((f) => f.endsWith(".json")).map((f) => f.replace(/\.json$/, "")));
const missingFiles = slugs.filter((s) => !existing.has(s));
slugs = slugs.filter((s) => existing.has(s));

const facts = new Map();
for (const f of fs.readdirSync(FACTS)) {
  if (!f.endsWith(".json")) continue;
  try { for (const x of JSON.parse(fs.readFileSync(path.join(FACTS, f), "utf8")).facts ?? []) facts.set(x.id, x); } catch {}
}
const norm = (s) => s.replace(/\s+/g, "").replace(/,/g, "");
const TOK = /\d[\d,.]*\s*(?:월\s*\d{1,2}\s*일|만\s*\d*천?\s*원|천\s*원|억\s*원|조\s*[\d,.]*\s*천?\s*억?\s*원?|만\s*원|원|%|퍼센트|년|개월|일|세|종)/g;
const IGNORE = /^(?:\d{4}년|\d+세|[1-9]일)$/;

const urlCache = new Map();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function alive(u) {
  if (urlCache.has(u)) return urlCache.get(u);
  let st;
  try { st = (await fetch(u, { headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/130.0 Safari/537.36", "Accept-Language": "ko-KR" }, redirect: "follow", signal: AbortSignal.timeout(15000) })).status; }
  catch (e) { st = `ERR ${e.cause?.code || e.name}`; }
  urlCache.set(u, st);
  await sleep(500);
  return st;
}

let fails = 0;
const bad = [];
for (const slug of slugs) {
  const e = JSON.parse(fs.readFileSync(path.join(WIKI, `${slug}.json`), "utf8"));
  const issues = [];

  // 게이트
  const g = spawnSync("node", [path.join(ROOT, "scripts", "wiki-verify.mjs"), slug], { encoding: "utf8", cwd: ROOT });
  const gl = (g.stdout || "").split(/\r?\n/).find((l) => l.startsWith("✗") || l.startsWith("✓")) || "";
  if (g.status !== 0) issues.push("게이트 " + gl.replace(/^✗ \S+\s+/, "").slice(0, 160));

  // 숫자
  const body = [e.seoTitle, e.description, ...e.summary, ...e.infobox.map((r) => r.value),
    ...e.sections.flatMap((s) => s.blocks.flatMap((b) => b.p ?? b.note ?? b.list ?? b.steps ?? (b.table ? b.table.rows.flat() : []))),
    ...e.faq.flatMap((f) => [f.q, f.a])].join(" \n ");
  const ev = norm((e.facts ?? []).map((id) => { const x = facts.get(id); return x ? `${x.claim} ${x.caution ?? ""} ${x.cautionSource ?? ""}` : ""; }).join(" "));
  const extra = norm(JSON.stringify(e.apply ?? e.sale ?? {}));
  const miss = new Set();
  for (const m of body.matchAll(TOK)) {
    const t = norm(m[0]);
    if (IGNORE.test(t) || TODAY_TOKENS.has(t)) continue;
    if (!ev.includes(t) && !extra.includes(t)) miss.add(m[0].trim());
  }
  const unknown = (e.facts ?? []).filter((id) => !facts.has(id));
  if (unknown.length) issues.push(`없는 facts id ${unknown.length}개(${unknown.slice(0, 2).join(",")})`);
  if (!(e.facts ?? []).length) issues.push("facts 필드 비어 있음");
  if (miss.size) issues.push(`근거에 없는 숫자 ${miss.size}개: ${[...miss].slice(0, 8).join(" | ")}`);

  // 링크
  const dead = [];
  for (const s of e.sources) { const st = await alive(s.url); if (!(typeof st === "number" && st < 400)) dead.push(`${st} ${s.url.slice(0, 70)}`); }
  if (dead.length) issues.push(`링크 ${dead.length}개: ${dead.slice(0, 2).join(" ; ")}`);

  // 연결
  const dangling = (e.related?.entries ?? []).filter((s) => !existing.has(s) && !candSlugs.has(s));
  if (dangling.length) issues.push(`없는 연결 ${dangling.join(",")}`);

  const note = `${(e.sections.length)}섹션·출처${e.sources.length}·팩트${(e.facts ?? []).length}`;
  if (issues.length) { fails++; bad.push(slug); console.log(`⚠ ${slug}  (${note})\n     ${issues.join("\n     ")}`); }
  else console.log(`✓ ${slug}  (${note})`);
}
console.log(`\n검수 ${slugs.length}개 · 이상 없음 ${slugs.length - fails} · 확인 필요 ${fails}${missingFiles.length ? ` · 파일 없음 ${missingFiles.length}(${missingFiles.join(",")})` : ""}`);
if (bad.length) console.log("확인 필요: " + bad.join(" "));
