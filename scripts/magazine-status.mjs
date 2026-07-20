// 매거진 운영 현황 — 콘솔 출력용(대화창에서 바로 확인).
// 사용: node scripts/magazine-status.mjs
import fs from "node:fs";
(function loadEnv() {
  try {
    const t = fs.readFileSync(`${import.meta.dirname}/../.env.local`, "utf8");
    for (const l of t.split(/\r?\n/)) { const m = l.match(/^([A-Z0-9_]+)=(.*)$/); if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].trim(); }
  } catch {}
})();
const SB = process.env.NEXT_PUBLIC_SUPABASE_URL, KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SB || !KEY) { console.error("SUPA env 필요"); process.exit(1); }

const CORNERS = [["factcheck", "팩트체크"], ["smartguide", "스마트가이드"], ["trendlab", "트렌드랩"], ["repair", "AS셀프체크"]];
const kst = (d = new Date()) => new Date(d.getTime() + 9 * 3600_000).toISOString().slice(0, 10);
const today = kst();

const r = await fetch(`${SB}/rest/v1/magazine?select=slug,title,corner,is_published,created_at,body_html&corner=neq.report`, {
  headers: { apikey: KEY, Authorization: `Bearer ${KEY}` },
});
const rows = await r.json();
if (!Array.isArray(rows)) { console.error("조회 실패"); process.exit(1); }

const drafts = rows.filter((x) => !x.is_published);
const pub = rows.filter((x) => x.is_published);
const todayPub = pub.filter((x) => kst(new Date(x.created_at)) === today);
const last7 = pub.filter((x) => new Date(x.created_at).getTime() >= Date.now() - 7 * 86400_000).length;
// 재고 일수는 '계획 발행량'과 '배분 규칙' 기준으로 센다.
// 최근 7일 실적으로 나누면 수동 대량 발행이 있던 날 perDay가 부풀어
// 멀쩡한 재고도 소진 임박으로 잡힌다.
// 배분(Cron과 동일): 하루 2편 = AS셀프체크 1편 + 나머지 3코너 중 1편.
// 따라서 AS는 하루 1편씩, 나머지 3코너는 '합쳐서' 하루 1편씩 줄어든다.
const perDay = last7 / 7; // 실적(참고 표시용)
const repairStock = drafts.filter((d) => d.corner === "repair").length;
const otherStock = drafts.length - repairStock;
const repairDays = repairStock; // 하루 1편
const otherDays = otherStock; // 3코너 합쳐 하루 1편
const daysLeft = Math.min(repairDays, otherDays); // 먼저 마르는 쪽이 실제 한계

// 품질 점검
const CJK = /[㐀-䶿一-鿿Ѐ-ӿ぀-ゟ゠-ヺ]/;
const noTags = pub.filter((x) => !/"tags"\s*:\s*\[[^\]]/.test(x.body_html));
const noImage = pub.filter((x) => !/"images"\s*:\s*\[[^\]]/.test(x.body_html));
const cjkHit = pub.filter((x) => CJK.test(x.body_html.replace(/<[^>]+>/g, "")));

const warn = [];
for (const [key, name] of CORNERS) {
  const n = drafts.filter((d) => d.corner === key).length;
  if (n === 0) warn.push(`${name} 재고 0편 — 보충 필요`);
}
// AS와 나머지를 따로 경고한다 — 합산하면 한쪽이 말라가는 걸 놓친다
if (repairDays <= 7) warn.push(`AS셀프체크 ${repairStock}편 = ${repairDays}일치(하루 1편) — 보충 시점`);
if (otherDays <= 7) warn.push(`팩트체크·가이드·트렌드랩 합 ${otherStock}편 = ${otherDays}일치(합쳐 하루 1편) — 보충 시점`);
if (noTags.length) warn.push(`검색 태그 없는 발행글 ${noTags.length}편`);
if (noImage.length) warn.push(`이미지 없는 발행글 ${noImage.length}편`);
if (cjkHit.length) warn.push(`한자·키릴 혼입 의심 ${cjkHit.length}편 (${cjkHit.slice(0, 3).map((x) => x.slug).join(", ")})`);

const bar = "─".repeat(46);
console.log(`\n${bar}\n 오늘의딜 매거진 현황 · ${today} (KST)\n${bar}`);

console.log(`\n[재고] 총 ${drafts.length}편 · 약 ${daysLeft}일치 (AS ${repairDays}일 / 나머지 ${otherDays}일)`);
for (const [key, name] of CORNERS) {
  const n = drafts.filter((d) => d.corner === key).length;
  console.log(`   ${name.padEnd(8)} ${String(n).padStart(3)}편 ${n === 0 ? "  ← 비었음" : ""}`);
}

console.log(`\n[오늘 발행] ${todayPub.length}편`);
for (const p of todayPub.slice(0, 5)) console.log(`   · ${p.title.slice(0, 44)}`);
if (!todayPub.length) console.log("   (아직 없음)");

console.log(`\n[누적] 발행 ${pub.length}편 · 최근 7일 ${last7}편(일 ${perDay.toFixed(1)}편)`);

if (warn.length) {
  console.log(`\n[확인 필요] ${warn.length}건`);
  for (const w of warn) console.log(`   ! ${w}`);
} else {
  console.log(`\n[확인 필요] 없음`);
}
console.log(bar + "\n");
