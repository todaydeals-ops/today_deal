// 생활백과 히어로·본문 이미지 제작기 — Codex(codex exec)를 직접 호출한다(trendfeed·alleymag 패턴).
//
// 사용:
//   node scripts/wiki-images.mjs sample <slug>        스타일 견본 3장(A 플랫 일러스트 · B 정물 사진풍 · C 종이 공예풍)
//   node scripts/wiki-images.mjs batch <스타일A|B|C>    대상 항목 전부(히어로 + 본문 1장), 이미 있는 건 건너뛴다
//
// ★원칙(전역 CLAUDE.md §4·§6)
//   - 이미지 안에 글자·숫자·로고·공공기관 문양을 넣지 않는다. 한글은 생성 이미지에서 뭉개진다. 정보는 본문이 맡는다.
//   - 실존 인물·연예인·특정 브랜드 제품을 그리지 않는다 — 그래서 「영상 속 그 제품」(video-pick)은 대상에서 뺀다
//     (원본 영상 임베드가 이미 대표 시각물이고, AI 가 그 제품을 그리면 다른 물건을 그 제품처럼 보이게 만든다).
//   - 한 번 만든 이미지는 고정한다. public/wiki-img/manifest.json 에 기록하고, 있으면 다시 만들지 않는다.
//   - 모델은 항상 -m gpt-5.6-sol (기본값 gpt-6-astra 는 비싸다는 사장님 지시).
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";

const ROOT = path.resolve(import.meta.dirname, "..");
const WIKI = path.join(ROOT, "content", "wiki");
const WORK = path.join(ROOT, ".tmp", "codex-wiki");
fs.mkdirSync(WORK, { recursive: true });

// ★회수(harvest) — 10-27 이 컴퓨터(계정 User)에서 Codex 의 셸이 `CryptUnprotectData failed` 로 막혀
//   이미지는 만들어 두고(~/.codex/generated_images/<uuid>/*.png) 지정 경로에 저장·변환을 못 했다(exit 0 인데 파일 없음).
//   그래서 Codex 로그에 남은 생성 PNG 경로를 찾아 여기서 1600x900 JPG 로 변환해 저장한다.
//   셸이 정상인 컴퓨터에선 Codex 가 직접 저장하므로 이 단계는 건너뛴다(파일이 이미 있으면 회수하지 않는다).
import sharp from "sharp";
async function harvest(logTags, outAbs) {
  for (const tag of logTags) {
    const lf = path.join(WORK, `log-${tag}.txt`);
    if (!fs.existsSync(lf)) continue;
    const t = fs.readFileSync(lf, "utf8");
    const found = [...t.matchAll(/generated_images[\\/]+([0-9a-f-]{36})[\\/]+([A-Za-z0-9._-]+\.png)/g)]
      .map((m) => path.join(process.env.USERPROFILE || "C:/Users/User", ".codex", "generated_images", m[1], m[2]));
    const png = found.find((p) => fs.existsSync(p));
    if (!png) continue;
    fs.mkdirSync(path.dirname(outAbs), { recursive: true });
    await sharp(png).resize(1600, 900, { fit: "cover", position: "centre" }).jpeg({ quality: 92 }).toFile(outAbs);
    return true;
  }
  return false;
}

const STYLES = {
  A: "플랫 에디토리얼 일러스트. 종이 질감이 살짝 보이는 미색 배경(#f3efe9 계열), 잉크 블랙(#16140f)과 테라코타 오렌지(#ff5a3c) 두 색을 중심으로 한 절제된 팔레트. 굵기가 일정한 선, 단순한 도형, 여백이 넉넉한 잡지 삽화 느낌.",
  B: "자연광 아래 나무 책상 위 정물 사진풍. 실제 물건을 위에서 비스듬히 내려다본 구도, 얕은 심도, 따뜻한 오후 햇빛, 미색과 갈색 톤에 테라코타 오렌지 소품 하나로 포인트. 광고 사진처럼 과하지 않은 담백한 생활 사진.",
  C: "종이 공예(페이퍼 컷아웃) 디오라마풍. 여러 겹의 색종이를 오려 붙인 입체감, 부드러운 그림자, 미색·베이지·잉크 블랙·테라코타 오렌지 팔레트. 손으로 만든 따뜻한 느낌.",
};

