// 내 딜 잔액 + 최근 내역(적립/사용). 서명 세션 쿠키 검증.
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { COOKIE_NAME, verifySession } from "@/lib/auth/session";
import { getBalance, getLedger } from "@/lib/deal/server";

export const runtime = "nodejs";

export async function GET(req: NextRequest): Promise<Response> {
  const user = verifySession(req.cookies.get(COOKIE_NAME)?.value);
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });
  const [deal, entries] = await Promise.all([getBalance(user.id), getLedger(user.id, 30)]);
  return NextResponse.json({ ok: true, deal, entries });
}
