// 클립 제목에서 원료를 뽑는다 — 협찬연구소 매칭의 1단계.
//
// 사전을 새로 만들지 않는다. 알약연구소·성분연구소가 이미 원료 100여 개를 다뤄왔고
// 그 택소노미가 곧 사전이다. 우리 자산이 그대로 도구가 된다.
// 사전에 없는 원료는 --unknown 으로 뽑아 사람이 사전에 추가한다.
//
// ★해석하지 않는다. 제목에 그 단어가 있다는 사실만 기록한다.
//   "이 방송이 그 원료를 밀었다"는 판단은 우리가 하지 않는다.
//
// 사용: node scripts/clip-ingredient.mjs [--min=2] [--unknown]
import fs from "node:fs";
import path from "node:path";

const CLIPS = path.join(process.cwd(), ".work", "clips");
const arg = (k) => (process.argv.find((a) => a.startsWith(`--${k}=`)) || "").split("=")[1] || "";
const MIN = Number(arg("min") || 1);

// ── 사전 ──────────────────────────────────────────────
// 1) 우리 택소노미의 원료 글 제목에서 뽑는다
const DICT = new Set();
function harvest(file) {
  if (!fs.existsSync(file)) return;
  const s = fs.readFileSync(file, "utf8");
  for (const m of s.matchAll(/label:\s*"([^"]+)"/g)) DICT.add(m[1]);
}
harvest("lib/magazine/pillCategories.ts");
harvest("lib/magazine/beautyCategories.ts");

// 2) 건기식·화장품에서 실제로 방송에 오르내리는 원료명(수동 시드)
//    식약처 기능성 원료와 개별인정형 원료 중 방송 노출이 잦은 것들.
const SEED = [
  "콘드로이친", "글루코사민", "MSM", "보스웰리아", "초록입홍합", "콜라겐", "히알루론산",
  "루테인", "지아잔틴", "아스타잔틴", "오메가3", "EPA", "DHA", "크릴오일",
  "밀크씨슬", "실리마린", "아르기닌", "시트룰린", "코엔자임", "코큐텐",
  "프로바이오틱스", "프리바이오틱스", "포스트바이오틱스", "유산균", "락토바실러스",
  "매스틱", "매스틱검", "베르베린", "여주", "바나바", "크롬", "이눌린",
  "비타민D", "비타민C", "비타민B", "비타민K2", "엽산", "마그네슘", "칼슘", "아연", "철분",
  "포스파티딜세린", "PS", "은행잎", "GABA", "테아닌", "멜라토닌", "감태",
  "쏘팔메토", "크랜베리", "석류", "이소플라본", "백수오", "승마",
  "홍삼", "진세노사이드", "흑삼", "산양삼", "천연식초", "낫토키나제",
  "폴리코사놀", "레시틴", "알부민", "단백질", "BCAA", "HMB", "크레아틴",
  "차전자피", "알로에", "노니", "모링가", "스피루리나", "클로렐라",
  "레티놀", "나이아신아마이드", "세라마이드", "펩타이드", "EGF", "판테놀",
  "센텔라", "병풀", "티트리", "살리실산", "글리세린", "스쿠알란", "아젤라익산",
  "가르시니아", "L-카르니틴", "CLA", "녹차추출물", "카테킨", "파라다이스 그레인",
];
for (const s of SEED) DICT.add(s);

const words = [...DICT].filter((w) => w.length >= 2).sort((a, b) => b.length - a.length);
console.log(`사전 ${words.length}개 (택소노미 + 시드)\n`);

// ── 클립 스캔 ──────────────────────────────────────────
const rows = [];
for (const f of fs.readdirSync(CLIPS).filter((x) => x.endsWith(".json"))) {
  const j = JSON.parse(fs.readFileSync(path.join(CLIPS, f), "utf8"));
  for (const c of j.clips) {
    const t = c.title;
    const hits = words.filter((w) => t.includes(w));
    if (hits.length) rows.push({ prog: j.program, ch: j.channel, date: c.airdate, title: t, url: c.url, ing: hits });
  }
}

// 원료별 집계
const by = {};
for (const r of rows) for (const w of r.ing) (by[w] ||= []).push(r);

const sorted = Object.entries(by).filter(([, v]) => v.length >= MIN).sort((a, b) => b[1].length - a[1].length);
console.log(`원료가 잡힌 클립 ${rows.length}건 · 원료 ${sorted.length}종\n`);
console.log("원료".padEnd(16) + "건수  채널(프로그램)");
for (const [w, v] of sorted) {
  const chans = [...new Set(v.map((x) => `${x.ch}·${x.prog}`))];
  console.log(`${w.padEnd(16)}${String(v.length).padStart(3)}   ${chans.slice(0, 3).join(" / ")}${chans.length > 3 ? ` 외 ${chans.length - 3}` : ""}`);
}

// ★여러 채널에 걸친 원료 — 협찬연구소가 가장 먼저 볼 자리
const cross = sorted.filter(([, v]) => new Set(v.map((x) => x.ch)).size >= 2);
if (cross.length) {
  console.log(`\n■ 두 개 이상 채널에 나온 원료 ${cross.length}종`);
  for (const [w, v] of cross) {
    console.log(`\n  ${w}`);
    for (const r of v.slice(0, 6)) console.log(`     ${(r.date || "날짜미상").padEnd(11)} ${r.ch.padEnd(6)} ${r.prog.padEnd(14)} ${r.title.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/gu, "").trim().slice(0, 52)}`);
  }
}

fs.writeFileSync(path.join(process.cwd(), ".work", "clip-ingredients.json"),
  JSON.stringify({ generated: new Date().toISOString(), rows, byIngredient: Object.fromEntries(sorted) }, null, 2), "utf8");
console.log(`\n→ .work/clip-ingredients.json 저장`);
