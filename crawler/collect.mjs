// 오늘의딜 — 정적 URL 수집기 (헤드리스 불필요, Node 18+ 내장 fetch만 사용)
//
// 역할: 후보 상품 URL을 모아 → /api/deals/ingest 로 POST.
// 실행:  node crawler/collect.mjs
//
// URL 공급 (둘 다 쓰면 합쳐짐):
//   (A) crawler/urls.txt — 한 줄에 URL 하나. 가장 안정적.
//   (B) LISTING 배열      — 딜 목록 페이지를 fetch해 상품 링크 정규식 추출(정적 HTML 한정).
//       ⚠️ 목록이 JS 렌더면 안 잡힘 → collect-headless.mjs(Playwright) 사용.

import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { UA, sendToIngest } from "./_ingest.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));

function fromFile() {
  const p = join(__dirname, "urls.txt");
  if (!existsSync(p)) return [];
  return readFileSync(p, "utf8")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#"));
}

// 정적 HTML에서 링크 추출 (JS 렌더 페이지엔 무력 — 그땐 collect-headless.mjs)
const LISTING = [
  // { url: "...", pick: /https?:\/\/item\.gmarket\.co\.kr\/Item\?[^"'\s<>]*goodscode=\d+/gi },
];

async function fromListings() {
  const urls = [];
  for (const { url, pick } of LISTING) {
    try {
      const res = await fetch(url, { headers: { "User-Agent": UA, "Accept-Language": "ko-KR,ko;q=0.9" } });
      if (!res.ok) {
        console.warn(`[listing] ${url} → HTTP ${res.status} (스킵)`);
        continue;
      }
      const html = await res.text();
      const found = [...new Set(html.match(pick) ?? [])];
      console.log(`[listing] ${url} → 링크 ${found.length}개`);
      urls.push(...found);
    } catch (e) {
      console.warn(`[listing] ${url} 실패: ${e.message}`);
    }
  }
  return urls;
}

await sendToIngest([...fromFile(), ...(await fromListings())]);
