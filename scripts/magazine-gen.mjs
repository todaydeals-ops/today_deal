// 매거진 자동 생성 — Groq(무료)로 새 주제 N편 집필 → is_published=false 초안 저장.
// 사용: node scripts/magazine-gen.mjs [--count N]   (기본 10편)
// TodayDeal-MagazineRelease 태스크가 매일 2편씩 공개.
import fs from "node:fs";
import { processText, naverSearch } from "../build/ai.mjs";

// ⛔ 사용 중단(2026-07-12): Groq 무료 AI가 분량 부족(4분·600~1100자)·한자/키릴 혼입 저품질을 대량 생성해
//    매거진 품질이 붕괴한 사고가 있었음. 매거진 집필은 세션 Claude 집필기(scripts/magazine-draft-add.mjs)로만 한다.
//    (초기 편 수준: read_min 8~9, 본문 1900자+, 표·의사결정트리·번호목록·콜아웃 완비)
//    부득이 Groq로 강제 실행해야 하면 --force-groq. 단 magazine-release 게이트가 저품질 공개는 차단함.
if (!process.argv.includes("--force-groq")) {
  console.error("[mag-gen] ⛔ 사용 중단: Groq 저품질로 비활성화됨. 집필은 scripts/magazine-draft-add.mjs(세션 Claude) 사용. 강제: --force-groq");
  process.exit(1);
}

