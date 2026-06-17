// 쿠팡 파트너스 상품 검색 엔드포인트.
// 키 있으면 실제 파트너스 API, 없거나 실패하면 목 결과로 폴백.
import { searchCoupang, mockCoupangSearch, type CoupangProduct } from "@/lib/coupang";

interface SearchResult {
  ok: boolean;
  source: "coupang" | "mock";
  products: CoupangProduct[];
  error?: string;
}

export async function POST(request: Request): Promise<Response> {
  let keyword = "";
  try {
    const body = await request.json();
    keyword = String(body?.keyword ?? "").trim();
  } catch {
    return Response.json(
      { ok: false, source: "mock", products: [], error: "잘못된 요청" } satisfies SearchResult,
      { status: 400 }
    );
  }

  if (!keyword) {
    return Response.json(
      { ok: false, source: "mock", products: [], error: "검색어를 입력하세요" } satisfies SearchResult,
      { status: 400 }
    );
  }

  const real = await searchCoupang(keyword, 10);
  if (real && real.length > 0) {
    return Response.json({ ok: true, source: "coupang", products: real } satisfies SearchResult);
  }

  // 키 미설정/결과없음/오류 → 목
  return Response.json({
    ok: true,
    source: "mock",
    products: mockCoupangSearch(keyword),
  } satisfies SearchResult);
}
