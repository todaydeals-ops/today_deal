// 매거진 리포트 자동 생성 — 무료 AI fleet 전용
// 흐름: 발행된 아티클 전체 조회 → Groq 클러스터링(5편씩)
//       → 네이버 뉴스/블로그 조사 → Groq 리포트 소개문 작성 → DB 저장
// 사용: node scripts/magazine-report-gen.mjs [--dry]
import fs from "node:fs";
import { processText, naverSearch } from "../build/ai.mjs";

(function loadEnv() {
  for (const f of [".env.local", ".env"]) {
    try {
      for (const l of fs.readFileSync(f, "utf8").split(/\r?\n/)) {
        const m = l.match(/^([A-Z0-9_]+)=(.*)$/);
        if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].trim();
      }
    } catch {}
  }
})();

const S = process.env.NEXT_PUBLIC_SUPABASE_URL;
const K = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!S || !K) { console.error("SUPA env 없음"); process.exit(1); }
const H = { apikey: K, Authorization: `Bearer ${K}`, "Content-Type": "application/json" };
const rest = (p, i = {}) => fetch(`${S}/rest/v1/${p}`, { ...i, headers: { ...H, ...(i.headers || {}) } });

const dry = process.argv.includes("--dry");

// ── 1. 발행된 아티클 조회 (report 제외) ──
const r = await rest("magazine?is_published=eq.true&select=slug,title,corner,field,excerpt&order=created_at.asc&limit=200");
const all = await r.json();
const articles = Array.isArray(all) ? all.filter(a => a.corner !== "report") : [];
console.log(`[report-gen] 아티클 ${articles.length}편 조회`);
if (articles.length < 5) { console.log("아티클 부족 (최소 5편 필요)"); process.exit(0); }

// 이미 리포트로 사용된 슬러그 조회
const rr = await rest("magazine?is_published=eq.true&corner=eq.report&select=body_html");
const existingReports = await rr.json();
const usedSlugs = new Set();
for (const rep of (Array.isArray(existingReports) ? existingReports : [])) {
  const m = (rep.body_html || "").match(/<!--REPORT:([\s\S]*?)-->/);
  if (m) {
    try { (JSON.parse(m[1]).articles || []).forEach(s => usedSlugs.add(s)); } catch {}
  }
}
const fresh = articles.filter(a => !usedSlugs.has(a.slug));
console.log(`[report-gen] 미사용 아티클 ${fresh.length}편 (이미 리포트 사용: ${usedSlugs.size}편)`);
if (fresh.length < 5) { console.log("신규 아티클 부족. 종료."); process.exit(0); }

// ── 2. Groq로 주제별 5편 클러스터링 ──
const articleList = fresh.map(a => `slug:${a.slug} | ${a.field || a.corner} | ${a.title}`).join("\n");
const clusterPrompt = `아래는 쇼핑 정보 가이드 매거진 아티클 목록입니다.
독자에게 유용하도록 비슷한 주제끼리 5편씩 그룹으로 묶어 주세요.

규칙:
- 각 그룹 정확히 5편(slug 기준)
- 같은 분야(field) 또는 독자가 함께 읽으면 유용한 주제끼리
- 각 그룹: topic(한글 주제명), slug(영문 kebab-case, 영문자·숫자·하이픈만), articles(slug 배열 5개)
- 5편 미만으로 남는 아티클은 제외 — 완전한 그룹만 만들 것
- JSON 배열만 출력(설명 없이)

아티클 목록:
${articleList}

출력 형식:
[{"topic":"주방·가전 가이드","slug":"kitchen-appliance-guide","articles":["slug1","slug2","slug3","slug4","slug5"]}]`;

console.log("[report-gen] Groq 클러스터링 중...");
const clusterRes = await processText(clusterPrompt);
if (!clusterRes.ok || !clusterRes.text.trim()) {
  console.error("클러스터링 실패:", clusterRes.error || "응답 없음"); process.exit(1);
}
console.log(`  via: ${clusterRes.via}`);

let clusters = [];
try {
  const m = clusterRes.text.match(/\[[\s\S]*\]/);
  clusters = JSON.parse(m ? m[0] : clusterRes.text);
} catch (e) { console.error("클러스터 파싱 실패:", e.message, "\n원문:", clusterRes.text.slice(0, 500)); process.exit(1); }

// 유효성 검사: 5편 정확히, slug 존재 여부
const freshSlugSet = new Set(fresh.map(a => a.slug));
clusters = clusters.filter(c => {
  if (!Array.isArray(c.articles) || c.articles.length !== 5) return false;
  if (!c.articles.every(s => freshSlugSet.has(s))) return false;
  if (!c.topic || !c.slug) return false;
  return true;
});
console.log(`[report-gen] 유효 클러스터 ${clusters.length}개:`);
clusters.forEach(c => console.log(`  [${c.slug}] ${c.topic}`));

