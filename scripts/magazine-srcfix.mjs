// 발행된 글의 RAIL sources 를 교체·삭제한다.
//
// 왜 필요한가: 지금까지 출처 문제는 근거 저장소(content/research/facts)에서만 고쳤다.
// 그런데 독자가 실제로 보는 건 글 하단의 출처 링크다. 470편을 훑어보니 51건이
// 판매사·커뮤니티·약탈적 저널로 나가 있었다.
//
// 특히 위험한 건 **라벨과 실제가 다른 경우**다.
//   [공식] 소아비뇨의학 임상 가이드라인  →  https://brunch.co.kr/@kid008/996
// 개인 블로그를 임상 가이드라인이라고 표기한 것이다. 도메인만 보는 검사로는
// "개인 블로그" 정도로 잡히고, 라벨이 거짓이라는 사실은 드러나지 않는다.
//
// 입력 JSON:
// { "fixes": [ {
//     "slug": "child-bedwetting-enuresis",
//     "from": "https://brunch.co.kr/@kid008/996",   // 교체 대상 URL(부분 일치)
//     "to":   { "label": "[공식] 대한소아비뇨의학회 …", "url": "https://…" },
//     // to 를 생략하면 그 출처를 **삭제**한다(대체를 못 찾은 경우)
//     "note": "왜 고쳤는지 — 로그용"
// } ] }
//
//   node scripts/magazine-srcfix.mjs .work/srcfix/health.json [--dry]
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

const file = process.argv[2];
if (!file) { console.error("교체 JSON 경로 필요\n  node scripts/magazine-srcfix.mjs .work/srcfix/health.json [--dry]"); process.exit(1); }
const fixes = (JSON.parse(fs.readFileSync(file, "utf8")).fixes) ?? [];

// ── 적재 전 게이트 ──
// 교체하러 왔다가 더 나쁜 걸 넣으면 안 된다. 새 URL 도 같은 기준으로 본다.
const BAD = [
  { re: /shopping|coupang|11st|gmarket|smartstore|auction/i, why: "쇼핑몰" },
  { re: /namu\.wiki/i, why: "나무위키" },
  { re: /blog\.naver|tistory|blogspot|medium\.com|brunch\.co\.kr|wordpress\.com/i, why: "개인 블로그" },
  { re: /iherb|thorne|now-?foods|swansonvitamins|vitacost|gnc\.|naturesway|greencirclecap|puritan|vitaminshoppe/i, why: "보충제 판매사" },
  { re: /healthline|verywell|webmd|droracle\.ai|medspot\.ai/i, why: "2차 요약·AI 생성" },
  { re: /typology|thedermaco|paulaschoice|theordinary|drmtlgy|clinikally|sophim|besthairregrowth|laroche-posay|rodanandfields|marykay|theinkeylist|dermalogica|stratiaskin|revivalabs|phyto-c/i, why: "화장품 브랜드" },
  { re: /researchgate|auctoresonline|ijpsjournal|innovareacademics|scirp\.org/i, why: "프리프린트·약탈적 저널" },
  { re: /apollohospitals|ubiehealth|prescriberpoint|hims\.com|goodrx|drugs\.com|safemom\.ai|healthrx|acne\.org|medicalnewstoday/i, why: "상업 헬스 사이트" },
  { re: /clien\.net|dcinside|ppomppu|ruliweb|cafe\.naver|todayhumor|82cook|bobaedream/i, why: "커뮤니티" },
];
// 커뮤니티·개인 자료라도 [후기] 로 정직하게 표기하면 §4 상 허용이다.
// 막아야 하는 건 그것을 [공식] 으로 둔갑시키는 경우다.
const bad = [];
for (const f of fixes) {
  // from 을 생략하면 **추가**다. 출처가 1건뿐인 글에서 그 1건을 지우면 근거가 0이 되는데,
  // 야뇨증 글이 실제로 그랬다(유일한 출처가 브런치 개인 글). 교체만으로는 못 고친다.
  if (!f.slug || (!f.from && !f.to)) { bad.push(`${f.slug || "?"}: slug 와 from·to 중 하나는 필요`); continue; }
  if (!f.to) continue;                       // 삭제는 검사 대상이 아니다
  if (!f.to.url || !f.to.label) { bad.push(`${f.slug}: to 에 label·url 둘 다 필요`); continue; }
  const hit = BAD.find((b) => b.re.test(f.to.url));
  const isReview = /^\[후기\]/.test(f.to.label);
  if (hit && !(isReview && /clien|dcinside|ppomppu|ruliweb|cafe\.naver|82cook|bobaedream|blogspot|brunch/i.test(f.to.url))) {
    bad.push(`${f.slug}: 새 출처도 ${hit.why} (${f.to.url.slice(0, 60)})`);
  }
  if (!isReview && /^\[공식\]/.test(f.to.label) && hit) {
    bad.push(`${f.slug}: [공식] 라벨인데 ${hit.why} 다`);
  }
  if (f.to.label.includes("—") || f.to.url.includes("—")) bad.push(`${f.slug}: em-dash 혼입`);
}
if (bad.length) {
  console.error("✖ 교체 거부. 아래를 고쳐라.\n");
  for (const b of bad) console.error("   " + b);
  console.error("\n대체 출처를 못 찾았으면 to 를 빼고 삭제해라. 나쁜 걸 나쁜 걸로 바꾸지 마라.");
  process.exit(1);
}

