// 현재 로그인 사용자 + 딜 잔액 (서명 세션 쿠키 검증).
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { COOKIE_NAME, verifySession } from "@/lib/auth/session";
import { getBalance } from "@/lib/deal/server";

export const runtime = "nodejs";

export async function GET(req: NextRequest): Promise<Response> {
  const user = verifySession(req.cookies.get(COOKIE_NAME)?.value);
  if (!user) return NextResponse.json({ user: null });
  const deal = await getBalance(user.id);
  return NextResponse.json({ user, deal });
}