(function loadEnv() {
  for (const f of ["/../.env.local", "/../crawler/.env"]) {
    try {
      const t = fs.readFileSync(`${import.meta.dirname}${f}`, "utf8");
      for (const l of t.split(/\r?\n/)) { const m = l.match(/^([A-Z0-9_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim(); }
    } catch {}
  }
})();

const S = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPA_URL;
const K = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPA_KEY;
if (!S || !K) { console.error("[mag-gen] SUPA env 없음"); process.exit(1); }
const H = { apikey: K, Authorization: `Bearer ${K}`, "Content-Type": "application/json" };
const rest = (p, i = {}) => fetch(`${S}/rest/v1/${p}`, { ...i, headers: { ...H, ...(i.headers || {}) } });

const COUNT = Number(process.argv.find(a => a.startsWith("--count="))?.split("=")[1] || process.argv[process.argv.indexOf("--count") + 1] || 10);

// ── HTML 헬퍼 (magazine-publish와 동일 토큰) ──
const P0 = (t) => `<p style="font-size:18px; line-height:1.95; color:#2c2a24; margin:0;">${t}</p>`;
const P  = (t) => `<p style="font-size:18px; line-height:1.95; color:#2c2a24; margin:18px 0 0;">${t}</p>`;
const H2 = (t) => `<h2 style="font-family:'Noto Serif KR',serif; font-weight:700; font-size:27px; letter-spacing:-0.6px; line-height:1.3; margin:44px 0 0; color:#16140f;">${t}</h2>`;
const SUB = (t) => `<p style="font-size:15px; line-height:1.8; color:#76726b; margin:10px 0 22px;">${t}</p>`;
const B   = (t) => `<b style="font-weight:700;">${t}</b>`;
const NUMLIST = (color, items) =>
  `<div style="margin-top:16px; border-top:1px solid rgba(22,20,15,0.12);">${items.map((t, i) =>
    `<div style="display:flex; gap:14px; padding:15px 2px;${i < items.length-1 ? " border-bottom:1px solid rgba(22,20,15,0.08);" : ""}">` +
    `<span style="font-family:'JetBrains Mono',monospace; font-weight:700; font-size:13px; color:${color}; flex:none;">${String(i+1).padStart(2,"0")}</span>` +
    `<span style="font-size:16px; line-height:1.6; color:#33312d;">${t}</span></div>`).join("")}</div>`;
const VS = (head, items) =>
  `<div style="border:1px solid rgba(22,20,15,0.14); border-radius:12px; overflow:hidden;">` +
  `<div style="display:grid; grid-template-columns:0.85fr 1.15fr; background:#16140f; color:#fff; font-family:'JetBrains Mono',monospace; font-size:11px; letter-spacing:.5px;">` +
  `<div style="padding:13px 18px;">${head[0]}</div><div style="padding:13px 18px; border-left:1px solid rgba(255,255,255,0.14);">${head[1]}</div></div>` +
  items.map((r, i) =>
    `<div style="display:grid; grid-template-columns:0.85fr 1.15fr; border-top:1px solid rgba(22,20,15,0.08);${i%2 ? " background:#faf8f5;" : ""}">` +
    `<div style="padding:16px 18px; font-weight:700; font-size:14px; color:#16140f;">${r[0]}</div>` +
    `<div style="padding:16px 18px; border-left:1px solid rgba(22,20,15,0.08); font-size:14px; line-height:1.75; color:#46433d;">${r[1]}</div></div>`).join("") +
  `</div>`;
const CORNER_COLOR = { factcheck:"#1f6b66", smartguide:"#e0481f", compare:"#38539a", longrun:"#7a5f2e", trendlab:"#6e4690" };

// ── 주제 시드 (기존 발행 주제와 겹치지 않는 새 주제) ──
const SEEDS = [
  { slug:"home-gym-guide",          corner:"smartguide", field:"스포츠·헬스", title:"홈짐 입문, 어디서 시작해야 하나요?", subtitle:"운동 기구 선택 전에 공간·예산·목적부터", kw:"홈짐 구성 추천" },
  { slug:"pillow-sleep-guide",      corner:"smartguide", field:"리빙·주방",   title:"베개, 어떻게 골라야 목이 안 아플까요?", subtitle:"소재·높이·경도로 보는 수면 자세별 선택법", kw:"베개 추천 수면" },
  { slug:"keyboard-mouse-guide",    corner: "smartguide",    field:"디지털·IT",   title:"키보드·마우스, 비쌀수록 좋을까요?", subtitle:"게이밍·사무·개발자 용도별 선택 기준 정리", kw:"키보드 마우스 추천" },
  { slug:"camping-tent-guide",      corner:"smartguide", field:"아웃도어",     title:"텐트 첫 구매, 브랜드보다 이걸 먼저 보세요", subtitle:"인원수·시즌·용도로 좁히는 텐트 고르는 법", kw:"캠핑 텐트 구매 추천" },
  { slug:"hair-dryer-ionic-fact",   corner:"factcheck",  field:"뷰티",        title:"이온 헤어드라이어, 정말 머릿결에 좋을까요?", subtitle:"세라믹·이온·나노이온 마케팅 vs 실제 차이", kw:"이온 헤어드라이어 효과 차이" },
  { slug:"frozen-food-health-fact", corner:"factcheck",  field:"식품·건강",   title:"냉동식품, 매일 먹어도 괜찮을까요?", subtitle:"영양 손실·첨가물·나트륨 실제 수치로 따지기", kw:"냉동식품 건강 영양" },
  { slug:"electric-bike-guide",     corner:"trendlab",   field:"아웃도어",     title:"전동킥보드·전기자전거, 지금 살 만할까요?", subtitle:"배터리 수명·법적 기준·보험 이슈까지", kw:"전동킥보드 전기자전거 비교" },
  { slug:"vitamin-c-dosage-fact",   corner:"factcheck",  field:"식품·건강",   title:"비타민C, 얼마나 먹어야 효과 있을까요?", subtitle:"1000mg 고함량 광고 vs 흡수율·부작용 실제", kw:"비타민C 효과 용량" },
  { slug:"outdoor-jacket-guide",    corner: "smartguide",    field:"패션·의류",   title:"아웃도어 재킷, 오래 입으려면 어떻게 관리할까요?", subtitle:"고어텍스·방수코팅 재발수 처리부터 세탁법까지", kw:"아웃도어 재킷 관리 세탁" },
  { slug:"standing-desk-trend",     corner:"trendlab",   field:"디지털·IT",   title:"스탠딩 데스크, 건강에 정말 도움이 될까요?", subtitle:"장시간 서 있는 것도 문제다 — 실제 사용법과 고르는 법", kw:"스탠딩 데스크 효과 추천" },
];

// ── 기존 슬러그 조회 (중복 방지) ──
const existingR = await rest("magazine?select=slug&limit=500");
const existing = new Set((await existingR.json()).map(x => x.slug));
const seeds = SEEDS.filter(s => !existing.has(s.slug)).slice(0, COUNT);
console.log(`[mag-gen] 생성 대상 ${seeds.length}편 (중복제외 후)`);

// ── 생성 루프 ──
let ok = 0;
for (const seed of seeds) {
  console.log(`\n  [작성중] ${seed.title}`);

  // 1. 네이버 자료조사
  let ctx = "";
  try {
    const [blog, news] = await Promise.allSettled([
      naverSearch(seed.kw, "blog"),
      naverSearch(seed.kw + " 추천", "news"),
    ]);
    const items = [
      ...(blog.status==="fulfilled" ? blog.value.items||[] : []).slice(0,3),
      ...(news.status==="fulfilled" ? news.value.items||[] : []).slice(0,2),
    ];
    ctx = items.map(x => `- ${(x.title||"").replace(/<[^>]+>/g,"")}: ${(x.description||"").replace(/<[^>]+>/g,"").slice(0,120)}`).join("\n");
  } catch {}

  // 2. Groq 집필
  const prompt = `당신은 오늘의딜 매거진 편집자입니다. 광고 없이 사실에 기반한 중립 쇼핑 가이드를 씁니다.

주제: ${seed.title}
부제: ${seed.subtitle}
코너: ${seed.corner} (factcheck=팩트체크 | smartguide=스마트가이드(선택·비교·관리 전체) | trendlab=트렌드랩)

참고 자료:
${ctx || "(자료 없음 — 일반 지식으로 작성)"}

다음 JSON 형식으로 응답하세요:
{
  "excerpt": "한 줄 요약 (60자 이내)",
  "summary": ["핵심1 (25자)", "핵심2 (25자)", "핵심3 (25자)"],
  "sections": [
    { "h2": "섹션 제목", "sub": "섹션 부제 (선택)", "body": "본문 2-3문단. 숫자·수치 포함. HTML <b> 태그 사용 가능." },
    { "h2": "섹션 제목2", "body": "본문" },
    { "h2": "결론·추천", "body": "구체적 조언" }
  ],
  "closing": "마무리 한 줄 — 독자에게 실용적 관점 제공",
  "vs_label": ["광고 문구", "실제 의미"],
  "vs_rows": [["항목1", "실제 설명1"], ["항목2", "실제 설명2"], ["항목3", "실제 설명3"]],
  "checklist": ["체크포인트1", "체크포인트2", "체크포인트3", "체크포인트4"]
}`;

  let parsed = null;
  try {
    const res = await processText(prompt, { maxTokens: 1400 });
    if (!res.ok || !res.text) { console.log(`    [skip] AI 응답 없음 (${res.error || res.via})`); continue; }
    console.log(`    [${res.via}] 응답 ${res.text.length}자`);
    const m = res.text.match(/\{[\s\S]*\}/);
    if (m) parsed = JSON.parse(m[0]);
  } catch (e) { console.log(`    [skip] JSON 파싱 실패: ${e.message}`); continue; }
  if (!parsed) { console.log("    [skip] 응답 없음"); continue; }

  // 3. HTML 조립
  const color = CORNER_COLOR[seed.corner] || "#333";
  const sections = (parsed.sections || []).map(s =>
    H2(s.h2) + (s.sub ? SUB(s.sub) : "") + (s.body ? "<div style='margin-top:14px;'>" + P(s.body) + "</div>" : "")
  ).join("\n");

  const vsBlock = parsed.vs_rows?.length
    ? `\n${H2("광고 문구 vs 실제 의미")}\n<div style="margin-top:16px;">${VS(parsed.vs_label || ["광고 문구","실제 의미"], parsed.vs_rows)}</div>`
    : "";

  const checkBlock = parsed.checklist?.length
    ? `\n${H2("구매 전 체크리스트")}\n${NUMLIST(color, parsed.checklist)}`
    : "";

  const bodyHtml =
    `<!--RAIL:{"summary":${JSON.stringify(parsed.summary||[])}}-->` +
    P0(parsed.excerpt || seed.subtitle) +
    sections + vsBlock + checkBlock;

  const closingHtml = parsed.closing
    ? `<p style="font-size:15px; line-height:1.8; color:#e8e0d4;">${parsed.closing}</p>`
    : "";

  // 4. DB 저장 (is_published=false 초안)
  const row = {
    slug: seed.slug,
    corner: seed.corner,
    field: seed.field,
    title: seed.title,
    subtitle: seed.subtitle,
    excerpt: parsed.excerpt || seed.subtitle,
    body_html: bodyHtml,
    closing: closingHtml,
    read_min: 4,
    is_published: false,
  };

  const pr = await rest("magazine?on_conflict=slug", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify(row),
  });

  if (pr.ok || pr.status === 201) {
    console.log(`    [저장] ${seed.slug}`);
    ok++;
  } else {
    const err = await pr.text();
    console.log(`    [오류] ${pr.status} ${err.slice(0,80)}`);
  }

  // 짧은 딜레이 (Groq TPM 보호)
  await new Promise(r => setTimeout(r, 2000));
}

console.log(`\n[mag-gen] 완료: ${ok}/${seeds.length}편 초안 저장`);
