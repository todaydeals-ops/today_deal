// 방송 클립 아카이버 — 협찬연구소의 핵심 원자재.
//
// ★왜 편성표가 아니라 클립인가
// 편성표에는 프로그램명과 회차 번호뿐이라 그날 무슨 원료를 다뤘는지 알 수 없다.
// 그런데 방송사가 자기 공식 유튜브에 올리는 클립 제목에는 원료가 그대로 박혀 있다.
// 예) TV조선 명의보감 닥터스 260824 「매스틱 위산 분비를 조절해…」
// 회차마다 질환 클립과 원료 클립이 한 쌍으로 올라온다. 질환으로 문제를 세우고
// 원료로 답을 준다. 편성표로는 절대 안 보이는 정보다.
//
// 이 방식의 값: 원료 추출이 추측이 아니라 **인용**이 된다. 제목을 붙인 주체가
// 방송사 자신이므로 출처가 방송사다. 그리고 유튜브 아카이브는 남아 있어 과거 소급이 된다.
//
// 사용: node scripts/clip-archive.mjs [--only=명의보감] [--limit=40]
// 저장: .work/clips/<프로그램>.json   (누적 병합 — 같은 URL 은 갱신하지 않는다)
import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";

const puppeteer = createRequire("D:/블로그자동화/x.js")("puppeteer-core");
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";

// 낮 시간대 건강·정보 프로그램. 2026-09-01 편성표 수집분에서 실제로 확인된 것들.
const PROGRAMS = [
  { name: "명의보감 닥터스", ch: "TV조선" },
  { name: "알아야산다", ch: "채널A" },
  { name: "생존의 비밀", ch: "채널A" },
  { name: "이제 만나러 갑니다", ch: "채널A" },
  { name: "기분 좋은 날", ch: "MBC" },
  { name: "무엇이든 물어보세요", ch: "KBS1" },
  { name: "보석이네 건강 수다", ch: "SBS" },
  { name: "이토록 위대한 몸", ch: "JTBC" },
  { name: "다시 쓰는 건강노트", ch: "JTBC" },
  { name: "친절한 진료실", ch: "JTBC" },
  { name: "지킬박사와 가이드", ch: "JTBC" },
  { name: "건강 1120", ch: "JTBC" },
  { name: "해피라이프", ch: "MBN" },
  { name: "엄지의 제왕", ch: "MBN" },
  { name: "나는 몸신이다", ch: "채널A" },
];

const arg = (k) => (process.argv.find((a) => a.startsWith(`--${k}=`)) || "").split("=")[1] || "";
const only = arg("only");
const LIMIT = Number(arg("limit") || 40);

const OUT = path.join(process.cwd(), ".work", "clips");
fs.mkdirSync(OUT, { recursive: true });

const targets = only ? PROGRAMS.filter((p) => p.name.includes(only)) : PROGRAMS;
console.log(`클립 아카이브 · 프로그램 ${targets.length}개 · 편당 최대 ${LIMIT}건 → ${OUT}\n`);

const browser = await puppeteer.launch({
  executablePath: CHROME, headless: "new",
  args: ["--no-sandbox", "--lang=ko-KR", "--disable-dev-shm-usage"],
});

let total = 0, added = 0;
for (const prog of targets) {
  const file = path.join(OUT, `${prog.name}.json`);
  const prev = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : { program: prog.name, channel: prog.ch, clips: [] };
  const seen = new Set(prev.clips.map((c) => c.url));

  const p = await browser.newPage();
  await p.setViewport({ width: 1400, height: 1400 });
  try {
    await p.goto(`https://www.youtube.com/results?search_query=${encodeURIComponent(prog.name)}&sp=CAI%253D`,
      { waitUntil: "domcontentloaded", timeout: 60000 });
    await new Promise((r) => setTimeout(r, 3500));
    for (let i = 0; i < 4; i++) { await p.evaluate(() => window.scrollBy(0, 2200)); await new Promise((r) => setTimeout(r, 900)); }

    const found = await p.evaluate(() => [...document.querySelectorAll("ytd-video-renderer")].map((v) => {
      const a = v.querySelector("a#video-title");
      const meta = [...v.querySelectorAll("#metadata-line span")].map((s) => s.innerText.trim());
      return {
        title: (a?.getAttribute("title") || a?.innerText || "").trim(),
        url: a?.href || "",
        channel: (v.querySelector("ytd-channel-name a")?.innerText || "").trim(),
        views: meta[0] || "",
        ago: meta[1] || "",
      };
    }).filter((x) => x.title && x.url));

    // 프로그램명이 제목에 들어간 것만. 남의 채널 리액션·요약본을 걸러낸다.
    const mine = found.filter((c) => c.title.includes(prog.name.replace(/\s/g, "")) || c.title.includes(prog.name));
    const fresh = mine.filter((c) => !seen.has(c.url)).slice(0, LIMIT);
    for (const c of fresh) {
      // 제목에 박힌 방송일(YYMMDD)을 뽑아둔다 — 편성표와 붙일 열쇠다
      const m = c.title.match(/\b(2[0-9])(0[1-9]|1[0-2])([0-2][0-9]|3[01])\b/);
      prev.clips.push({ ...c, airdate: m ? `20${m[1]}-${m[2]}-${m[3]}` : null, captured: new Date().toISOString().slice(0, 10) });
    }
    prev.channel = prog.ch;
    prev.updated = new Date().toISOString();
    fs.writeFileSync(file, JSON.stringify(prev, null, 2), "utf8");
    total += mine.length; added += fresh.length;
    console.log(`  ${fresh.length ? "✓" : "·"} ${prog.name.padEnd(16)} 검색 ${found.length} · 자기것 ${mine.length} · 신규 ${fresh.length} · 누적 ${prev.clips.length}`);
  } catch (e) {
    console.log(`  ✗ ${prog.name.padEnd(16)} ${String(e.message).slice(0, 50)}`);
  }
  await p.close();
}
await browser.close();
console.log(`\n완료 · 신규 ${added}건 (검색 ${total}건 중)`);
