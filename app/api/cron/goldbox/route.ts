// 쿠팡 골드박스 자동수집 (매일 오전 7시 갱신). 공식 API라 서버에서 바로.
// Vercel Cron이 Authorization: Bearer <CRON_SECRET>로 호출 / 수동: ?key=<CRON_SECRET>
import { coupangGoldbox } from "@/lib/coupang";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

function authorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  if (request.headers.get("authorization") === `Bearer ${secret}`) return true;
  return new URL(request.url).searchParams.get("key") === secret;
}

// 다음 07:00 KST(ISO/UTC)
function nextGoldboxEnd(): string {
  const now = Date.now();
  const kst = new Date(now + 9 * 3600 * 1000);
  let end = Date.UTC(kst.getUTCFullYear(), kst.getUTCMonth(), kst.getUTCDate(), 7, 0, 0) - 9 * 3600 * 1000;
  if (end <= now) end += 24 * 3600 * 1000;
  return new Date(end).toISOString();
}

export async function GET(request: Request): Promise<Response> {
  if (!authorized(request)) {
    return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const items = await coupangGoldbox();
  if (!items) {
    return Response.json({ ok: false, error: "쿠팡 키 미설정 또는 호출 실패" }, { status: 500 });
  }

  const dealEndAt = nextGoldboxEnd();
  const deals = items
    .filter((i) => i.productName && i.price > 0 && i.productUrl)
    .map((i) => ({
      platform: "coupang",
      badge: "coupang_goldbox",
      productName: i.productName,
      imageUrl: i.imageUrl,
      productUrl: i.productUrl,
      affiliateUrl: i.productUrl, // 이미 제휴링크
      salePrice: i.price,
      dealEndAt,
    }));

  // ingest로 전송 (badge 단위 교체·저장)
  const res = await fetch(new URL("/api/deals/ingest", request.url), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ secret: process.env.CRON_SECRET, deals, replace: true }),
  });
  const data = await res.json().catch(() => ({}));
  return Response.json({
    ok: !!data.ok,
    source: "coupang_goldbox",
    fetched: items.length,
    registered: data.registered ?? 0,
    error: data.error,
  });
}
