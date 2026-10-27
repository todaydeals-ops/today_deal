// 2026-10 홈페이지 리뉴얼 — 고정 슬롯 이미지(히어로·대표) 제작기. Codex(codex exec)로 만들고 슬롯 크기에 맞춰 저장한다.
//
// 사용:
//   node scripts/renewal-images.mjs batch [이름...]   아직 없는 슬롯만 생성(이름을 주면 그것만)
//   node scripts/renewal-images.mjs apply              생성본을 슬롯 크기(cover)로 맞춰 public/renewal/ 에 저장
//
// ★원칙(wiki-images.mjs 와 같다)
//   - 이미지 안에 글자·숫자·로고·간판·공공기관 문양·사람 얼굴을 넣지 않는다. 브랜드 제품을 그리지 않는다.
//   - 한 번 만든 이미지는 고정한다(public/renewal/<이름>.jpg 가 있으면 다시 만들지 않는다).
//   - 모델은 항상 -m gpt-5.6-sol.
//   - 이 컴퓨터(계정 User)에서는 Codex 셸이 CryptUnprotectData 로 죽어 저장을 못 하므로, 로그에서 생성 PNG 를 회수(harvest)한다.
//   - 크기는 디자인 시안(.tmp/renewal/*.dc.html)의 실제 표시 크기에서 뽑았다 — 2x 해상도로 만든다.
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import sharp from "sharp";

const ROOT = path.resolve(import.meta.dirname, "..");
const WORK = path.join(ROOT, ".tmp", "codex-renewal");
const OUT = path.join(ROOT, "public", "renewal");
fs.mkdirSync(WORK, { recursive: true });
fs.mkdirSync(OUT, { recursive: true });

// 공통 화풍 — 새 디자인(흰 배경, 초록 포인트 #1f8a4f)에 맞춘 밝은 사진풍
const STYLE =
  "밝고 깨끗한 에디토리얼 사진풍. 자연광, 얕은 심도, 흰색·아이보리·연한 초록 톤이 주를 이루고 짙은 초록(#1f8a4f)을 아주 작은 포인트로만 쓴다. " +
  "채도는 낮고 정돈된 한국 가정의 실제 공간 느낌. 과장된 보정·네온·강한 그림자 금지.";