// 항목 종류별 소재 힌트 — 글자 없이 상황이 읽히는 물건만
const MOTIF = {
  apply: "서류 봉투, 달력(숫자 없이 칸만), 동전과 지폐(액면 표시 없이), 계산기, 도장 대신 체크 표시, 시계, 집·자동차 같은 생활 모형",
  sale: "쇼핑백, 선물 상자, 포장 리본, 장바구니, 택배 상자, 달력(숫자 없이 칸만), 가격표(글자 없는 빈 태그)",
};

// 항목별 고유 소재 — 25장이 전부 "책상 위 달력·계산기"로 수렴하지 않게(견본 3장이 모두 그 구도였다).
//   글자 없는 물건만. 브랜드·로고·공공기관 문양이 드러나는 물건은 넣지 않는다.
const SLUG_MOTIF = {
  "year-end-tax-settlement": "영수증 묶음과 서류 봉투, 사무실 책상, 1월 아침 햇살",
  "hometown-love-donation": "지역 특산물이 담긴 선물 상자(사과·한과·쌀 포대처럼 글자 없는 포장), 시골 풍경이 보이는 창가",
  "comprehensive-real-estate-tax": "아파트 단지 모형과 집 열쇠, 차분한 거실 테이블",
  "car-tax-annual-payment": "자동차 열쇠와 작은 자동차 모형, 현관 수납장 위",
  "global-income-tax-filing": "노트북과 정리된 서류 파일, 프리랜서의 작업 책상",
  "earned-income-tax-credit": "작업용 장갑과 도시락, 동전이 든 유리병, 소박한 식탁",
  "vat-filing-individual": "작은 가게 계산대 위 영수증 롤과 카드 단말기(화면에 글자 없이), 매장 조명",
  "property-tax-payment": "단독주택 모형과 화분, 마당이 보이는 창가",
  "resident-tax-payment": "아파트 우편함 앞 우편물(글자 없는 봉투), 현관 복도",
  "health-insurance-refund": "지갑에서 반쯤 나온 카드(글자·로고 없는 무지 카드)와 동전, 거실 소파 옆 협탁",
  "national-health-checkup": "청진기와 혈압계, 깨끗한 진료실 느낌의 흰 책상(사람 없이)",
  "energy-voucher": "겨울 거실의 난방기(라디에이터)와 니트 담요, 따뜻한 차 한 잔",
  "hidden-insurance-money": "오래된 서랍 속에서 꺼낸 서류 봉투와 돋보기",
  "dormant-deposit": "도자기 돼지 저금통과 오래된 무지 통장 느낌의 수첩, 동전",
  "culture-nuri-card": "공연 티켓 모양 종이(글자 없이)와 책, 공연장 의자 느낌의 붉은 벨벳",
  "aliexpress-1111": "해외 배송 택배 상자 여러 개(송장·글자 없이)와 포장 테이프",
  "musinsa-black-friday": "옷걸이에 걸린 겨울 코트와 운동화 상자(로고 없이)",
  "lunar-new-year-gift-preorder": "전통 보자기로 싼 명절 선물 상자와 곶감·한과",
  "amazon-prime-day": "현관 앞에 쌓인 택배 상자(로고·송장 없이), 여름 햇빛",
  "bigsmileday": "장바구니에 담긴 생활용품(글자 없는 포장), 밝은 주방 조리대",
  "grand-11st-day": "쇼핑백 여러 개와 휴대폰(화면 꺼진 상태), 카페 테이블",
  "coupang-cublf": "새벽 현관 앞 택배 상자와 장바구니(로고 없이)",
  "oliveyoung-sale": "화장품 병과 튜브(라벨·글자 없이), 세면대 선반",
  "black-friday-direct-purchase": "해외 직구 상자와 여권 지갑(글자 없이), 공항 느낌의 차분한 조명",
  "november-sale-calendar-2026": "벽에 걸린 빈 칸 달력과 쇼핑백, 늦가을 창가",
};

function entries() {
  return fs.readdirSync(WIKI).filter((f) => f.endsWith(".json")).map((f) => JSON.parse(fs.readFileSync(path.join(WIKI, f), "utf8")))
    .filter((e) => e.type === "apply" || e.type === "sale");
}

