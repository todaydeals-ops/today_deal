// 매거진 글 대표 이미지 자동 생성(코덱스 연동) — 새로 쌓인 글(비축 초안 포함)에 대표 이미지를 붙인다.
//
// 사용: node scripts/magazine-ai-images.mjs [--dry] [--limit=12] [--concurrency=2] [--slugs=a,b]
//
// 흐름(글 1편당)
//   1) DB 에서 "코덱스 대표 이미지가 아직 없는 글"을 고른다
//        - content/magazine-images.json(기존 577편 manifest)에 있거나, RAIL images[0] 의 credit 이 "오늘의딜 AI 제작"이면 이미 있는 것
//        - 순서: 공개된 글 먼저(최신순) → 비축 초안(오래된 순 = 곧 공개될 순)
//   2) 코덱스(codex exec -m gpt-5.6-sol)가 제목·부제·요약을 읽고 소재를 직접 정해 정물사진풍 이미지 1장을 만든다
//   3) 생성 PNG 를 로그에서 회수(이 컴퓨터는 Codex 셸이 저장을 못 한다) → 1200x750(대표) + 520x325(-s, 카드용) JPG
//   4) Supabase Storage(공개 버킷 site-images)의 magazine/<slug>.jpg, <slug>-s.jpg 로 올린다
//   5) 글 body_html 맨 앞 RAIL 주석의 images[0] 을 {url, credit:"오늘의딜 AI 제작"} 으로 바꾼다(images[1~] 본문용 스톡은 그대로)
//
// 호출: scripts/run-magazine-release.cmd(작업 스케줄러 TodayDeal-MagazineRelease, 매일 08:30)가 스톡 수집(magazine-images.mjs) 다음에 부른다.
//       스톡 수집기도 AI 이미지가 먼저 붙은 글의 본문용 스톡을 채우도록 맞춰 뒀으므로 어느 쪽이 먼저 돌아도 된다.
//
// ★원칙(magazine-codex-images.mjs 와 같다)
//   - 이미지 안에 글자·숫자·로고·브랜드·사람 얼굴을 넣지 않는다. 한 번 붙인 이미지는 고정한다(이미 있으면 다시 만들지 않는다).
//   - 모델은 항상 -m gpt-5.6-sol. 실패하면 DB 를 건드리지 않고 다음 실행 때 다시 시도한다.
//   - 한 번에 limit 편까지만(기본 12) — 코덱스 사용량을 완만하게.
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import sharp from "sharp";

const ROOT = path.resolve(import.meta.dirname, "..");
const WORK = path.join(ROOT, ".tmp", "codex-magazine-auto");
const RAW = path.join(WORK, "raw");
const OUT = path.join(WORK, "out");
const REVIEW = path.join(ROOT, ".work", "ai-images-review");
const MANIFEST = path.join(ROOT, "content", "magazine-images.json");
const SCENES = path.join(ROOT, "content", "magazine-image-scenes.json");
const BUCKET = "site-images";
const AI_CREDIT = "오늘의딜 AI 제작";
for (const d of [WORK, RAW, OUT, REVIEW]) fs.mkdirSync(d, { recursive: true });

const args = Object.fromEntries(process.argv.slice(2).map((a) => { const [k, v] = a.replace(/^--/, "").split("="); return [k, v ?? true]; }));
const DRY = !!args.dry;
const LIMIT = Number(args.limit || 12);
const CONC = Math.max(1, Math.min(3, Number(args.concurrency || 2)));
const ONLY = args.slugs ? String(args.slugs).split(",").filter(Boolean) : [];

const require = createRequire(path.join(ROOT, "package.json"));
const { createClient } = require("@supabase/supabase-js");
const env = Object.fromEntries(fs.readFileSync(path.join(ROOT, ".env.local"), "utf8").split(/\r?\n/).filter((l) => l && !l.startsWith("#") && l.includes("=")).map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, "")]; }));
const base = env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL;
const sb = createClient(base, env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_KEY, { auth: { persistSession: false } });

