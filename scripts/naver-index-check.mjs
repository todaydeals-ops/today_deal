// 네이버 웹문서 색인·노출 측정 — 2.0 기획 0단계 효과 확인용(docs/오늘의딜2.0-기획.md 부록).
// 사용: node scripts/naver-index-check.mjs            (전수: 앞머리 순위 + 제목 통째 표본 80 + 사이트 색인 수)
//       node scripts/naver-index-check.mjs --sample=40  (통째 검색 표본 수 조정)
//
// 2026-10-17 기준선: 앞머리 30위 안 4/567 · 통째 1/80 · 사이트 색인 13건(우리 문서 10)
// 비교군 sakamaka.kr: 앞머리 30위 안 285/355 · 통째 40/40 · 색인 468건
import fs from "node:fs";
import { naverApps } from "file:///C:/Users/user/.claude/fleet-env.mjs";

(function loadEnv() {
  try {
    const t = fs.readFileSync(`${import.meta.dirname}/../.env.local`, "utf8");
    for (const l of t.split(/\r?\n/)) { const m = l.match(/^([A-Z0-9_]+)=(.*)$/); if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].trim(); }
  } catch {}
})();
const SB = process.env.NEXT_PUBLIC_SUPABASE_URL, KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SB || !KEY) { console.error("SUPA env 필요"); process.exit(1); }
const SAMPLE = +(process.argv.find((a) => a.startsWith("--sample="))?.split("=")[1] || 80);
const OURS = /todaydeals\.co\.kr/;

const apps = naverApps();
let ai = 0;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
// 0.35초 간격 + 429 면 다음 앱. 외부 API 는 완만하게 부른다.
async function webkr(query) {
  for (let i = 0; i < apps.length; i++) {
    const a = apps[ai++ % apps.length];
    const r = await fetch(`https://openapi.naver.com/v1/search/webkr.json?query=${encodeURIComponent(query)}&display=30`, {
      headers: { "X-Naver-Client-Id": a.id, "X-Naver-Client-Secret": a.secret },
    });
    await sleep(350);
    if (r.status === 429) { await sleep(1500); continue; }
    if (!r.ok) throw new Error(`webkr ${r.status}`);
    return r.json();
  }
  throw new Error("webkr 429 — 앱 전부 한도");
}

const r = await fetch(`${SB}/rest/v1/magazine?select=slug,title,corner,field,created_at&is_published=eq.true&corner=neq.report&limit=3000`, {
  headers: { apikey: KEY, Authorization: `Bearer ${KEY}` },
});
const rows = await r.json();
if (!Array.isArray(rows)) { console.error("조회 실패", rows); process.exit(1); }

// 1) 사이트 색인 수
const site = await webkr("todaydeals.co.kr");
const ownDocs = (site.items || []).filter((x) => OURS.test(x.link));
console.log(`[사이트] 네이버 웹문서 total=${site.total} · 그중 우리 문서 ${ownDocs.length}건(상위 30 기준)`);

// 2) 제목 앞머리 순위 — 쉼표·물음표·대시·콜론·가운뎃점 앞이 그 글의 검색어
const head = (t) => t.split(/,|\s—\s|\s:\s|\s·\s|\?|!/)[0].replace(/[“”"']/g, "").trim();
let top3 = 0, top10 = 0, top30 = 0;
const hits = [];
for (const x of rows) {
  const d = await webkr(head(x.title));
  const i = (d.items || []).findIndex((it) => OURS.test(it.link));
  if (i >= 0) { top30++; if (i < 10) top10++; if (i < 3) top3++; hits.push(`${i + 1}위 ${head(x.title)}`); }
}
console.log(`[앞머리] n=${rows.length} · 3위 안 ${top3} · 10위 안 ${top10} · 30위 안 ${top30} (${((top30 / rows.length) * 100).toFixed(1)}%)`);
hits.slice(0, 30).forEach((h) => console.log("   " + h));

// 3) 제목 통째 검색 — 색인 여부 판별(색인돼 있으면 거의 항상 걸린다)
const pick = [...rows].sort(() => Math.random() - 0.5).slice(0, SAMPLE);
let found = 0;
for (const x of pick) {
  const d = await webkr(`"${x.title}"`);
  if ((d.items || []).some((it) => OURS.test(it.link))) found++;
}
console.log(`[통째] 표본 ${pick.length} 중 노출 ${found}`);
