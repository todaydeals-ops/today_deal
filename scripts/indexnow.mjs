// IndexNow — 새 URL 을 네이버·빙(및 IndexNow 참여 엔진)에 바로 알린다.
//
// 사용:
//   node scripts/indexnow.mjs --wiki            생활백과 허브 + 항목 전부
//   node scripts/indexnow.mjs --labs            연구소 홈 5곳
//   node scripts/indexnow.mjs --recent 30       최근 발행 아티클 N편
//   node scripts/indexnow.mjs <url> [url...]    직접 지정
//   (조합 가능: --wiki --labs --recent 20)
//
// ★왜(2026-10-20): 네이버 웹문서 색인이 우리 문서 10건뿐이었고(572편 발행), 서치어드바이저 제출은
//   사장님 로그인이 필요하다. IndexNow 는 키 파일(/<키>.txt)만 있으면 로그인 없이 알릴 수 있다.
//   네이버(searchadvisor.naver.com/indexnow)는 가짜 키에 403, 공용 창구(api.indexnow.org)는 202 를 냈다(실측).
//   빙 수집은 Copilot(GA4 "AI Assistant" 유입원)으로도 이어진다.
// ★구글은 IndexNow 를 받지 않는다 — 구글은 사이트맵(서치콘솔 API 로 제출됨)과 내부 링크로 간다.
// ★완만하게 — 창구별 1회 POST(최대 10,000 URL), 같은 URL 을 하루에 여러 번 보내지 않는다.
import fs from "node:fs";

const env = {};
for (const l of fs.readFileSync(`${import.meta.dirname}/../.env.local`, "utf8").split(/\r?\n/)) {
  const m = l.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].trim();
}
const KEY = env.INDEXNOW_KEY;
const HOST = "www.todaydeals.co.kr";
const SITE = `https://${HOST}`;
if (!KEY) { console.error(".env.local 에 INDEXNOW_KEY 가 없다"); process.exit(1); }

const args = process.argv.slice(2);
const urls = new Set(args.filter((a) => /^https?:\/\//.test(a)));

if (args.includes("--wiki")) {
  urls.add(`${SITE}/wiki`);
  for (const f of fs.readdirSync(`${import.meta.dirname}/../content/wiki`)) {
    if (f.endsWith(".json") && !f.startsWith("_")) urls.add(`${SITE}/wiki/${f.replace(/\.json$/, "")}`);
  }
}
if (args.includes("--labs")) for (const p of ["goodsleep", "pill", "beauty", "b4as", "sponsor"]) urls.add(`${SITE}/${p}`);
const ri = args.indexOf("--recent");
if (ri >= 0) {
  const n = Number(args[ri + 1]) || 30;
  const r = await fetch(`${env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/magazine?select=slug&is_published=eq.true&corner=neq.report&order=created_at.desc&limit=${n}`, {
    headers: { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}` },
  });
  const rows = await r.json();
  if (Array.isArray(rows)) for (const x of rows) urls.add(`${SITE}/magazine/${x.slug}`);
}
if (!urls.size) { console.log("보낼 URL 이 없다. --wiki / --labs / --recent N / URL 을 지정"); process.exit(1); }

// 키 파일이 실제로 열리는지 먼저 확인 — 안 열리면 모든 창구가 거절한다
const kr = await fetch(`${SITE}/${KEY}.txt`);
const kt = (await kr.text()).trim();
if (kr.status !== 200 || kt !== KEY) { console.error(`키 파일 확인 실패: ${SITE}/${KEY}.txt → ${kr.status} "${kt.slice(0, 40)}" (배포 전이면 배포 후 다시)`); process.exit(1); }

const body = JSON.stringify({ host: HOST, key: KEY, keyLocation: `${SITE}/${KEY}.txt`, urlList: [...urls] });
const ENDPOINTS = ["https://searchadvisor.naver.com/indexnow", "https://api.indexnow.org/indexnow"];
console.log(`URL ${urls.size}개`);
for (const ep of ENDPOINTS) {
  const r = await fetch(ep, { method: "POST", headers: { "Content-Type": "application/json; charset=utf-8" }, body });
  const t = await r.text();
  // 200/202 = 접수. 400 형식 오류, 403 키 불일치, 422 URL 이 호스트와 다름, 429 너무 잦음
  console.log(`  ${r.status} ${ep}${t ? "  " + t.slice(0, 160).replace(/\s+/g, " ") : ""}`);
  await new Promise((res) => setTimeout(res, 1000));
}