const readJson = (f, d) => { try { return JSON.parse(fs.readFileSync(f, "utf8")); } catch { return d; } };
const stamp = () => new Date().toLocaleString("sv-SE", { timeZone: "Asia/Seoul" });
const plain = (s) => String(s || "").replace(/<!--[\s\S]*?-->/g, " ").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

// ── RAIL 주석(본문 맨 앞) 읽기·쓰기 — scripts/magazine-images.mjs 의 railGet/railSet 과 같은 형식 ──
function railGet(bodyHtml) {
  const m = (bodyHtml || "").match(/^\s*<!--RAIL:([\s\S]*?)-->\s*/);
  if (!m) return { rail: {}, rest: bodyHtml || "" };
  let rail = {};
  try { rail = JSON.parse(m[1]); } catch { /* 깨진 주석은 빈 것으로 */ }
  return { rail, rest: (bodyHtml || "").slice(m[0].length) };
}
function railImages(rail) {
  if (Array.isArray(rail.images)) return rail.images.filter((x) => x && typeof x.url === "string");
  if (rail.image && typeof rail.image.url === "string") return [rail.image];
  return [];
}
function railSetImages(bodyHtml, images) {
  const { rail, rest } = railGet(bodyHtml);
  rail.images = images;
  delete rail.image; // 구 단수 필드 정리
  return `<!--RAIL:${JSON.stringify(rail).replace(/-->/g, "--\\u003e")}-->\n` + rest.trim();
}

// ── 코덱스 ──
const STYLE =
  "밝고 깨끗한 에디토리얼 정물사진풍. 자연광, 얕은 심도, 흰색·아이보리·연한 초록 톤이 주를 이루고 짙은 초록(#1f8a4f)을 아주 작은 포인트로만 쓴다. " +
  "채도는 낮고 정돈된 한국 가정의 실제 공간 느낌. 과장된 보정·네온·강한 그림자 금지.";

// 기존 577편의 장면 문장을 예시로 보여 줘 화풍·소재 선택이 일관되게 한다(글 해시로 고정 선택)
const sceneExamples = (() => {
  const s = readJson(SCENES, {});
  const keys = Object.keys(s);
  return keys.length ? keys.filter((_, i) => i % Math.max(1, Math.floor(keys.length / 4)) === 0).slice(0, 4).map((k) => s[k]) : [];
})();

function prompt(row, rel) {
  const lines = [
    `글 제목: ${row.title}`,
    row.subtitle ? `부제: ${row.subtitle}` : "",
    `요약: ${plain(row.excerpt) || plain(railGet(row.body_html).rest).slice(0, 220)}`,
    row.field ? `분야: ${row.field}` : "",
  ].filter(Boolean).join("\n");
  return `오늘의딜(todaydeals.co.kr) 매거진 글의 대표 이미지 1장을 만든다. 이 작업은 사장님 지시로 만든 자동 실행 스크립트가 호출한 것이라 AI_COORDINATION.md 우편함 항목은 없다. 이미지 생성만 하고 멈춘다.

## 글
${lines}

## 소재 정하기
이 글을 읽으러 온 사람이 한눈에 "아, 이 얘기구나" 하고 알아볼 **핵심 소재(제품·음식·소품 등)를 먼저 한 문장(70~100자)으로 정하고**, 그 소재를 화면 중앙에 크게 놓는 정물 구도로 그린다.
공간은 소재에 맞는 밝은 한국 가정(거실·침실·주방·욕실·책상) 한 곳.
${sceneExamples.length ? `이미 쓴 장면 문장 예시(형식 참고용, 그대로 베끼지 않는다):\n${sceneExamples.map((x) => `- ${x}`).join("\n")}` : ""}

## 화풍
${STYLE}

## 구도·크기
- 최종 크기는 정확히 1600x1000px(1.6:1), JPG.
- 작은 썸네일(정사각·4:3)로도 잘리므로 **핵심 물건은 화면 중앙에 크게** 두고 가장자리에는 중요한 것을 두지 않는다.

## 반드시 지킬 것
- **이미지 안에 어떤 글자도 넣지 않는다.** 한글·영문·숫자·기호·로고·간판·라벨·공공기관 문양 모두 금지. 용기는 라벨 없는 무지 용기, 화면은 꺼진 화면, 책·서류는 글자 없는 면으로.
- 실존 인물·사람 얼굴·사람 몸·특정 브랜드 제품·로고·엠블럼을 그리지 않는다. 손 정도만 괜찮다.
- 불안·공포를 주는 연출(붉은 경고, 어두운 방) 대신 밝고 차분한 분위기.

## 저장
\`${rel}\` (폴더가 없으면 만든다). 이 파일 하나만 만들고 멈춘다. 다른 파일·코드·콘텐츠는 건드리지 않는다.
※ 이미지 생성 후 저장·변환 단계에서 셸 실행 오류가 나면 **재시도하지 말고 바로 끝낸다.** 생성된 이미지는 호출한 쪽이 따로 회수해 변환한다.

## 끝나면
마지막 메시지에 정한 소재 문장(1줄)과 이미지에 담긴 장면(구도·색·소재)을 2줄 안으로 적는다.`;
}

