// 쿠팡 URL(검색/상품) → 제휴 트래킹 링크 변환 엔드포인트.
// "최저가 비교" 버튼이 클릭 시 호출. 키 없거나 실패하면 ok:false → 클라이언트가 원본 검색 URL로 폴백.
import { coupangDeeplink } from "@/lib/coupang";

export async function POST(request: Request): Promise<Response> {
  let url = "";
  try {
    const body = await request.json();
    url = String(body?.url ?? "").trim();
  } catch {
    return Response.json({ ok: false }, { status: 400 });
  }
  if (!url) return Response.json({ ok: false }, { status: 400 });

  const link = await coupangDeeplink(url);
  return Response.json({ ok: !!link, url: link });
}
