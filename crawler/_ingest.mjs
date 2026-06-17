// 공용: 설정 로드 + ingest 전송. (collect.mjs / collect-headless.mjs 공유)
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

export const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

function loadEnv() {
  const env = { ...process.env };
  const p = join(__dirname, ".env");
  if (existsSync(p)) {
    for (const line of readFileSync(p, "utf8").split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "").trim();
    }
  }
  return env;
}

const env = loadEnv();
export const INGEST_URL = env.INGEST_URL || "https://todaydeals.co.kr/api/deals/ingest";
export const SECRET = env.INGEST_SECRET || env.CRON_SECRET || "";

export async function sendToIngest(urls, opts = {}) {
  const unique = [...new Set(urls)].filter(Boolean);
  if (!SECRET) {
    console.error("INGEST_SECRET(=서버 CRON_SECRET) 미설정. crawler/.env 에 넣으세요 (.env.example 참고).");
    process.exit(1);
  }
  if (unique.length === 0) {
    console.log("보낼 URL이 없습니다.");
    return;
  }
  console.log(`→ ${unique.length}개 URL 전송: ${INGEST_URL}`);
  const res = await fetch(INGEST_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${SECRET}` },
    body: JSON.stringify({ urls: unique, ...opts }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.ok) {
    console.error("✗ ingest 실패:", res.status, data.error ?? data);
    process.exit(1);
  }
  console.log(`✓ 등록 ${data.registered}건`, data.byPlatform ?? {});
  if (data.skipped?.length) {
    console.log(`  건너뜀 ${data.skipped.length}건:`);
    for (const s of data.skipped) console.log(`   - [${s.reason}] ${s.url}`);
  }
  return data;
}