const railSplit = (html) => {
  const m = (html || "").match(/^\s*<!--RAIL:([\s\S]*?)-->\s*/);
  if (!m) return null;
  let rail = {}; try { rail = JSON.parse(m[1]); } catch { return null; }
  return { rail, body: (html || "").slice(m[0].length) };
};

// slug 단위로 묶어 글 하나당 한 번만 PATCH 한다.
const bySlug = {};
for (const f of fixes) (bySlug[f.slug] ||= []).push(f);

let done = 0, skip = 0, fail = 0, removed = 0, swapped = 0;
for (const [slug, list] of Object.entries(bySlug)) {
  const r = await fetch(`${SUPA}/rest/v1/magazine?slug=eq.${encodeURIComponent(slug)}&select=slug,body_html`, { headers: H });
  const rows = await r.json();
  if (!Array.isArray(rows) || !rows.length) { console.log(`  ✖ 없음 ${slug}`); fail++; continue; }

  const split = railSplit(rows[0].body_html);
  if (!split) { console.log(`  ✖ RAIL 없음 ${slug}`); fail++; continue; }
  const { rail, body } = split;
  const sources = rail.sources || [];

  let touched = 0;
  for (const f of list) {
    if (!f.from) {                                    // 추가
      if (sources.some((s) => s && s.url === f.to.url)) { console.log(`  – 이미 있음 ${slug}`); continue; }
      sources.push({ label: f.to.label, url: f.to.url });
      touched++; swapped++;
      console.log(`  ✓ ${slug.padEnd(32)} 추가 ${f.note ? "· " + f.note : ""}`);
      continue;
    }
    const i = sources.findIndex((s) => s && s.url && s.url.includes(f.from));
    if (i === -1) { console.log(`  – 대상 없음 ${slug} :: ${f.from.slice(0, 50)}`); continue; }
    if (f.to) {
      // 이미 같은 URL 이 다른 자리에 있으면 중복이 되므로 그냥 삭제한다.
      const dup = sources.some((s, j) => j !== i && s && s.url === f.to.url);
      if (dup) { sources.splice(i, 1); removed++; }
      else { sources[i] = { label: f.to.label, url: f.to.url }; swapped++; }
    } else { sources.splice(i, 1); removed++; }
    touched++;
    console.log(`  ✓ ${slug.padEnd(32)} ${f.to ? "교체" : "삭제"} ${f.note ? "· " + f.note : ""}`);
  }
  if (!touched) { skip++; continue; }

  rail.sources = sources;
  const body_html = `<!--RAIL:${JSON.stringify(rail)}-->\n` + body;
  if (DRY) { done++; continue; }

  const up = await fetch(`${SUPA}/rest/v1/magazine?slug=eq.${encodeURIComponent(slug)}`, {
    method: "PATCH", headers: { ...H, Prefer: "return=minimal" }, body: JSON.stringify({ body_html }),
  });
  up.ok ? done++ : (fail++, console.log(`      PATCH 실패 ${up.status}`));
}
console.log(`\n${DRY ? "(dry) " : ""}글 ${done}편 · 교체 ${swapped} · 삭제 ${removed} · 스킵 ${skip} · 실패 ${fail}`);
