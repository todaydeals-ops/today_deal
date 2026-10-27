// 2026-10 홈페이지 리뉴얼 — 매거진 글 대표 이미지(코덱스 제작). 스톡 사진(글과 안 맞거나 사람 얼굴이 섞인 것)을 새 정물사진풍으로 바꾼다.
//
// 사용:
//   node scripts/magazine-codex-images.mjs batch            장면(content/magazine-image-scenes.json)이 있고 아직 안 만든 글을 만든다
//     환경변수 MAX=N  한 번에 N장까지만 / ONLY=slug1,slug2  지정한 글만
//   node scripts/magazine-codex-images.mjs apply            원본 PNG → 1200x750 JPG(.tmp/codex-magazine/out/<slug>.jpg)
//   node scripts/magazine-codex-images.mjs upload           Supabase Storage(public 버킷 site-images)로 올리고 content/magazine-images.json 에 기록
//
// ★원칙(wiki-images.mjs·renewal-images.mjs 와 같다)
//   - 이미지 안에 글자·숫자·로고·브랜드·공공기관 문양·사람 얼굴을 넣지 않는다. 한 번 만든 이미지는 고정한다(이미 있으면 다시 만들지 않는다).
//   - 모델은 항상 -m gpt-5.6-sol. 이 컴퓨터에서는 Codex 셸이 저장을 못 하므로 로그에서 생성 PNG 를 회수(harvest)한다.
//   - 이미지는 저장소(public/)에 넣지 않고 Supabase Storage 에 둔다 — 577장이라 배포 용량이 커진다.
//   - 마스터는 1600x1000(1.6:1) 하나로 만들고, 대표(≈568x340)·피처드(≈568x360)·썸네일(96x72, 76x76)은 cover 로 잘라 쓴다 → 핵심 물건은 중앙.
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import sharp from "sharp";

const ROOT = path.resolve(import.meta.dirname, "..");
const WORK = path.join(ROOT, ".tmp", "codex-magazine");
const RAW = path.join(WORK, "raw");
const OUT = path.join(WORK, "out");
const SCENES = path.join(ROOT, "content", "magazine-image-scenes.json");
const MANIFEST = path.join(ROOT, "content", "magazine-images.json");
const BUCKET = "site-images";
for (const d of [WORK, RAW, OUT]) fs.mkdirSync(d, { recursive: true });

const STYLE =
  "밝고 깨끗한 에디토리얼 정물사진풍. 자연광, 얕은 심도, 흰색·아이보리·연한 초록 톤이 주를 이루고 짙은 초록(#1f8a4f)을 아주 작은 포인트로만 쓴다. " +
  "채도는 낮고 정돈된 한국 가정의 실제 공간 느낌. 과장된 보정·네온·강한 그림자 금지.";

function prompt(scene, rel) {
  return `오늘의딜(todaydeals.co.kr) 매거진 글의 대표 이미지 1장을 만든다. 이 작업은 사장님 지시로 Claude 가 직접 호출한 것이라 AI_COORDINATION.md 우편함 항목은 없다. 이미지 생성만 하고 멈춘다.

## 장면
${scene}

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
마지막 메시지에 이미지에 담긴 장면(구도·색·소재)을 2줄 안으로 적는다.`;
}

function runCodex(tag, text) {
  return new Promise((resolve) => {
    const pf = path.join(WORK, `prompt-${tag}.md`), lf = path.join(WORK, `log-${tag}.txt`), of = path.join(WORK, `last-${tag}.txt`);
    fs.writeFileSync(pf, text);
    fs.rmSync(of, { force: true });
    const cmd = `codex exec -m gpt-5.6-sol -C "${ROOT}" --skip-git-repo-check -s workspace-write -o "${of}" - < "${pf}" > "${lf}" 2>&1`;
    const p = spawn("cmd.exe", ["/d", "/s", "/c", `"${cmd}"`], { cwd: ROOT, windowsVerbatimArguments: true, windowsHide: true, stdio: "ignore" });
    p.on("close", (code) => resolve(code));
  });
}

function harvest(tags, rawAbs) {
  for (const tag of tags) {
    const lf = path.join(WORK, `log-${tag}.txt`);
    if (!fs.existsSync(lf)) continue;
    const t = fs.readFileSync(lf, "utf8");
    const found = [...t.matchAll(/generated_images[\\/]+([0-9a-f-]{36})[\\/]+([A-Za-z0-9._-]+\.png)/g)]
      .map((m) => path.join(process.env.USERPROFILE || "C:/Users/User", ".codex", "generated_images", m[1], m[2]));
    const png = found.find((p) => fs.existsSync(p));
    if (!png) continue;
    fs.copyFileSync(png, rawAbs);
    return true;
  }
  return false;
}