// 슬롯 정의 — w×h 는 저장 크기(2x). safe 는 "중앙에 두고 가장자리는 비운다" 같은 크롭 안전 지시.
const SLOTS = [
  // ── 홈 히어로 (우측 컬럼 ≈556×440~560, 모바일 390×240 — cover 로 잘리므로 피사체는 중앙)
  { name: "home-hero", w: 1600, h: 1400, safe: "가로로 잘려도 세로로 잘려도 괜찮도록 핵심 물건을 화면 중앙 60% 안에 두고, 아래쪽 20%는 비교적 비운 바닥·테이블 면으로 둔다(그 위에 카드가 얹힌다).",
    scene: "밝은 한국 아파트 거실 한쪽. 창가 쪽에 공기청정기와 작은 가전 두세 개가 나란히 놓여 있고, 앞쪽 원목 테이블에 글자 없는 메모 노트와 연필, 작은 화분이 있다. 무엇을 살지 고르는 조용한 오전 분위기. 사람은 없다." },

  // ── 홈 4개 축 카드 (높이 180 × 너비 ≈ 270 → 3:2)
  { name: "pillar-wiki", w: 1200, h: 800, scene: "원목 책상 위 글자 없는 탁상 달력(칸만 있음), 접힌 쇼핑백, 서류 봉투, 연필. 세일·신청 일정을 챙기는 정돈된 장면." },
  { name: "pillar-as", w: 1200, h: 800, scene: "세탁실에서 세탁기 문이 열려 있고 그 앞에 마른 수건과 작은 드라이버, 글자 없는 점검 체크리스트 종이(칸만 있음)가 놓인 장면. 고장 나기 전 점검하는 느낌." },
  { name: "pillar-health", w: 1200, h: 800, scene: "침대 협탁 위에 라벨이 없는 흰색 영양제 병 두 개, 크림 용기, 물컵, 접힌 안대. 뒤로 린넨 침구와 창가 빛. 잠·영양제·성분을 차분히 살피는 장면." },
  { name: "pillar-magazine", w: 1200, h: 800, scene: "펼쳐 둔 잡지(글자 없는 면, 도판 영역만 보이는 연한 색 블록)와 안경, 커피잔이 놓인 원목 테이블. 읽을거리를 고르는 장면." },

  // ── AS 셀프체크 카테고리 카드 9개 (높이 200 × 너비 ≈ 370 → 1.875:1)
  { name: "as-major", w: 1200, h: 640, scene: "밝은 다용도실에 세탁기와 냉장고가 나란히 서 있고 바닥에 마른 수건과 작은 드라이버가 놓인 장면. 브랜드 로고는 보이지 않는다." },
  { name: "as-kitchen", w: 1200, h: 640, scene: "주방 조리대 위에 전자레인지, 전기밥솥, 커피머신이 놓여 있고 앞에 원목 도마와 행주가 있는 장면. 로고·라벨·숫자 없음." },
  { name: "as-living", w: 1200, h: 640, scene: "거실 구석에 무선 청소기, 공기청정기, 정수기가 놓이고 창가 햇살이 드는 장면. 로고 없음." },
  { name: "as-mobile", w: 1200, h: 640, scene: "책상 위에 화면이 꺼진 스마트폰, 태블릿, 스마트워치와 정리된 충전 케이블이 놓인 장면. 브랜드 로고 없음, 화면은 검게 꺼져 있다." },
  { name: "as-pc", w: 1200, h: 640, scene: "책상 위 노트북과 모니터(둘 다 화면 꺼짐), 프린터, 외장하드가 정돈된 장면. 로고·글자 없음." },
  { name: "as-av", w: 1200, h: 640, scene: "거실에 화면이 꺼진 TV와 사운드바, 리모컨이 놓인 장면. 소파 한쪽이 보인다. 로고·글자 없음." },
  { name: "as-wellness", w: 1200, h: 640, scene: "욕실 선반 위에 고데기, 전기면도기, 체중계가 놓이고 접힌 수건이 있는 밝은 장면. 로고·글자·숫자 없음." },
  { name: "as-service", w: 1200, h: 640, scene: "현관 옆 선반에 공유기, 정리된 랜선, 도어락 모형과 우편함이 보이는 장면. 로고·글자 없음." },
  { name: "as-car", w: 1200, h: 640, scene: "지하주차장에서 자동차 보닛 가까이에 점프 케이블과 자동차 열쇠, 타이어 한쪽이 보이는 장면. 차량 엠블럼·번호판·글자 없음." },

  // ── 큐레이션 리포트 커버 5개 (3:4 세로)
  { name: "report-kitchen-living-guide-2-2606", w: 900, h: 1200, scene: "주방과 거실이 이어진 밝은 공간, 원목 식탁 위 글자 없는 노트와 연필, 작은 화분. 현명하게 고르는 느낌의 세로 구도." },
  { name: "report-kitchen-living-guide-1-2606", w: 900, h: 1200, scene: "정돈된 주방 선반에 그릇과 조리도구, 아래 원목 조리대 위 행주와 도마. 리빙·주방을 총정리하는 느낌의 세로 구도." },
  { name: "report-digital-device-selection-2606", w: 900, h: 1200, scene: "깔끔한 책상 위 노트북·태블릿·스마트폰이 수직으로 정렬된 구도(화면 꺼짐, 로고 없음), 아래쪽에 정리된 케이블." },
  { name: "report-home-appliance-selection-2606", w: 900, h: 1200, scene: "밝은 거실의 공기청정기와 로봇청소기, 창가의 식물이 세로로 쌓인 구도. 로고·글자 없음." },
  { name: "report-home-appliance-maintenance-2606", w: 900, h: 1200, scene: "세탁기 앞 마른 수건 더미와 청소용 솔, 작은 드라이버가 정돈된 세로 구도. 관리·점검하는 느낌, 로고·글자 없음." },
];

