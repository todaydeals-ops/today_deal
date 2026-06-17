// 추천딜 한줄평 AI 자동생성 (Claude Haiku — 짧은 카피라 가장 싸고 빠른 모델).
// 키(ANTHROPIC_API_KEY) 없으면 null 반환 → 호출부가 템플릿(목)/수동 폴백.
const MODEL = "claude-haiku-4-5";
const ENDPOINT = "https://api.anthropic.com/v1/messages";

const SYSTEM = `너는 한국 커머스 큐레이션 사이트 "오늘의딜"의 카피라이터다.
상품명을 보고, 사람들이 "갖고 싶다"는 마음이 들게 하는 짧은 한줄평을 쓴다.
규칙:
- 30자 이내, 한 문장, 마침표로 끝낼 것.
- 친근한 구어체. 위트 있게. (예: "가성비 깡패", "이 가격에 이 퀄?", "자취방 필수템")
- 상품명·브랜드명을 그대로 베끼지 말고 핵심 가치(가성비·편의·공간·품질 등)를 짚을 것.
- 허위·과장 효능, 의료적 단정, 최저가 단정은 절대 금지.
- 한줄평 텍스트만 출력. 따옴표·설명·접두사 없이.`;

export async function generateBlurb(input: {
  productName: string;
  category?: string;
  price?: number;
}): Promise<string | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || !input.productName) return null;

  const userMsg =
    `상품명: ${input.productName}` +
    (input.category ? `\n카테고리: ${input.category}` : "") +
    (input.price ? `\n판매가: ${input.price.toLocaleString("ko-KR")}원` : "");

  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 100,
        system: SYSTEM,
        messages: [{ role: "user", content: userMsg }],
      }),
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return null;
    const json = await res.json();
    const blocks: unknown[] = Array.isArray(json?.content) ? json.content : [];
    const textBlock = blocks.find(
      (b) => (b as { type?: string })?.type === "text"
    ) as { text?: string } | undefined;
    const text = (textBlock?.text ?? "")
      .trim()
      .replace(/^["'“”]+|["'“”]+$/g, "")
      .trim();
    return text || null;
  } catch {
    return null;
  }
}

// 키 없을 때 템플릿 한줄평(간단 폴백). 관리자가 그대로 쓰거나 수정.
export function mockBlurb(productName: string, category?: string): string {
  const k = category ?? "꿀템";
  return `지금 안 사면 아쉬운 ${k}. 가성비 챙기는 타이밍.`;
}
