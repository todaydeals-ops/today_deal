// 무료·저가 AI 라우터 — 무료 한도를 먼저 소진하고, 막히면 다음 소스로 넘어간다.
// 실측(2026-07-20): Groq ✓ / Gemini 429(쿼터소진) / OpenRouter free 404(유료전환)
// 순서: Groq(무료) → Gemini(무료, 회복 시) → Haiku(저가 폴백) → null
//
// 사용:
//   import { ask, naverSearch, fetchText } from "./ai-fleet.mjs";
//   const out = await ask({ prompt: "...", system: "...", maxTokens: 2000, json: true });
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const ENV = (() => {
  const e = {};
  try {
    const t = fs.readFileSync(path.join(ROOT, ".env.local"), "utf8");
    for (const l of t.split(/\r?\n/)) { const m = l.match(/^([A-Z0-9_]+)=(.*)$/); if (m) e[m[1]] = m[2].trim(); }
  } catch {}
  return e;
})();

const T = (ms) => AbortSignal.timeout(ms);
const stats = { groq: 0, gemini: 0, haiku: 0, fail: 0 };
export const fleetStats = () => ({ ...stats });

// ── 소스별 호출 ───────────────────────────────────────────
async function callGroq({ system, prompt, maxTokens, json }) {
  if (!ENV.GROQ_API_KEY) return null;
  const body = {
    model: "llama-3.3-70b-versatile",
    messages: [...(system ? [{ role: "system", content: system }] : []), { role: "user", content: prompt }],
    max_tokens: maxTokens ?? 2000,
    temperature: 0.2,
    ...(json ? { response_format: { type: "json_object" } } : {}),
  };
  const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${ENV.GROQ_API_KEY}` },
    body: JSON.stringify(body), signal: T(60000),
  });
  if (!r.ok) return null;
  const j = await r.json();
  return j?.choices?.[0]?.message?.content ?? null;
}

async function callGemini({ system, prompt, maxTokens, json }) {
  if (!ENV.GEMINI_API_KEY) return null;
  for (const m of ["gemini-2.0-flash", "gemini-flash-latest"]) {
    try {
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${ENV.GEMINI_API_KEY}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: (system ? system + "\n\n" : "") + prompt }] }],
          generationConfig: { maxOutputTokens: maxTokens ?? 2000, temperature: 0.2, ...(json ? { responseMimeType: "application/json" } : {}) },
        }),
        signal: T(60000),
      });
      if (!r.ok) continue;             // 429(쿼터) 포함 → 다음 모델/소스로
      const j = await r.json();
      const t = j?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (t) return t;
    } catch { /* 다음 후보 */ }
  }
  return null;
}

async function callHaiku({ system, prompt, maxTokens }) {
  if (!ENV.ANTHROPIC_API_KEY) return null;
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": ENV.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({
      model: "claude-haiku-4-5", max_tokens: maxTokens ?? 2000,
      ...(system ? { system } : {}), messages: [{ role: "user", content: prompt }],
    }),
    signal: T(60000),
  });
  if (!r.ok) return null;
  const j = await r.json();
  return j?.content?.find((c) => c.type === "text")?.text ?? null;
}

/** 무료 우선 라우팅. 실패하면 다음 소스로 폴백하고, 전부 실패하면 null. */
export async function ask({ system, prompt, maxTokens, json = false, allowPaid = true }) {
  const chain = [["groq", callGroq], ["gemini", callGemini], ...(allowPaid ? [["haiku", callHaiku]] : [])];
  for (const [name, fn] of chain) {
    try {
      const out = await fn({ system, prompt, maxTokens, json });
      if (out && out.trim()) { stats[name]++; return { text: out.trim(), source: name }; }
    } catch { /* 다음 소스 */ }
  }
  stats.fail++;
  return null;
}

/** JSON 응답 전용 — 코드펜스·잡텍스트를 걷어내고 파싱한다. */
export async function askJSON(args) {
  const res = await ask({ ...args, json: true });
  if (!res) return null;
  let t = res.text.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "").trim();
  const s = t.indexOf("{"), e = t.lastIndexOf("}");
  if (s > 0 || e < t.length - 1) t = t.slice(s === -1 ? 0 : s, e === -1 ? undefined : e + 1);
  try { return { data: JSON.parse(t), source: res.source }; } catch { return null; }
}

// ── 무료 검색 ─────────────────────────────────────────────
/** 네이버 검색 API(무료). type: webkr | blog | news */
export async function naverSearch(query, { type = "webkr", display = 10 } = {}) {
  if (!ENV.NAVER_CLIENT_ID || !ENV.NAVER_CLIENT_SECRET) return [];
  try {
    const r = await fetch(`https://openapi.naver.com/v1/search/${type}.json?query=${encodeURIComponent(query)}&display=${display}`, {
      headers: { "X-Naver-Client-Id": ENV.NAVER_CLIENT_ID, "X-Naver-Client-Secret": ENV.NAVER_CLIENT_SECRET },
      signal: T(15000),
    });
    if (!r.ok) return [];
    const j = await r.json();
    const strip = (s) => String(s || "").replace(/<[^>]+>/g, "").replace(/&[a-z]+;/g, " ").trim();
    return (j.items || []).map((i) => ({ title: strip(i.title), url: i.link, desc: strip(i.description) }));
  } catch { return []; }
}

/** URL 본문을 텍스트로. 실패하면 null(=링크 부패). */
export async function fetchText(url, { maxChars = 6000 } = {}) {
  try {
    const r = await fetch(url, { redirect: "follow", headers: { "User-Agent": "Mozilla/5.0 (compatible; todaydeals-research/1.0)" }, signal: T(20000) });
    if (!r.ok) return null;
    const html = await r.text();
    const txt = html
      .replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&[a-z]+;/g, " ")
      .replace(/\s+/g, " ").trim();
    return txt.slice(0, maxChars) || null;
  } catch { return null; }
}

/** 공식 문서로 볼 도메인인지 */
export const OFFICIAL_HOSTS = [
  "samsungsvc.co.kr", "samsung.com", "lge.co.kr", "lg.com", "apple.com", "support.apple.com",
  "cuckoo.co.kr", "cuchen.com", "coway.com", "winix.com", "kyungdong.co.kr",
  "support.microsoft.com", "support.google.com", "asus.com", "hp.com", "dell.com",
  "hyundai.com", "kia.com", "ownersmanual.hyundai.com", "ownersmanual.kia.com",
  "kca.go.kr", "ciss.go.kr", "data.go.kr", "korea.kr",
];
export const isOfficial = (url) => OFFICIAL_HOSTS.some((h) => { try { return new URL(url).hostname.endsWith(h); } catch { return false; } });