function prompt(e, style, outRel, role) {
  const scene = role === "body"
    ? "본문 중간에 들어갈 두 번째 장면이다. 히어로와 같은 화풍이되, 다른 소재·다른 구도로(예: 히어로가 책상 전체라면 여기는 손이나 물건 하나를 가까이)."
    : "항목 맨 위 히어로 이미지다. 이 항목이 무엇에 관한 것인지 한눈에 느껴지는 대표 장면.";
  return `오늘의딜(todaydeals.co.kr) 생활백과 이미지 1장을 만든다. 이 작업은 사장님 지시로 Claude 가 직접 호출한 것이라 AI_COORDINATION.md 우편함 항목은 없다. 우편함을 읽을 필요 없이 아래 지시만 따른다.

## 항목
- 제목: ${e.title}
- 내용 요약: ${e.summary.join(" / ")}
- 종류: ${e.type === "apply" ? "세금 신고·환급·지원금 신청 일정" : "쇼핑 세일 행사 일정"}

## 역할
${scene}

## 화풍
${STYLES[style]}

## 소재
${SLUG_MOTIF[e.slug] ? `이 항목 고유 소재(우선): ${SLUG_MOTIF[e.slug]}\n보조 소재(필요하면): ${MOTIF[e.type]}` : MOTIF[e.type]}

## 반드시 지킬 것
- **이미지 안에 어떤 글자도 넣지 않는다.** 한글·영문·숫자·기호·로고·간판·라벨·공공기관 문양 모두 금지. 달력이나 서류가 나오면 칸과 선만 있고 글자는 없게.
- 실존 인물, 사실적인 사람 얼굴, 특정 브랜드 제품·로고·포장을 그리지 않는다. 손 정도는 괜찮다.
- 불안·공포를 주는 연출(붉은 경고, 압류 딱지 같은 것) 대신 차분하고 정돈된 분위기.
- 크기 정확히 1600x900px(16:9), JPG.

## 저장
\`${outRel}\` (폴더가 없으면 만든다). 이 파일 하나만 만들고 멈춘다. 다른 파일·코드·콘텐츠는 건드리지 않는다.
※ 이미지 생성 후 저장·변환 단계에서 셸 실행 오류가 나면 **재시도하지 말고 바로 끝낸다.** 생성된 이미지는 호출한 쪽이 따로 회수해 변환한다. 스킬 안내 파일을 읽으려고 셸을 여는 시도도 하지 않는다.

## 끝나면
마지막 메시지에 이미지에 담긴 장면(구도·색·소재)을 3줄 안으로 적는다.`;
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

async function pool(jobs, n) {
  const out = [];
  let i = 0;
  await Promise.all(Array.from({ length: n }, async () => { while (i < jobs.length) { const j = jobs[i++]; out.push(await j()); } }));
  return out;
}

const [mode, arg] = process.argv.slice(2);
if (mode === "sample") {
  const e = entries().find((x) => x.slug === arg);
  if (!e) { console.error(`대상 항목 없음: ${arg}`); process.exit(1); }
  const jobs = Object.keys(STYLES).map((s) => async () => {
    const rel = `.tmp/codex-wiki/samples/${e.slug}-${s}.jpg`;
    const t0 = Date.now();
    const code = await runCodex(`sample-${e.slug}-${s}`, prompt(e, s, rel, "hero"));
    const ok = fs.existsSync(path.join(ROOT, rel));
    console.log(`${s} ${ok ? "✓" : "✗"} (exit ${code}, ${Math.round((Date.now() - t0) / 1000)}초) ${rel}`);
    return ok;
  });
  await pool(jobs, 3);
} else if (mode === "batch") {
  const style = (arg || "").toUpperCase();
  if (!STYLES[style]) { console.error("스타일 A|B|C 를 지정"); process.exit(1); }
  const man = path.join(ROOT, "public", "wiki-img", "manifest.json");
  const manifest = fs.existsSync(man) ? JSON.parse(fs.readFileSync(man, "utf8")) : {};
  const jobs = [];
  for (const e of entries()) for (const role of ["hero", "body"]) {
    const key = `${e.slug}-${role}`;
    if (manifest[key]) continue; // 고정 — 이미 만든 건 다시 만들지 않는다
    const rel = `.tmp/codex-wiki/batch/${key}.jpg`;
    if (fs.existsSync(path.join(ROOT, rel))) continue;
    jobs.push(async () => {
      const abs = path.join(ROOT, rel);
      let code = await runCodex(`batch-${key}`, prompt(e, style, rel, role));
      if (!fs.existsSync(abs)) await harvest([`batch-${key}`], abs); // 저장 못 했어도 만든 이미지가 있으면 회수
      if (!fs.existsSync(abs)) { // 이미지 자체가 없을 때만 1회 재시도(쓸모없는 재생성을 막는다)
        code = await runCodex(`batch-${key}-retry`, prompt(e, style, rel, role));
        if (!fs.existsSync(abs)) await harvest([`batch-${key}-retry`], abs);
      }
      const ok = fs.existsSync(abs);
      console.log(`${ok ? "✓" : "✗"} ${key} (exit ${code})`);
      return ok;
    });
  }
  console.log(`대상 ${jobs.length}장 · 동시 3개`);
  const res = await pool(jobs, 3);
  console.log(`완료 ${res.filter(Boolean).length}/${jobs.length}`);
} else if (mode === "apply") {
  // 회수·생성된 .tmp/codex-wiki/batch/<slug>-hero|body.jpg(1600x900)를 사이트용 크기로 변환해 public/wiki-img/ 에 두고
  // content/wiki-images.json 에 기록한다. ★이미 기록된 항목은 건드리지 않는다(발행 이미지 고정).
  const outDir = path.join(ROOT, "public", "wiki-img");
  const manPath = path.join(ROOT, "content", "wiki-images.json");
  const man = JSON.parse(fs.readFileSync(manPath, "utf8"));
  fs.mkdirSync(outDir, { recursive: true });
  let added = 0, skipped = 0, noHero = [];
  for (const e of entries()) {
    if (man[e.slug]) { skipped++; continue; }
    const src = (r) => path.join(ROOT, ".tmp", "codex-wiki", "batch", `${e.slug}-${r}.jpg`);
    if (!fs.existsSync(src("hero"))) { noHero.push(e.slug); continue; }
    await sharp(src("hero")).resize(1200, 675, { fit: "cover" }).jpeg({ quality: 82, mozjpeg: true }).toFile(path.join(outDir, `${e.slug}-hero.jpg`));
    await sharp(src("hero")).resize(1200, 630, { fit: "cover" }).jpeg({ quality: 82, mozjpeg: true }).toFile(path.join(outDir, `${e.slug}-og.jpg`));
    const rec = { hero: `/wiki-img/${e.slug}-hero.jpg`, og: `/wiki-img/${e.slug}-og.jpg`, alt: `${e.title} 관련 소재를 담은 정물 이미지` };
    if (fs.existsSync(src("body"))) {
      await sharp(src("body")).resize(960, 540, { fit: "cover" }).jpeg({ quality: 80, mozjpeg: true }).toFile(path.join(outDir, `${e.slug}-body.jpg`));
      rec.body = `/wiki-img/${e.slug}-body.jpg`;
    }
    man[e.slug] = rec; added++;
  }
  fs.writeFileSync(manPath, JSON.stringify(man, null, 2) + "\n");
  console.log(`적용 ${added}개 · 이미 고정 ${skipped}개 · 히어로 없음 ${noHero.length}개${noHero.length ? " (" + noHero.join(", ") + ")" : ""}`);
} else if (mode === "harvest") {
  // 이미 돌아간 배치의 로그에서 생성 이미지를 회수한다(파일이 없는 키만).
  let n = 0, miss = 0;
  for (const e of entries()) for (const role of ["hero", "body"]) {
    const key = `${e.slug}-${role}`;
    const abs = path.join(ROOT, ".tmp", "codex-wiki", "batch", `${key}.jpg`);
    if (fs.existsSync(abs)) continue;
    if (await harvest([`batch-${key}`, `batch-${key}-retry`], abs)) { n++; console.log(`✓ 회수 ${key}`); } else miss++;
  }
  console.log(`회수 ${n}장 · 로그에 이미지 없음 ${miss}장`);
} else {
  console.error("사용: sample <slug> | batch <A|B|C> | harvest | apply");
  process.exit(1);
}
