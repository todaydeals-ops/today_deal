// 쿠팡 파트너스 Open API (서버 전용). HMAC 서명 + 상품 검색.
// 키(COUPANG_ACCESS_KEY/COUPANG_SECRET_KEY) 없으면 null 반환 → 호출부가 목으로 폴백.
import crypto from "crypto";

const DOMAIN = "https://api-gateway.coupang.com";
const SEARCH_PATH =
  "/v2/providers/affiliate_open_api/apis/openapi/v1/products/search";

export interface CoupangProduct {
  productId: string;
  title: string;
  imageUrl?: string;
  price: number;
  productUrl: string; // 제휴(트래킹) 링크
}

// datetime: yyMMdd'T'HHmmss'Z' (GMT)
function gmtDatetime(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return (
    `${p(d.getUTCFullYear() % 100)}${p(d.getUTCMonth() + 1)}${p(d.getUTCDate())}` +
    `T${p(d.getUTCHours())}${p(d.getUTCMinutes())}${p(d.getUTCSeconds())}Z`
  );
}

// 쿠팡 CEA HMAC 인증 헤더 생성. message = datetime + method + path + query (query는 '?' 제외)
function authorizationHeader(
  method: string,
  path: string,
  query: string,
  accessKey: string,
  secretKey: string
): string {
  const datetime = gmtDatetime();
  const message = datetime + method + path + query;
  const signature = crypto
    .createHmac("sha256", secretKey)
    .update(message)
    .digest("hex");
  return `CEA algorithm=HmacSHA256, access-key=${accessKey}, signed-date=${datetime}, signature=${signature}`;
}

// 실제 파트너스 API 검색. 키 없거나 실패 시 null.
export async function searchCoupang(
  keyword: string,
  limit = 10
): Promise<CoupangProduct[] | null> {
  const accessKey = process.env.COUPANG_ACCESS_KEY;
  const secretKey = process.env.COUPANG_SECRET_KEY;
  if (!accessKey || !secretKey) return null;

  // 서명 query와 요청 query는 반드시 동일 문자열이어야 함
  const query = `keyword=${encodeURIComponent(keyword)}&limit=${limit}`;
  const authorization = authorizationHeader("GET", SEARCH_PATH, query, accessKey, secretKey);

  try {
    const res = await fetch(`${DOMAIN}${SEARCH_PATH}?${query}`, {
      method: "GET",
      headers: { Authorization: authorization, "Content-Type": "application/json" },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const json = await res.json();
    const items: unknown[] = json?.data?.productData ?? [];
    return items.map((it) => {
      const p = it as Record<string, unknown>;
      return {
        productId: String(p.productId ?? ""),
        title: String(p.productName ?? ""),
        imageUrl: (p.productImage as string) || undefined,
        price: Number(p.productPrice ?? 0),
        productUrl: String(p.productUrl ?? ""),
      } satisfies CoupangProduct;
    });
  } catch {
    return null;
  }
}

// 키 없을 때 데모용 목 검색 결과
export function mockCoupangSearch(keyword: string): CoupangProduct[] {
  const base = [12900, 23900, 8900, 45900];
  return base.map((price, i) => ({
    productId: `mock-${i}`,
    title: `${keyword} 추천 상품 ${i + 1} (목 데이터)`,
    imageUrl: undefined,
    price,
    productUrl: `https://link.coupang.com/a/mock_${encodeURIComponent(keyword)}_${i}`,
  }));
}
