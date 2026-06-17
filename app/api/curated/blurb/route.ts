// 추천딜 한줄평 AI 생성 엔드포인트. 키 있으면 Claude, 없으면 템플릿(목).
import { generateBlurb, mockBlurb } from "@/lib/blurb";

interface BlurbResult {
  ok: boolean;
  source: "ai" | "mock";
  blurb: string;
  error?: string;
}

export async function POST(request: Request): Promise<Response> {
  let productName = "";
  let category: string | undefined;
  let price: number | undefined;
  try {
    const b = await request.json();
    productName = String(b?.productName ?? "").trim();
    category = b?.category ? String(b.category) : undefined;
    price = b?.price ? Number(b.price) : undefined;
  } catch {
    return Response.json(
      { ok: false, source: "mock", blurb: "", error: "잘못된 요청" } satisfies BlurbResult,
      { status: 400 }
    );
  }
  if (!productName) {
    return Response.json(
      { ok: false, source: "mock", blurb: "", error: "상품명이 필요해요" } satisfies BlurbResult,
      { status: 400 }
    );
  }

  const ai = await generateBlurb({ productName, category, price });
  if (ai) return Response.json({ ok: true, source: "ai", blurb: ai } satisfies BlurbResult);
  return Response.json({
    ok: true,
    source: "mock",
    blurb: mockBlurb(productName, category),
  } satisfies BlurbResult);
}
