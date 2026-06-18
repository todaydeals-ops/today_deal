// 응모권 획득 — 방문(visit)/광고(ad)/공유(share). 회원은 카카오 세션 쿠키로 검증.
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { COOKIE_NAME, verifySession } from "@/lib/auth/session";
import { claimVisit, addAdEntry, addShare } from "@/lib/giveaway/server";

export const runtime = "nodejs";

interface Body {
  gid?: string;
  action?: "visit" | "ad" | "share";
  channel?: string;
}

export async function POST(req: NextRequest): Promise<Response> {
  const u = verifySession(req.cookies.get(COOKIE_NAME)?.value);
  if (!u) return NextResponse.json({ ok: false, error: "로그인이 필요합니다." }, { status: 401 });

  let body: Body = {};
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ ok: false, error: "잘못된 요청" }, { status: 400 });
  }
  const { gid, action, channel } = body;
  if (!gid || !action) return NextResponse.json({ ok: false, error: "gid/action 누락" }, { status: 400 });

  if (action === "visit") {
    const r = await claimVisit(u.id, gid);
    return NextResponse.json(r);
  }
  if (action === "ad") {
    const r = await addAdEntry(u.id, gid);
    return NextResponse.json(r);
  }
  if (action === "share") {
    if (!channel) return NextResponse.json({ ok: false, error: "channel 누락" }, { status: 400 });
    const r = await addShare(u.id, gid, channel);
    return NextResponse.json(r);
  }
  return NextResponse.json({ ok: false, error: "알 수 없는 action" }, { status: 400 });
}
