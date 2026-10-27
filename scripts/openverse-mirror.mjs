// Openverse 썸네일을 우리 저장소(Supabase site-images/stock/)로 옮긴다.
// 이유: api.openverse.org 에서 직접 불러오면 느리고 간헐적으로 실패해 빈 칸(엑박)이 생긴다.
// 라이선스 표기(작가·출처·원본 링크)는 RAIL 의 credit/source/link 그대로 유지된다. 내려받은 바이트는 가공하지 않는다.
// 사용: node scripts/openverse-mirror.mjs   (입력 .tmp/openverse-urls.json, 출력 content/openverse-mirror.json)
//       이미 옮긴 항목은 건너뛴다. 초당 1건, 실패는 3회까지 재시도.
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^[/]([A-Za-z]:)/, "$1")), "..");
const require = createRequire(path.join(ROOT, "package.json"));
const { createClient } = require("@supabase/supabase-js");
const env = Object.fromEntries(fs.readFileSync(path.join(ROOT, ".env.local"), "utf8").split(/\r?\n/).filter((l) => l && !l.startsWith("#") && l.includes("=")).map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, "")]; }));
const base = env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL;
const sb = createClient(base, env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_KEY, { auth: { persistSession: false } });
const BUCKET = "site-images";
const MANIFEST = path.join(ROOT, "content", "openverse-mirror.json");
const readJson = (p, d) => { try { return JSON.parse(fs.readFileSync(p, "utf8")); } catch { return d; } };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const list = readJson(path.join(ROOT, ".tmp", "openverse-urls.json"), []).map(([u]) => u);
const manifest = readJson(MANIFEST, {});
const EXT = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif" };
let ok = 0, skip = 0, fail = 0, idx = 0;
const WORKERS = 10; // 처음 요청받는 썸네일은 Openverse 가 만드느라 30초쯤 걸린다 — 병렬 10개, 요청 사이 1초
const save = () => fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + String.fromCharCode(10));
async function one(url) {
  if (manifest[url]) { skip++; return; }
  const id = (url.match(/[/]images[/]([0-9a-f-]{36})[/]/) || [])[1];
  if (!id) { fail++; console.log("✗ id 없음", url); return; }
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const r = await fetch(url, { headers: { "User-Agent": "todaydeals-mirror/1.0 (hello@todaydeals.co.kr)" }, redirect: "follow", signal: AbortSignal.timeout(90000) });
      const ct = (r.headers.get("content-type") || "").split(";")[0].trim();
      if (!r.ok || !EXT[ct]) throw new Error(`status ${r.status} type ${ct}`);
      const buf = Buffer.from(await r.arrayBuffer());
      if (buf.length < 2000) throw new Error(`너무 작음 ${buf.length}B`);
      const key = `stock/${id}.${EXT[ct]}`;
      const { error } = await sb.storage.from(BUCKET).upload(key, buf, { contentType: ct, cacheControl: "31536000", upsert: true });
      if (error) throw new Error(error.message);
      manifest[url] = `${base}/storage/v1/object/public/${BUCKET}/${key}`;
      ok++;
      if (ok % 10 === 0) save();
      return;
    } catch (e) {
      if (attempt === 3) { fail++; console.log("✗", id, String(e.message).slice(0, 80)); } else await sleep(3000 * attempt);
    }
  }
}
async function worker() { while (idx < list.length) { const url = list[idx++]; await one(url); await sleep(1000); } }
await Promise.all(Array.from({ length: WORKERS }, worker));
fs.writeFileSync(MANIFEST, JSON.stringify(Object.fromEntries(Object.entries(manifest).sort(([a], [b]) => a.localeCompare(b))), null, 2) + "\n");
console.log(`전체 ${list.length} · 옮김 ${ok} · 이미 있음 ${skip} · 실패 ${fail} · 기록 ${Object.keys(manifest).length}건`);
