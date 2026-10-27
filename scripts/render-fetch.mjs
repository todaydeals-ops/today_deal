// JS 로 그리는 공식 페이지(국가법령정보센터·홈택스·위택스 등)를 헤드리스 크롬으로 열어 본문 텍스트를 저장한다.
// 리서처(WebFetch)가 못 읽는 페이지의 공식 근거를 직접 확인하기 위한 도구.
// ★법령 조문은 주소 규칙이 있어 바로 열린다: https://www.law.go.kr/법령/<법령명>/제<N>조  (예: .../법령/소득세법/제70조, .../법령/조세특례제한법/제100조의6)
// ★완만하게 쓴다(URL 사이 1.5초). 차단 응답이 오면 그 사이트는 멈춘다.
// 사용: node scripts/render-fetch.mjs <출력폴더> <url> [url...]
//   → <출력폴더>/<순번>.txt (첫 줄 URL, 둘째 줄 최종 URL·제목, 그 아래 본문 텍스트)
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
const puppeteer = createRequire("D:/블로그자동화/x.js")("puppeteer-core");

const [out, ...urls] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });
const b = await puppeteer.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: "new" });
const p = await b.newPage();
await p.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36");
let i = 0;
for (const u of urls) {
  i++;
  try {
    await p.goto(u, { waitUntil: "networkidle2", timeout: 45000 });
    await new Promise((r) => setTimeout(r, 2500));
    // 국가법령정보센터는 본문이 iframe(lawService) 안에 있다 — 프레임 텍스트까지 모은다
    let text = await p.evaluate(() => document.body.innerText);
    for (const f of p.frames()) {
      if (f === p.mainFrame()) continue;
      try { const t = await f.evaluate(() => document.body?.innerText || ""); if (t.length > 200) text += "\n\n[frame " + f.url() + "]\n" + t; } catch {}
    }
    fs.writeFileSync(path.join(out, `${i}.txt`), `${u}\n${p.url()} | ${await p.title()}\n\n${text}`);
    console.log(`${i} ✓ ${text.length}자 ${u}`);
  } catch (e) {
    console.log(`${i} ✗ ${e.message.slice(0, 80)} ${u}`);
  }
  await new Promise((r) => setTimeout(r, 1500));
}
await b.close();
