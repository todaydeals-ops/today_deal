// 발행된 글에 섹션을 **덧붙인다**(덮어쓰지 않는다).
//
// 왜 필요한가: AS 글의 검색 유입이 전부 "브랜드+증상" 롱테일이다
// (lg 인덕션 전원 안 켜짐 / 위닉스 제습기 물이 안 차요 / 실외기 물 떨어지는 소리).
// 그런데 144편 중 77편은 본문에 브랜드·모델·에러코드가 거의 없다.
// 새로 쓰는 것보다 이미 색인된 글에 모델별 표를 더하는 쪽이 훨씬 빠르게 반응한다.
//
// 입력 JSON:
// { "patches": [ {
//     "slug": "induction-selfcheck",
//     "h2": "제조사별 에러코드",
//     "sub": "선택",                       // h2 아래 회색 보조문
//     "intro": "<p 안에 들어갈 HTML>",
//     "table": { "headers": [...], "rows": [[...]] },
//     "outro": "선택 — 표 뒤 한 문단",
//     "sources": [ { "label": "[공식] ...", "url": "https://..." } ]
// } ] }
//
// 삽입 위치는 **마지막 마무리 문단 앞**이다. 글이 여전히 상담가 톤 마무리로 끝나게.
//   node scripts/magazine-augment.mjs .work/as-patch/xxx.json [--dry]
import fs from "node:fs";

