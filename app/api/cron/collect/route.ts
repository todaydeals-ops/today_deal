// 타임딜 수집 Cron 엔드포인트.
// - Vercel Cron이 스케줄에 따라 GET 호출 (Authorization: Bearer <CRON_SECRET>)
// - 수동 테스트: /api/cron/collect?key=<CRON_SECRET>  (+ &mock=1 로 파이프라인 시연)
import { runCollectors } from "@/lib/crawler/collect";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function authorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false; // 시크릿 미설정 시 거부
  const auth = request.headers.get("authorization");
  if (auth === `Bearer ${secret}`) return true; // Vercel Cron
  const url = new URL(request.url);
  return url.searchParams.get("key") === secret; // 수동 테스트
}

export async function GET(request: Request): Promise<Response> {
  if (!authorized(request)) {
    return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const mock = new URL(request.url).searchParams.get("mock") === "1";
  try {
    const results = await runCollectors({ mock });
    const total = results.reduce((s, r) => s + r.count, 0);
    return Response.json({ ok: true, mock, total, results });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "collect error";
    return Response.json({ ok: false, error: msg }, { status: 500 });
  }
}
