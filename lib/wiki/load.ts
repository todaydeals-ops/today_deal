// 생활백과 항목 로더 — content/wiki/*.json 을 빌드 때 읽는다(서버 전용).
// 페이지는 전부 generateStaticParams 로 굽기 때문에 런타임에 파일을 읽지 않는다.
import fs from "node:fs";
import path from "node:path";
import type { WikiEntry, WikiType } from "./types";

const DIR = path.join(process.cwd(), "content", "wiki");

let cache: WikiEntry[] | null = null;

export function allEntries(): WikiEntry[] {
  if (cache) return cache;
  if (!fs.existsSync(DIR)) return (cache = []);
  cache = fs
    .readdirSync(DIR)
    .filter((f) => f.endsWith(".json") && !f.startsWith("_"))
    .map((f) => JSON.parse(fs.readFileSync(path.join(DIR, f), "utf8")) as WikiEntry)
    .sort((a, b) => (a.updated < b.updated ? 1 : -1));
  return cache;
}

export function entryBySlug(slug: string): WikiEntry | undefined {
  return allEntries().find((e) => e.slug === slug);
}

export function entriesByType(type: WikiType): WikiEntry[] {
  return allEntries().filter((e) => e.type === type);
}

/** 인물 색인 — 이름 → 그 인물이 등장하는 항목들 */
export function peopleIndex(): { name: string; entries: WikiEntry[] }[] {
  const m = new Map<string, WikiEntry[]>();
  for (const e of allEntries()) for (const p of e.people ?? []) m.set(p, [...(m.get(p) ?? []), e]);
  return [...m.entries()].map(([name, entries]) => ({ name, entries })).sort((a, b) => a.name.localeCompare(b.name, "ko"));
}

// 가나다 색인 — 표제어 첫 글자의 초성으로 묶는다. 영문·숫자는 "A-Z·0-9" 한 칸.
const CHO = ["ㄱ", "ㄲ", "ㄴ", "ㄷ", "ㄸ", "ㄹ", "ㅁ", "ㅂ", "ㅃ", "ㅅ", "ㅆ", "ㅇ", "ㅈ", "ㅉ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ"];
const MERGE: Record<string, string> = { ㄲ: "ㄱ", ㄸ: "ㄷ", ㅃ: "ㅂ", ㅆ: "ㅅ", ㅉ: "ㅈ" };

export function initialOf(title: string): string {
  const c = title.trim().charCodeAt(0);
  if (c >= 0xac00 && c <= 0xd7a3) {
    const cho = CHO[Math.floor((c - 0xac00) / 588)];
    return MERGE[cho] ?? cho;
  }
  return "A-Z·0-9";
}

export function ganadaIndex(): { key: string; entries: WikiEntry[] }[] {
  const order = ["ㄱ", "ㄴ", "ㄷ", "ㄹ", "ㅁ", "ㅂ", "ㅅ", "ㅇ", "ㅈ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ", "A-Z·0-9"];
  const m = new Map<string, WikiEntry[]>();
  for (const e of allEntries()) {
    const k = initialOf(e.title);
    m.set(k, [...(m.get(k) ?? []), e]);
  }
  return order
    .filter((k) => m.has(k))
    .map((k) => ({ key: k, entries: m.get(k)!.sort((a, b) => a.title.localeCompare(b.title, "ko")) }));
}

export const WIKI_BASE = "https://www.todaydeals.co.kr/wiki";
export const wikiUrl = (slug: string) => `${WIKI_BASE}/${slug}`;