(function loadEnv() {
  try {
    const t = fs.readFileSync(`${import.meta.dirname}/../.env.local`, "utf8");
    for (const l of t.split(/\r?\n/)) { const m = l.match(/^([A-Z0-9_]+)=(.*)$/); if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].trim(); }
  } catch {}
})();
const SUPA = process.env.NEXT_PUBLIC_SUPABASE_URL, KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPA || !KEY) { console.error("SUPA env 필요"); process.exit(1); }
const H = { apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" };
const DRY = process.argv.includes("--dry");

/* 렌더 헬퍼 — magazine-draft-add.mjs와 같은 토큰을 쓴다(폰트는 Pretendard로 통일). */
const MONO = "'Pretendard',-apple-system,BlinkMacSystemFont,sans-serif";
const P = (t) => `<p style="font-size:18px; line-height:1.95; color:#2c2a24; margin:18px 0 0;">${t}</p>`;
const H2 = (t) => `<h2 style="font-family:'Noto Serif KR',serif; font-weight:700; font-size:27px; letter-spacing:-0.6px; line-height:1.3; margin:44px 0 0; color:#16140f;">${t}</h2>`;
const SUB = (t) => `<p style="font-size:15px; line-height:1.8; color:#76726b; margin:10px 0 22px;">${t}</p>`;
const TABLE = (headers, rows) => {
  const gtc = headers.map((_, i) => (i === 0 ? "0.95fr" : "1fr")).join(" ");
  const head = `<div style="display:grid; grid-template-columns:${gtc}; background:#16140f; color:#fff; font-family:${MONO}; font-size:11px;">${headers.map((h) => `<div style="padding:12px 14px;">${h}</div>`).join("")}</div>`;
  const body = rows.map((row, ri) => `<div style="display:grid; grid-template-columns:${gtc}; border-top:1px solid rgba(22,20,15,0.08); font-size:13px;${ri % 2 ? " background:#faf8f5;" : ""}">${row.map((c, ci) => `<div style="padding:12px 14px; line-height:1.55;${ci === 0 ? " font-weight:700; color:#16140f;" : " color:#46433d;"}">${c}</div>`).join("")}</div>`).join("");
  return `<div style="margin-top:22px;"><div style="border:1px solid rgba(22,20,15,0.14); border-radius:12px; overflow:hidden;">${head}${body}</div></div>`;
};

const railSplit = (html) => {
  const m = (html || "").match(/^\s*<!--RAIL:([\s\S]*?)-->\s*/);
  if (!m) return { rail: {}, head: "", body: html || "" };
  let rail = {}; try { rail = JSON.parse(m[1]); } catch {}
  return { rail, head: m[0], body: (html || "").slice(m[0].length) };
};

/** 마지막 <p ...>…</p> 앞에 끼워 넣는다. 없으면 맨 뒤에 붙인다. */
function insertBeforeClosing(body, chunk) {
  const idx = body.lastIndexOf("<p style=");
  if (idx === -1) return body + chunk;
  return body.slice(0, idx) + chunk + "\n" + body.slice(idx);
}

const file = process.argv[2];
if (!file) { console.error("패치 JSON 경로 필요"); process.exit(1); }
const patches = (JSON.parse(fs.readFileSync(file, "utf8")).patches) ?? [];

// ── 적재 전 게이트 ──
// 출처 없는 표가 그대로 통과한 사고가 있었다(2026-08-10 주방가전 배치).
// 존재하지 않는 브랜드("보어드뮤쉘레"), 없는 제품("LG 정수기형 그릴"),
// 해로운 조언("그라인더 날에 올리브유")이 11개 표 중 7개에 출처 0으로 들어왔다.
// 에러코드·모델 정보는 틀리면 독자가 헛수고한다. 기계로 막는다.
const OFFICIAL = /samsungsvc|samsung\.com|lge?\.co\.kr|lg\.com|winix|coway|chungho|skmagic|cuckoo|cuchen|rinnai|kdnavien|kyungdong|philips|tefal|delonghi|dyson|iptime|efm|asus|tp-link|netgear|kt\.com|skbroadband|lguplus|kitchenaid|whirlpool|electrolux|bosch-home|miele|breville|balmuda|xiaomi|lotte|winia|caraz|hanssem|\.go\.kr|\.or\.kr/i;
const bad = [];
for (const p of patches) {
  const src = (p.sources || []).filter((s) => s && s.url);
  if (!src.length) { bad.push(`${p.slug}: 출처 0`); continue; }
  if (!src.some((s) => OFFICIAL.test(s.url))) bad.push(`${p.slug}: 제조사·공공 공식 출처 없음(${src.map((s) => s.url).join(", ").slice(0, 60)})`);
  const flat = JSON.stringify(p);
  if (flat.includes("—")) bad.push(`${p.slug}: em-dash 혼입`);
  if (/[一-鿿぀-ヿ]/.test(flat)) bad.push(`${p.slug}: 한자·일본어 혼입`);
  if ((p.table?.rows || []).length < 3) bad.push(`${p.slug}: 표 ${(p.table?.rows || []).length}행(3행 미만)`);
}
if (bad.length) {
  console.error("✖ 적재 거부. 아래를 고쳐라.\n");
  for (const b of bad) console.error("   " + b);
  console.error("\n출처 없는 표는 적용하지 않는다. 확인 못 한 항목은 표에서 빼라.");
  process.exit(1);
}

let done = 0, skip = 0, fail = 0;
for (const p of patches) {
  const r = await fetch(`${SUPA}/rest/v1/magazine?slug=eq.${encodeURIComponent(p.slug)}&select=slug,body_html`, { headers: H });
  const rows = await r.json();
  if (!Array.isArray(rows) || !rows.length) { console.log(`  ✖ 없음 ${p.slug}`); fail++; continue; }

  const { rail, head, body } = railSplit(rows[0].body_html);
  // 같은 h2를 이미 넣었으면 건너뛴다 — 두 번 돌려도 중복 삽입되지 않게.
  if (body.includes(`>${p.h2}</h2>`)) { console.log(`  – 이미 있음 ${p.slug}`); skip++; continue; }

  const chunk =
    H2(p.h2) + (p.sub ? SUB(p.sub) : "") +
    (p.intro ? P(p.intro) : "") +
    (p.table ? TABLE(p.table.headers, p.table.rows) : "") +
    (p.outro ? P(p.outro) : "");

  const newBody = insertBeforeClosing(body, chunk);

  // 출처는 RAIL sources에 합친다(URL 기준 중복 제거).
  const seen = new Set((rail.sources || []).map((s) => s.url));
  for (const s of p.sources || []) if (!seen.has(s.url)) { (rail.sources ||= []).push(s); seen.add(s.url); }

  const body_html = `<!--RAIL:${JSON.stringify(rail)}-->\n` + newBody;
  const added = chunk.replace(/<[^>]+>/g, "").replace(/\s+/g, "").length;
  console.log(`  ✓ ${p.slug.padEnd(34)} +${added}자 · 표 ${p.table ? p.table.rows.length + "행" : "없음"}`);
  if (DRY) { done++; continue; }

  const up = await fetch(`${SUPA}/rest/v1/magazine?slug=eq.${encodeURIComponent(p.slug)}`, {
    method: "PATCH", headers: { ...H, Prefer: "return=minimal" }, body: JSON.stringify({ body_html }),
  });
  up.ok ? done++ : (fail++, console.log(`      PATCH 실패 ${up.status}`));
}
console.log(`\n${DRY ? "(dry) " : ""}보강 ${done} · 스킵 ${skip} · 실패 ${fail}`);
