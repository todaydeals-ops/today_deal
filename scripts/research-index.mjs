// 리서치 팩트 색인 생성기 — content/research/facts/*.json → INDEX.md
// 닥스노트 v2(26편 실측판) 이식 + 오늘의딜 도메인 개선 4가지:
//   ① scope 구조화 검사 (brand/category/years) — 우리 층위 혼동은 전부 "어느 모델·연식·지역"에서 남
//   ② evidence 축 (공식/후기/실측) — 글의 [공식]/[후기] 라벨과 연동
//   ③ 링크 부패 검사 (--check-urls) — 공식 링크를 글에 노출하므로 죽은 링크 = 품질 사고
//   ④ 톤 강제 표시 — tier=논쟁 / evidence=후기 팩트는 "순차 대안 톤" 대상으로 INDEX에 표시
//
// 사용: node scripts/research-index.mjs [--check-urls]
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const FACTS_DIR = path.join(ROOT, "content/research/facts");
const OUT = path.join(ROOT, "content/research/INDEX.md");
const CHECK_URLS = process.argv.includes("--check-urls");

if (!fs.existsSync(FACTS_DIR)) {
  fs.mkdirSync(FACTS_DIR, { recursive: true });
  console.log("facts 디렉토리를 생성했습니다:", FACTS_DIR);
}

const files = fs.readdirSync(FACTS_DIR).filter((f) => f.endsWith(".json"));
const byBrand = {};
const tierCount = { 확실: 0, 논쟁: 0, 확인실패: 0 };
const evidenceCount = { 공식: 0, 후기: 0, 실측: 0 };
const seenIds = new Map();
const reverseIndex = {};   // fact id → 인용한 조사[]
const disputes = [];
const allFacts = [];
const problems = { dupId: [], noCautionSrc: [], missingField: [], badScope: [], badTier: [], deadUrl: [], stale: [] };

// caution에 수치·기준·연식·코드가 있는데 cautionSource가 없으면 = 출처 없는 숫자의 세탁 경로
const 수치패턴 = /\d+\s*(%|퍼센트|배|회|년|년형|개월|주|일|초|분|원|만원|cm|mm|도|℃)|20\d{2}|[A-Z]{1,2}\s?\d{1,3}(?![0-9])/;
const REQ_ARRAYS = ["reused_facts", "declined_facts", "disputes"];
const REQ_FACT = ["id", "claim", "tier", "evidence", "source", "scope"];
const SCOPE_REQ = ["brand", "category"];
const TIERS = ["확실", "논쟁", "확인실패"];
const EVIDENCES = ["공식", "후기", "실측"];
const STALE_DAYS = 365; // 제조사 문서·모델 정보는 1년 지나면 재확인 권고

const today = new Date();
const daysSince = (d) => {
  const t = Date.parse(d);
  return Number.isNaN(t) ? null : Math.floor((today - t) / 86400000);
};