async function pool(jobs, n) {
  const out = [];
  let i = 0;
  await Promise.all(Array.from({ length: n }, async () => { while (i < jobs.length) { const j = jobs[i++]; out.push(await j()); } }));
  return out;
}

const readJson = (f, d) => (fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, "utf8")) : d);
const rawOf = (s) => path.join(RAW, `${s}.png`);
const outOf = (s) => path.join(OUT, `${s}.jpg`);
const [mode] = process.argv.slice(2);

if (mode === "batch") {
  const scenes = readJson(SCENES, {});
  const manifest = readJson(MANIFEST, {});
  const only = process.env.ONLY ? new Set(process.env.ONLY.split(",")) : null;
  const MAX = Number(process.env.MAX || 0);
  const todo = [];
  for (const [slug, scene] of Object.entries(scenes)) { // 장면 파일의 순서 = 최신 글부터
    if (only && !only.has(slug)) continue;
    if (manifest[slug] || fs.existsSync(rawOf(slug))) continue; // 고정 — 이미 만든 건 다시 만들지 않는다
    todo.push([slug, scene]);
    if (MAX && todo.length >= MAX) break;
  }
  console.log(`대상 ${todo.length}장 · 동시 3개`);
  const res = await pool(todo.map(([slug, scene]) => async () => {
    const rel = `.tmp/codex-magazine/gen/${slug}.jpg`;
    let code = await runCodex(`m-${slug}`, prompt(scene, rel));
    let ok = harvest([`m-${slug}`], rawOf(slug));
    if (!ok) { code = await runCodex(`m-${slug}-retry`, prompt(scene, rel)); ok = harvest([`m-${slug}-retry`], rawOf(slug)); }
    console.log(`${ok ? "✓" : "✗"} ${slug} (exit ${code})`);
    return ok;
  }), 3);
  console.log(`완료 ${res.filter(Boolean).length}/${todo.length}`);
} else if (mode === "apply") {
  let n = 0;
  for (const f of fs.readdirSync(RAW).filter((x) => x.endsWith(".png"))) {
    const slug = f.replace(/\.png$/, "");
    if (fs.existsSync(outOf(slug))) continue;
    await sharp(path.join(RAW, f)).resize(1200, 750, { fit: "cover", position: "centre" }).jpeg({ quality: 78, mozjpeg: true }).toFile(outOf(slug));
    n++;
  }
  console.log(`변환 ${n}장 → ${OUT}`);
} else if (mode === "upload") {
  const require = createRequire(path.join(ROOT, "package.json"));
  const { createClient } = require("@supabase/supabase-js");
  const env = Object.fromEntries(fs.readFileSync(path.join(ROOT, ".env.local"), "utf8").split(/\r?\n/).filter((l) => l && !l.startsWith("#") && l.includes("=")).map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, "")]; }));
  const base = env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL;
  const sb = createClient(base, env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_KEY, { auth: { persistSession: false } });
  const { data: bs } = await sb.storage.listBuckets();
  if (!(bs || []).some((b) => b.name === BUCKET)) {
    const { error } = await sb.storage.createBucket(BUCKET, { public: true, fileSizeLimit: 5 * 1024 * 1024, allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"] });
    if (error) { console.error("버킷 생성 실패:", error.message); process.exit(1); }
    console.log(`버킷 ${BUCKET} 생성(public)`);
  }
  const manifest = readJson(MANIFEST, {});
  const files = fs.readdirSync(OUT).filter((x) => x.endsWith(".jpg"));
  let up = 0, skip = 0, fail = 0;
  await pool(files.map((f) => async () => {
    const slug = f.replace(/\.jpg$/, "");
    if (manifest[slug]) { skip++; return; } // 발행 이미지 고정
    const key = `magazine/${slug}.jpg`;
    const { error } = await sb.storage.from(BUCKET).upload(key, fs.readFileSync(path.join(OUT, f)), { contentType: "image/jpeg", cacheControl: "31536000", upsert: false });
    if (error && !/already exists|Duplicate/i.test(error.message)) { fail++; console.error("✗", slug, error.message); return; }
    manifest[slug] = `${base}/storage/v1/object/public/${BUCKET}/${key}`;
    up++;
  }), 6);
  // 키 순서를 고정(diff 가 깨끗하도록)
  const sorted = Object.fromEntries(Object.entries(manifest).sort(([a], [b]) => a.localeCompare(b)));
  fs.writeFileSync(MANIFEST, JSON.stringify(sorted, null, 2) + "\n");
  console.log(`업로드 ${up}장 · 이미 고정 ${skip}장 · 실패 ${fail}장 · 기록 ${Object.keys(sorted).length}건`);
} else {
  console.error("사용: batch | apply | upload");
}
