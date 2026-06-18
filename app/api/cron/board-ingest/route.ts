// 핫딜 게시판 자동수집 Cron — 뽐뿌·루리웹 RSS → 리라이트 → 드립 공개 → 활동 시뮬.
// Vercel Cron이 GET 호출(Authorization: Bearer <CRON_SECRET>). 수동: ?key=<CRON_SECRET>
import { runBoardIngest } from "@/lib/board/ingest";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function authorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  if (request.headers.get("authorization") === `Bearer ${secret}`) return true;
  return new URL(request.url).searchParams.get("key") === secret;
}

export async function GET(request: Request): Promise<Response> {
  if (!authorized(request)) {
    return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  try {
    const u = new URL(request.url);
    const rel = u.searchParams.get("release");
    const releaseOverride = rel ? Number(rel) : undefined;
    const reset = u.searchParams.get("reset") === "1";
    const result = await runBoardIngest({
      ...(Number.isFinite(releaseOverride) ? { releaseOverride } : {}),
      reset,
    });
    return Response.json({ ok: true, ...result });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "ingest error";
    return Response.json({ ok: false, error: msg }, { status: 500 });
  }
}
