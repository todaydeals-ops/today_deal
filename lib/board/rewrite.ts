// 핫딜 글 리라이트 — Haiku로 제목·본문을 페르소나 말투로 재작성.
// 사실(상품명·가격·쇼핑몰)은 보존, 표현만 변경. 출처 미표시.
// ANTHROPIC_API_KEY 없으면 원문 정리본으로 폴백(동작은 유지).
import type { Persona } from "./personas";

const MODEL = "claude-haiku-4-5";
const ENDPOINT = "https://api.anthropic.com/v1/messages";

export interface RewriteIn {
  title: string;
  body?: string;
  shop?: string;
  price?: number;
}
export interface RewriteOut {
  title: string;
  body: string;
}

function fallback(input: RewriteIn): RewriteOut {
  const body = (input.body ?? "").replace(/\s+/g, " ").trim().slice(0, 180);
  return { title: input.title.slice(0, 60), body };
}

function buildPrompt(input: RewriteIn, p: Persona): string {
  return [
    `너는 핫딜 커뮤니티의 활동 멤버 "${p.nick}"이다. 말투/성향: ${p.tone}.`,
    `아래 딜 정보를 네 말투로 자연스럽게 다시 써라.`,
    ``,
    `[원문 제목] ${input.title}`,
    input.shop ? `[쇼핑몰] ${input.shop}` : ``,
    typeof input.price === "number" ? `[가격] ${input.price}원` : ``,
    input.body ? `[원문 설명] ${input.body.slice(0, 300)}` : ``,
    ``,
    `규칙(중요):`,
    `- 상품명·숫자(가격·용량·수량)·쇼핑몰명은 절대 바꾸지 마라(사실 왜곡 금지).`,
    `- 표현·어투만 바꿔 사람이 쓴 듯 자연스럽게.`,
    `- 제목은 40자 이내, 핵심(상품+혜택) 포함.`,
    `- 본문(summary)은 1~2문장, 80자 이내, 과장/허위 금지.`,
    `- 출처 사이트명은 언급하지 마라.`,
    `- 반드시 JSON만 출력: {"title":"...","summary":"..."}`,
  ]
    .filter(Boolean)
    .join("\n");
}

export async function rewriteDeal(input: RewriteIn, persona: Persona): Promise<RewriteOut> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return fallback(input);
  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 300,
        messages: [{ role: "user", content: buildPrompt(input, persona) }],
      }),
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) return fallback(input);
    const j = await res.json();
    const text: string = j?.content?.[0]?.text ?? "";
    const m = text.match(/\{[\s\S]*\}/);
    if (!m) return fallback(input);
    const parsed = JSON.parse(m[0]) as { title?: string; summary?: string };
    const title = (parsed.title || "").trim().slice(0, 60) || input.title.slice(0, 60);
    const body = (parsed.summary || "").trim().slice(0, 180);
    return { title, body };
  } catch {
    return fallback(input);
  }
}
