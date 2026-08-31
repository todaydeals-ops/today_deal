// 편성표 아카이버 — 협찬연구소의 원자재를 매일 통째로 보관한다.
//
// ★왜 파서보다 보관이 먼저인가
// 편성표는 지나가면 사라진다. 종편 회차도, 홈쇼핑 상품 편성도 과거 소급이 거의 안 된다.
// 파서는 나중에 고쳐 만들 수 있지만 안 모은 날짜는 영영 복구가 안 된다.
// 그래서 이 스크립트는 파싱하지 않는다. 렌더된 화면 텍스트를 날짜별로 쌓아두기만 한다.
//
// 채널마다 사이트를 뚫지 않는 이유: 방송사·홈쇼핑 편성표가 전부 SPA 라 개별 어댑터가
// 12~15개 필요하고 개편 때마다 깨진다. 네이버가 지상파·종편·홈쇼핑을 채널별로 같은
// 형식으로 주므로 어댑터 하나로 전부 덮는다.
//
// 사용: node scripts/epg-archive.mjs [--date=YYYY-MM-DD] [--only=채널A,GS샵]
// 저장: .work/epg/<수집일>/<채널>.txt
import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";

const require_ = createRequire("D:/블로그자동화/x.js");
const puppeteer = require_("puppeteer-core");
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";

const CHANNELS = [
  // 지상파 — 낮 시간대 주부 대상 정보 프로그램이 협찬 구조의 핵심이다
  "KBS1", "KBS2", "MBC", "SBS", "EBS1",
  // 종편 — 연계편성 실태조사 대상
  "채널A", "MBN", "TV조선", "JTBC",
  // 홈쇼핑 — 대조군
  "GS샵", "CJ온스타일", "현대홈쇼핑", "롯데홈쇼핑", "NS홈쇼핑", "홈앤쇼핑", "공영쇼핑",
];

const arg = (k) => (process.argv.find((a) => a.startsWith(`--${k}=`)) || "").split("=")[1] || "";
const only = arg("only") ? arg("only").split(",").map((s) => s.trim()).filter(Boolean) : null;
const kstDate = () => new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10);
const day = arg("date") || kstDate();

const OUT = path.join(process.cwd(), ".work", "epg", day);
fs.mkdirSync(OUT, { recursive: true });

const targets = only ? CHANNELS.filter((c) => only.includes(c)) : CHANNELS;
console.log(`편성표 아카이브 ${day} · 채널 ${targets.length}개 → ${OUT}`);

const browser = await puppeteer.launch({
  executablePath: CHROME, headless: "new",
  args: ["--no-sandbox", "--lang=ko-KR", "--disable-dev-shm-usage"],
});

let ok = 0, thin = 0, fail = 0;
for (const ch of targets) {
  const file = path.join(OUT, `${ch}.txt`);
  if (fs.existsSync(file) && fs.statSync(file).size > 800) { console.log(`  건너뜀 ${ch} (이미 있음)`); ok++; continue; }
  const p = await browser.newPage();
  await p.setViewport({ width: 1300, height: 1600 });
  try {
    await p.goto(`https://search.naver.com/search.naver?query=${encodeURIComponent(ch + " 편성표")}`,
      { waitUntil: "networkidle2", timeout: 60000 });
    await new Promise((r) => setTimeout(r, 3500));
    // 편성 블록만 고른다. 못 찾으면 본문 전체를 저장한다 — 파싱은 나중 일이라 원본이 남는 게 중요하다.
    const text = await p.evaluate(() => {
      // ★"편성"이라는 단어로 고르면 안 된다. 검색 결과에는 편성표를 소개하는
      //   블로그 글이 같이 뜨고, 그쪽이 더 작아서 먼저 잡힌다(실제로 한 번 겪었다).
      //   편성표의 진짜 신호는 시각이 반복된다는 것이다 — "0시 00분 프로그램(회차)".
      const timeish = (t) => (t.match(/\d{1,2}시/g) || []).length;
      const all = [...document.querySelectorAll("section, div")]
        .map((x) => ({ t: (x.innerText || "").trim() }))
        .filter((o) => timeish(o.t) >= 8 && /분/.test(o.t) && o.t.length <= 80000)
        .sort((a, b) => a.t.length - b.t.length);
      return all.length ? all[0].t : "";
    });
    fs.writeFileSync(file, `# ${ch}\n# 수집: ${new Date().toISOString()}\n# 출처: 네이버 검색 "${ch} 편성표"\n\n${text}\n`, "utf8");
    if (text.length < 800) { console.log(`  ▲ ${ch.padEnd(8)} ${text.length}자 — 편성 블록 못 찾음(시각 패턴 없음)`); thin++; }
    else { console.log(`  ✓ ${ch.padEnd(8)} ${text.length}자`); ok++; }
  } catch (e) {
    console.log(`  ✗ ${ch.padEnd(8)} ${String(e.message).slice(0, 60)}`);
    fail++;
  }
  await p.close();
}
await browser.close();
console.log(`\n완료 · 정상 ${ok} · 빈약 ${thin} · 실패 ${fail}`);
if (thin || fail) console.log("빈약·실패 채널은 네이버가 편성표를 안 주는 경우다. 해당 채널만 개별 어댑터가 필요하다.");