function runCodex(tag, text) {
  return new Promise((resolve) => {
    const pf = path.join(WORK, `prompt-${tag}.md`), lf = path.join(WORK, `log-${tag}.txt`), of = path.join(WORK, `last-${tag}.txt`);
    fs.writeFileSync(pf, text);
    fs.rmSync(of, { force: true });
    fs.rmSync(lf, { force: true });
    const cmd = `codex exec -m gpt-5.6-sol -C "${ROOT}" --skip-git-repo-check -s workspace-write -o "${of}" - < "${pf}" > "${lf}" 2>&1`;
    const p = spawn("cmd.exe", ["/d", "/s", "/c", `"${cmd}"`], { cwd: ROOT, windowsVerbatimArguments: true, windowsHide: true, stdio: "ignore" });
    const timer = setTimeout(() => { try { p.kill(); } catch { /* 이미 끝남 */ } }, 8 * 60 * 1000); // 한 장에 8분을 넘기면 포기
    p.on("close", (code) => { clearTimeout(timer); resolve(code); });
  });
}

// 이 컴퓨터는 Codex 셸이 저장을 못 하므로, 로그에 찍힌 generated_images 경로의 PNG 를 회수한다
function harvest(tag, rawAbs) {
  const lf = path.join(WORK, `log-${tag}.txt`);
  if (!fs.existsSync(lf)) return false;
  const t = fs.readFileSync(lf, "utf8");
  const found = [...t.matchAll(/generated_images[\\/]+([0-9a-f-]{36})[\\/]+([A-Za-z0-9._-]+\.png)/g)]
    .map((m) => path.join(process.env.USERPROFILE || "C:/Users/User", ".codex", "generated_images", m[1], m[2]));
  const png = found.find((p) => fs.existsSync(p));
  if (!png) return false;
  fs.copyFileSync(png, rawAbs);
  return true;
}

async function pool(jobs, n) {
  const out = [];
  let i = 0;
  await Promise.all(Array.from({ length: n }, async () => { while (i < jobs.length) { const j = jobs[i++]; out.push(await j()); } }));
  return out;
}

// ── 1) 대상 고르기 ──
const manifest = readJson(MANIFEST, {});
const rows = [];
for (let from = 0; ; from += 500) {
  const { data, error } = await sb.from("magazine").select("slug,corner,field,title,subtitle,excerpt,is_published,body_html,created_at").neq("corner", "report").order("created_at", { ascending: false }).range(from, from + 499);
  if (error) { console.error(`[${stamp()}] DB 조회 실패: ${error.message}`); process.exit(0); }
  rows.push(...data);
  if (data.length < 500) break;
}
const needs = rows.filter((r) => {
  if (ONLY.length && !ONLY.includes(r.slug)) return false;
  if (manifest[r.slug]) return false; // 기존 577편(manifest 로 대표 이미지가 덮이는 글)
  const imgs = railImages(railGet(r.body_html).rail);
  return imgs[0]?.credit !== AI_CREDIT;
});
// 공개된 글(최신 먼저) → 비축 초안(오래된 순 = 곧 공개될 순)
const published = needs.filter((r) => r.is_published);
const drafts = needs.filter((r) => !r.is_published).sort((a, b) => (a.created_at < b.created_at ? -1 : 1));
const todo = [...published, ...drafts].slice(0, LIMIT);
console.log(`[${stamp()}] 글 ${rows.length}편 · 코덱스 이미지 필요 ${needs.length}편(공개 ${published.length} · 초안 ${drafts.length}) · 이번 ${todo.length}편${DRY ? " (DRY)" : ""}`);
if (DRY) { for (const r of todo) console.log(`  - ${r.is_published ? "공개" : "초안"} ${r.slug} · ${r.title}`); process.exit(0); }

