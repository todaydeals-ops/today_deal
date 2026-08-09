// 원고 검증 게이트 — 적재(draft-add) 전에 반드시 통과시킨다.
// 실측 기준: 본문 태그 제거 → 모든 공백 제거 → 글자수. (작성 에이전트의 자체 추정은 30~40% 과대라 신뢰 금지)
// 사용: node scripts/magazine-verify.mjs <원고.json> [...더 많은 파일]
//       node scripts/magazine-verify.mjs .work/pill-batch/p-*.json
// 통과 못 하면 exit 1 → 파이프라인에서 게이트로 쓸 수 있다.
import fs from "node:fs";

const MIN = 2300, MAX = 3200;      // 본문 글자수(공백 제외)
const FAQ_MIN = 4;                  // FAQ 최소 개수
const CALLOUT_MIN = 140;            // '짚고 가요' 최소 길이(사이드바가 비어 보이지 않게)
const VALID_CORNERS = ["smartguide", "factcheck", "trendlab", "repair"];

const strip = (s) => (s || "").replace(/<[^>]+>/g, "");
function bodyText(a) {
  let t = "";
  for (const b of a.blocks || []) {
    if (b.t === "p") t += strip(b.html) + " ";
    else if (b.t === "h2") t += (b.text || "") + " " + (b.sub || "") + " ";
    else if (b.t === "table") { t += (b.headers || []).join(" ") + " "; for (const r of b.rows || []) t += r.map(strip).join(" ") + " "; }
    else if (b.t === "numlist") t += (b.items || []).map(strip).join(" ") + " ";
    else if (b.t === "dtree") t += [b.title, b.q1, b.yes, b.q2, b.ya, b.na].map(strip).join(" ") + " ";
  }
  return t;
}
const cnt = (s) => strip(s).replace(/\s+/g, "").length;

// --fix-sources: sources[].label의 em-dash를 가운뎃점으로 자동 치환(본문은 손대지 않는다).
// 집필 에이전트가 라벨에만 em-dash를 남기는 일이 잦아 왕복을 줄이려는 장치.
const FIX = process.argv.includes("--fix-sources");
const files = process.argv.slice(2).filter((x) => !x.startsWith("--"));
if (!files.length) { console.error("원고 JSON 경로 필요"); process.exit(1); }

if (FIX) {
  let fixed = 0;
  for (const f of files) {
    if (!fs.existsSync(f)) continue;
    let j; try { j = JSON.parse(fs.readFileSync(f, "utf8")); } catch { continue; }
    const arts0 = j.articles || j;
    if (!Array.isArray(arts0)) continue; // 원고 파일이 아님(계획서 등) — 건너뜀
    for (const a of arts0) {
      for (const s of (a.sources || [])) {
        if (s.label && s.label.includes("—")) { s.label = s.label.replace(/\s*—\s*/g, " · "); fixed++; }
      }
    }
    fs.writeFileSync(f, JSON.stringify(j, null, 1));
  }
  if (fixed) console.log(`[--fix-sources] sources 라벨 em-dash ${fixed}건 치환\n`);
}

let total = 0, pass = 0;
const failures = [];
const seenSlug = new Map();

for (const f of files) {
  if (!fs.existsSync(f)) { console.error(`✗ 파일 없음: ${f}`); process.exitCode = 1; continue; }
  let j;
  try { j = JSON.parse(fs.readFileSync(f, "utf8")); }
  catch (e) { console.error(`✗ JSON 깨짐: ${f} — ${e.message}`); process.exitCode = 1; continue; }
  const arts = j.articles || j;
  if (!Array.isArray(arts)) continue; // 원고 파일이 아님(주제 계획서 등) — 조용히 건너뜀
  console.log(`\n${f.split(/[\\/]/).pop()} — ${arts.length}편`);
  console.log("slug".padEnd(34), "본문  h2 FAQ sum callout em  판정");
  for (const a of arts) {
    total++;
    const body = cnt(bodyText(a));
    const h2 = (a.blocks || []).filter((b) => b.t === "h2").length;
    const faq = (a.faq || []).length;
    const sum = (a.summary || []).length;
    const call = (a.callout || "").length;
    const em = (JSON.stringify(a).match(/—/g) || []).length;

    const bad = [];
    if (body < MIN || body > MAX) bad.push(`본문 ${body}`);
    if (faq < FAQ_MIN) bad.push(`FAQ ${faq}`);
    if (sum !== 3) bad.push(`summary ${sum}`);
    if (em > 0) bad.push(`em-dash ${em}`);
    if (call < CALLOUT_MIN) bad.push(`callout ${call}`);
    if (!a.field) bad.push("field 없음");
    if (!VALID_CORNERS.includes(a.corner)) bad.push(`corner ${a.corner}`);
    if (!(a.sources || []).length) bad.push("sources 0");
    // 파일 간 슬러그 중복(같은 배치에서 두 번 쓰면 적재 시 하나가 덮인다)
    if (seenSlug.has(a.slug)) bad.push(`slug 중복(${seenSlug.get(a.slug)})`);
    else seenSlug.set(a.slug, f.split(/[\\/]/).pop());

    const ok = bad.length === 0;
    if (ok) pass++; else failures.push(`${a.slug}: ${bad.join(", ")}`);
    console.log(
      (a.slug || "(slug 없음)").padEnd(34),
      String(body).padStart(4),
      String(h2).padStart(3),
      String(faq).padStart(3),
      String(sum).padStart(3),
      String(call).padStart(6),
      String(em).padStart(3),
      ok ? " ✓" : " ✗"
    );
  }
}

console.log(`\n판정: ${pass}/${total} 통과${failures.length ? ` · ${failures.length}편 재작업` : ""}`);
for (const f of failures) console.log("  ✗", f);
if (failures.length) {
  console.log(`\n기준: 본문 ${MIN}~${MAX}자(공백 제외) · FAQ ${FAQ_MIN}+ · summary 3문장 · callout ${CALLOUT_MIN}자+ · em-dash 0 · sources 1+`);
  process.exit(1);
}