for (const f of files) {
  let j;
  try {
    j = JSON.parse(fs.readFileSync(path.join(FACTS_DIR, f), "utf8"));
  } catch (e) {
    console.error(`  ❌ 파싱 실패 ${f}: ${e.message}`);
    continue;
  }
  const brand = j.brand || "미분류";
  (byBrand[brand] ||= []).push({ ...j, _file: f });

  for (const req of REQ_ARRAYS) if (!Array.isArray(j[req])) problems.missingField.push(`${f} → ${req}`);
  for (const rid of j.reused_facts || []) (reverseIndex[rid] ||= []).push(j.topic || f);
  for (const d of j.disputes || []) disputes.push({ from: j.topic || f, ...d });

  for (const fact of j.facts || []) {
    // 필수 필드
    for (const k of REQ_FACT) if (!fact[k]) problems.missingField.push(`${f} → facts.${fact.id || "?"}.${k}`);
    // 중복 id
    if (fact.id) {
      if (seenIds.has(fact.id)) problems.dupId.push(`${fact.id} (${seenIds.get(fact.id)} ↔ ${f})`);
      else seenIds.set(fact.id, f);
    }
    // tier / evidence 값 검증
    if (fact.tier && !TIERS.includes(fact.tier)) problems.badTier.push(`${fact.id}: tier="${fact.tier}"`);
    if (fact.evidence && !EVIDENCES.includes(fact.evidence)) problems.badTier.push(`${fact.id}: evidence="${fact.evidence}"`);
    // scope 구조화 (우리 개선 ①)
    if (fact.scope) {
      if (typeof fact.scope !== "object") problems.badScope.push(`${fact.id}: scope가 객체가 아님(층위 혼동 위험)`);
      else for (const k of SCOPE_REQ) if (!fact.scope[k]) problems.badScope.push(`${fact.id}: scope.${k} 누락`);
    }
    // cautionSource
    if (fact.caution && 수치패턴.test(fact.caution) && !fact.cautionSource) problems.noCautionSrc.push(`${fact.id} (${f})`);
    // 신선도
    const age = fact.checked ? daysSince(fact.checked) : null;
    if (age !== null && age > STALE_DAYS) problems.stale.push(`${fact.id} — ${age}일 전 확인(${fact.checked})`);

    if (fact.tier && tierCount[fact.tier] !== undefined) tierCount[fact.tier]++;
    if (fact.evidence && evidenceCount[fact.evidence] !== undefined) evidenceCount[fact.evidence]++;
    allFacts.push({ ...fact, _file: f, _brand: brand });
  }
}

// ── 링크 부패 검사 (우리 개선 ③) ─────────────────────────
if (CHECK_URLS) {
  const urls = [...new Set(allFacts.map((f) => f.source_url).filter(Boolean))];
  console.log(`링크 생존 검사 ${urls.length}건…`);
  for (const u of urls) {
    try {
      const r = await fetch(u, { method: "GET", redirect: "follow", headers: { "User-Agent": "Mozilla/5.0" }, signal: AbortSignal.timeout(12000) });
      if (!r.ok) {
        const users = allFacts.filter((f) => f.source_url === u).map((f) => f.id);
        problems.deadUrl.push(`HTTP ${r.status} — ${u}\n      인용 팩트: ${users.join(", ")}`);
      }
    } catch {
      const users = allFacts.filter((f) => f.source_url === u).map((f) => f.id);
      problems.deadUrl.push(`접속 실패 — ${u}\n      인용 팩트: ${users.join(", ")}`);
    }
  }
}

const esc = (s) => String(s ?? "").replace(/\|/g, "\\|").replace(/\n/g, " ");
const L = [];
L.push("# 리서치 팩트 색인", "");
L.push("> 자동 생성 파일. 직접 수정하지 마세요. `node scripts/research-index.mjs`로 갱신합니다.");
L.push("> **기계적 대조 기준은 이 파일이 아니라 `facts/*.json` 원본입니다.**", "");
L.push(`생성: ${today.toISOString().slice(0, 10)} · 조사 ${files.length}건 · 팩트 ${allFacts.length}개`, "");

// ── 무결성 경고를 최상단에 ────────────────────────────────
const problemCount = Object.values(problems).reduce((s, a) => s + a.length, 0);
if (problemCount) {
  L.push("## ⚠️ 무결성 경고", "");
  const label = {
    dupId: "중복 id",
    noCautionSrc: "cautionSource 누락 (caution에 수치·연식·코드가 있는데 근거 없음)",
    missingField: "필수 필드 누락",
    badScope: "scope 구조 문제 (층위 혼동 위험)",
    badTier: "tier/evidence 값 오류",
    deadUrl: "링크 부패",
    stale: `${STALE_DAYS}일 초과 — 재확인 권고`,
  };
  for (const [k, arr] of Object.entries(problems)) {
    if (!arr.length) continue;
    L.push(`### ${label[k]} (${arr.length})`, "");
    for (const x of arr.slice(0, 30)) L.push(`- ${x}`);
    if (arr.length > 30) L.push(`- …외 ${arr.length - 30}건`);
    L.push("");
  }
}