function prompt(s, rel) {
  return `오늘의딜(todaydeals.co.kr) 홈페이지 리뉴얼용 이미지 1장을 만든다. 이 작업은 사장님 지시로 Claude 가 직접 호출한 것이라 AI_COORDINATION.md 우편함 항목은 없다. 이미지 생성만 하고 멈춘다.

## 장면
${s.scene}

## 화풍
${STYLE}

## 구도·크기
- 최종 크기는 정확히 ${s.w}x${s.h}px(${(s.w / s.h).toFixed(2)}:1), JPG.
${s.safe ? `- ${s.safe}\n` : "- 가장자리가 잘릴 수 있으니 핵심 물건은 중앙에 두고 가장자리에는 중요한 것을 두지 않는다.\n"}
## 반드시 지킬 것
- **이미지 안에 어떤 글자도 넣지 않는다.** 한글·영문·숫자·기호·로고·간판·라벨·공공기관 문양 모두 금지. 달력이나 서류가 나오면 칸과 선만 그린다.
- 실존 인물·사실적인 사람 얼굴·특정 브랜드 제품·로고·엠블럼을 그리지 않는다. 손 정도는 괜찮다.
- 불안·공포를 주는 연출(붉은 경고, 어두운 방) 대신 밝고 차분한 분위기.

## 저장
\`${rel}\` (폴더가 없으면 만든다). 이 파일 하나만 만들고 멈춘다. 다른 파일·코드·콘텐츠는 건드리지 않는다.
※ 이미지 생성 후 저장·변환 단계에서 셸 실행 오류가 나면 **재시도하지 말고 바로 끝낸다.** 생성된 이미지는 호출한 쪽이 따로 회수해 변환한다.

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

// 로그에 남은 생성 PNG 경로를 찾아 원본 그대로(리사이즈 없이) .tmp/codex-renewal/raw/<name>.png 로 복사한다.
function harvest(tags, rawAbs) {
  for (const tag of tags) {
    const lf = path.join(WORK, `log-${tag}.txt`);
    if (!fs.existsSync(lf)) continue;
    const t = fs.readFileSync(lf, "utf8");
    const found = [...t.matchAll(/generated_images[\\/]+([0-9a-f-]{36})[\\/]+([A-Za-z0-9._-]+\.png)/g)]
      .map((m) => path.join(process.env.USERPROFILE || "C:/Users/User", ".codex", "generated_images", m[1], m[2]));
    const png = found.find((p) => fs.existsSync(p));
    if (!png) continue;
    fs.mkdirSync(path.dirname(rawAbs), { recursive: true });
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

const [mode, ...names] = process.argv.slice(2);
const rawPath = (n) => path.join(WORK, "raw", `${n}.png`);

if (mode === "batch") {
  const todo = SLOTS.filter((s) => (names.length ? names.includes(s.name) : true)).filter((s) => !fs.existsSync(path.join(OUT, `${s.name}.jpg`)) && !fs.existsSync(rawPath(s.name)));
  console.log(`대상 ${todo.length}장 · 동시 3개`);
  const res = await pool(todo.map((s) => async () => {
    let code = await runCodex(`r-${s.name}`, prompt(s, `.tmp/codex-renewal/out/${s.name}.jpg`));
    let ok = harvest([`r-${s.name}`], rawPath(s.name));
    if (!ok) { code = await runCodex(`r-${s.name}-retry`, prompt(s, `.tmp/codex-renewal/out/${s.name}.jpg`)); ok = harvest([`r-${s.name}-retry`], rawPath(s.name)); }
    console.log(`${ok ? "✓" : "✗"} ${s.name} (exit ${code})`);
    return ok;
  }), 3);
  console.log(`완료 ${res.filter(Boolean).length}/${todo.length}`);
} else if (mode === "apply") {
  let n = 0, miss = [];
  for (const s of SLOTS) {
    const dst = path.join(OUT, `${s.name}.jpg`);
    if (fs.existsSync(dst)) continue; // 발행 이미지 고정
    if (!fs.existsSync(rawPath(s.name))) { miss.push(s.name); continue; }
    await sharp(rawPath(s.name)).resize(s.w, s.h, { fit: "cover", position: "centre" }).jpeg({ quality: 84, mozjpeg: true }).toFile(dst);
    n++;
  }
  console.log(`적용 ${n}장${miss.length ? ` · 원본 없음 ${miss.length}장(${miss.join(", ")})` : ""}`);
} else {
  console.error("사용: batch [이름...] | apply");
}