// ── 2~5) 만들고 올리고 연결 ──
let ok = 0, fail = 0;
await pool(todo.map((row) => async () => {
  const slug = row.slug;
  const rawAbs = path.join(RAW, `${slug}.png`);
  const rel = `.tmp/codex-magazine-auto/gen/${slug}.jpg`;
  try {
    if (!fs.existsSync(rawAbs)) {
      let made = false;
      for (let attempt = 1; attempt <= 2 && !made; attempt++) {
        const tag = `a-${slug}-${attempt}`;
        await runCodex(tag, prompt(row, rel));
        made = harvest(tag, rawAbs);
      }
      if (!made) throw new Error("코덱스가 이미지를 만들지 못했다(로그: .tmp/codex-magazine-auto/log-a-" + slug + "-*.txt)");
    }
    const big = await sharp(rawAbs).resize(1200, 750, { fit: "cover", position: "centre" }).jpeg({ quality: 72, mozjpeg: true }).toBuffer();
    const small = await sharp(rawAbs).resize(520, 325, { fit: "cover", position: "centre" }).jpeg({ quality: 70, mozjpeg: true }).toBuffer();
    if (big.length < 8000) throw new Error(`이미지가 비정상적으로 작다(${big.length}B)`);
    fs.writeFileSync(path.join(OUT, `${slug}.jpg`), big);
    fs.writeFileSync(path.join(REVIEW, `${slug}.jpg`), small); // 나중에 눈으로 훑어볼 수 있게

    for (const [key, buf] of [[`magazine/${slug}.jpg`, big], [`magazine/${slug}-s.jpg`, small]]) {
      const { error } = await sb.storage.from(BUCKET).upload(key, buf, { contentType: "image/jpeg", cacheControl: "31536000", upsert: true });
      if (error) throw new Error(`업로드 실패 ${key}: ${error.message}`);
    }
    const url = `${base}/storage/v1/object/public/${BUCKET}/magazine/${slug}.jpg`;

    // 방금 다시 읽어서 붙인다(코덱스가 도는 몇 분 사이에 다른 작업이 본문을 고쳤을 수 있다)
    const { data: fresh, error: e1 } = await sb.from("magazine").select("body_html").eq("slug", slug).maybeSingle();
    if (e1 || !fresh) throw new Error(`본문 재조회 실패: ${e1?.message ?? "없음"}`);
    const imgs = railImages(railGet(fresh.body_html).rail);
    if (imgs[0]?.credit === AI_CREDIT) { console.log(`  = ${slug} 그 사이 다른 곳에서 붙었다(건너뜀)`); return; }
    const body_html = railSetImages(fresh.body_html, [{ url, credit: AI_CREDIT }, ...imgs.slice(1)]);
    const { error: e2 } = await sb.from("magazine").update({ body_html }).eq("slug", slug);
    if (e2) throw new Error(`DB 갱신 실패: ${e2.message}`);

    const last = path.join(WORK, `last-a-${slug}-1.txt`);
    const note = fs.existsSync(last) ? fs.readFileSync(last, "utf8").trim().split(/\r?\n/).filter(Boolean).slice(0, 2).join(" / ").slice(0, 160) : "";
    console.log(`  ✓ ${row.is_published ? "공개" : "초안"} ${slug} ${note ? `· ${note}` : ""}`);
    ok++;
  } catch (e) {
    console.log(`  ✗ ${slug} ${String(e.message || e).slice(0, 200)}`);
    fail++;
  }
}), CONC);
console.log(`[${stamp()}] 완료 · 성공 ${ok} · 실패 ${fail} · 남은 대상 ${Math.max(0, needs.length - ok)}편`);