if (!clusters.length) { console.log("유효한 클러스터 없음. 종료."); process.exit(0); }

// ── 3. 각 클러스터: 네이버 조사 → Groq 소개문 → DB 저장 ──
// 슬러그 중복 방지용: 기존 report 슬러그 조회
const rSlug = await rest("magazine?corner=eq.report&select=slug");
const existingReportSlugs = new Set((await rSlug.json() || []).map(x => x.slug));
// 날짜 버전 태그 (같은 주제 재발행 시 구분)
const dateTag = new Date().toISOString().slice(2, 7).replace("-", ""); // 2606 (YYMM)

let saved = 0;
for (const cluster of clusters) {
  const { topic, slug: rawSlug, articles: slugList } = cluster;
  const reportSlug = `${rawSlug}-${dateTag}`;

  if (existingReportSlugs.has(reportSlug)) {
    console.log(`  [skip] ${reportSlug} — 이미 존재`);
    continue;
  }

  // 아티클 제목 모으기
  const clusterArticles = slugList.map(s => fresh.find(a => a.slug === s)).filter(Boolean);
  const titleList = clusterArticles.map((a, i) => `${i + 1}. ${a.title}`).join("\n");

  // 네이버 뉴스 + 블로그 병렬 조사
  const [nvNews, nvBlog] = await Promise.allSettled([
    naverSearch(`${topic} 구매 가이드`, { type: "news", display: 5 }),
    naverSearch(`${topic} 추천`, { type: "blog", display: 5 }),
  ]);
  const nvItems = [
    ...(nvNews.status === "fulfilled" && nvNews.value.ok ? nvNews.value.items : []),
    ...(nvBlog.status === "fulfilled" && nvBlog.value.ok ? nvBlog.value.items : []),
  ].slice(0, 6);
  const nvCtx = nvItems.length
    ? nvItems.map((x, i) => `[${i + 1}] ${x.title}: ${x.desc || ""}`).join("\n")
    : "(검색 결과 없음)";

  // Groq 소개문 생성
  const introPrompt = `아래 5편의 쇼핑 가이드를 묶은 온라인 리포트의 소개 텍스트를 작성해 주세요.

주제: ${topic}
포함 아티클:
${titleList}

참고(네이버 최신 트렌드):
${nvCtx}

작성 지침:
- 독자가 이 리포트를 읽어야 하는 이유를 1~2문장으로 설명 (200자 내외)
- 구체적 수치나 트렌드 반영 시 네이버 참고 내용 활용(없으면 무시)
- 딱딱하지 않고 실용적인 톤
- 리포트 제목(40자 이내)과 부제(30자 이내)도 함께 생성
- JSON만 출력

{"title":"리포트 제목","subtitle":"부제","intro":"소개 텍스트"}`;

  const introRes = await processText(introPrompt);
  if (!introRes.ok || !introRes.text.trim()) {
    console.log(`  [skip] ${topic} — 소개문 생성 실패`);
    continue;
  }

  let introData;
  try {
    const m = introRes.text.match(/\{[\s\S]*?\}/);
    introData = JSON.parse(m ? m[0] : introRes.text);
  } catch {
    console.log(`  [skip] ${topic} — JSON 파싱 실패`);
    continue;
  }

  const { title, subtitle, intro } = introData;
  if (!title || !intro) { console.log(`  [skip] ${topic} — 제목/소개문 누락`); continue; }

  // body_html: <!--REPORT:{...}--> 메타 + 소개문 단락
  const reportMeta = JSON.stringify({ articles: slugList, topic });
  const bodyHtml = `<!--REPORT:${reportMeta}-->\n<p>${intro.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>`;

  const payload = {
    slug: reportSlug,
    corner: "report",
    field: topic,
    title: String(title).slice(0, 100),
    subtitle: subtitle ? String(subtitle).slice(0, 100) : null,
    excerpt: String(intro).slice(0, 200),
    body_html: bodyHtml,
    is_published: true,
    created_at: new Date().toISOString(),
  };

  console.log(`  [${introRes.via}] ${title} (${slugList.join(", ")})`);
  if (dry) continue;

  const pr = await rest("magazine", { method: "POST", headers: { Prefer: "return=minimal" }, body: JSON.stringify(payload) });
  if (pr.ok || pr.status === 201) { saved++; console.log(`    → 저장: ${reportSlug}`); }
  else console.log(`    → DB 오류 ${pr.status}`);
}

console.log(`\n[report-gen] 완료: ${saved}개 리포트 생성${dry ? " (dry — DB 저장 없음)" : ""}`);
