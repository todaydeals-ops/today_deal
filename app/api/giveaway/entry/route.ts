// 내 응모권 + 응모 가능 여부 조회 (카카오 세션 쿠키로 회원 식별).
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { COOKIE_NAME, verifySession } from "@/lib/auth/session";
import { getEntryState } from "@/lib/giveaway/server";

export const runtime = "nodejs";

export async function GET(req: NextRequest): Promise<Response> {
  const gid = req.nextUrl.searchParams.get("gid");
  if (!gid) return NextResponse.json({ ok: false, error: "gid 누락" }, { status: 400 });

  const u = verifySession(req.cookies.get(COOKIE_NAME)?.value);
  if (!u) {
    return NextResponse.json({
      ok: true,
      loggedIn: false,
      entry: { visit: 0, ad: 0, ref: [], total: 0 },
      eligibility: { ok: false, reason: "not-logged-in", remainingToday: 4 },
    });
  }
  const state = await getEntryState(u.id, gid);
  return NextResponse.json({ ok: true, loggedIn: true, userId: u.id, ...state });
}
