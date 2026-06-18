// 현재 로그인 사용자 (서명 세션 쿠키 검증).
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { COOKIE_NAME, verifySession } from "@/lib/auth/session";

export const runtime = "nodejs";

export async function GET(req: NextRequest): Promise<Response> {
  const user = verifySession(req.cookies.get(COOKIE_NAME)?.value);
  return NextResponse.json({ user });
}
