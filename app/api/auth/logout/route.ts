// 로그아웃 — 세션 쿠키 제거.
import { NextResponse } from "next/server";
import { COOKIE_NAME } from "@/lib/auth/session";

export const runtime = "nodejs";

export async function POST(): Promise<Response> {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(COOKIE_NAME);
  return res;
}