// ── 미해결 분쟁 ───────────────────────────────────────────
if (disputes.length) {
  L.push("## 🔴 미해결 분쟁 (총괄 판정 필요)", "");
  L.push("| 신고자 | 대상 팩트 | 문제 | 근거 |", "|---|---|---|---|");
  for (const d of disputes) L.push(`| ${esc(d.from)} | \`${esc(d.targetId)}\` | ${esc(d.problem)} | ${esc(d.evidence)} |`);
  L.push("");
}

// ── 통계 ─────────────────────────────────────────────────
L.push("## 통계", "");
L.push(`- 확신도: 확실 ${tierCount.확실} · 논쟁 ${tierCount.논쟁} · 확인실패 ${tierCount.확인실패}`);
L.push(`- 근거: 공식 ${evidenceCount.공식} · 후기 ${evidenceCount.후기} · 실측 ${evidenceCount.실측}`);
const toneTargets = allFacts.filter((f) => f.tier === "논쟁" || f.evidence === "후기");
L.push(`- **순차 대안 톤 대상: ${toneTargets.length}개** (tier=논쟁 또는 evidence=후기 → "먼저 해보고 안 되면" 서술 필수)`, "");

// ── 브랜드별 팩트 ─────────────────────────────────────────
for (const [brand, arr] of Object.entries(byBrand).sort()) {
  L.push(`## ${brand}`, "");
  for (const j of arr) {
    L.push(`### ${j.topic || j._file} <sub>${j.captured || ""} · ${j.article || "예정"}</sub>`, "");
    if (!j.facts?.length) { L.push("_(팩트 없음)_", ""); continue; }
    L.push("| id | 확신도 | 근거 | claim | 적용 범위 |", "|---|---|---|---|---|");
    for (const f of j.facts) {
      const sc = f.scope && typeof f.scope === "object"
        ? [f.scope.brand, f.scope.category, f.scope.line, f.scope.years, f.scope.region].filter(Boolean).join(" / ")
        : esc(f.scope);
      const tone = f.tier === "논쟁" || f.evidence === "후기" ? " 🔶" : "";
      L.push(`| \`${esc(f.id)}\` | ${esc(f.tier)}${tone} | ${esc(f.evidence)} | ${esc(f.claim)} | ${esc(sc)} |`);
    }
    L.push("");
  }
}

// ── 역색인 ───────────────────────────────────────────────
if (Object.keys(reverseIndex).length) {
  L.push("## 역색인 — 이 팩트가 바뀌면 함께 고칠 조사", "");
  L.push("| 팩트 id | 인용한 조사 |", "|---|---|");
  for (const [id, users] of Object.entries(reverseIndex).sort()) L.push(`| \`${esc(id)}\` | ${users.map(esc).join(", ")} |`);
  L.push("");
}

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, L.join("\n"));

console.log(`✓ INDEX 생성: 조사 ${files.length}건 · 팩트 ${allFacts.length}개`);
console.log(`  확신도: 확실 ${tierCount.확실} / 논쟁 ${tierCount.논쟁} / 확인실패 ${tierCount.확인실패}`);
console.log(`  근거: 공식 ${evidenceCount.공식} / 후기 ${evidenceCount.후기} / 실측 ${evidenceCount.실측}`);
console.log(`  순차 대안 톤 대상: ${toneTargets.length}개`);
if (disputes.length) console.log(`  🔴 미해결 분쟁 ${disputes.length}건 — 판정 필요`);
if (problemCount) {
  console.log(`  ⚠️ 무결성 경고 ${problemCount}건 (INDEX.md 최상단 참조)`);
  for (const [k, arr] of Object.entries(problems)) if (arr.length) console.log(`     · ${k}: ${arr.length}`);
  process.exitCode = 1;
} else if (files.length) {
  console.log("  무결성 경고 없음");
}
