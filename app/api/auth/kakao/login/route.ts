// 카카오 로그인 시작 — 우리 콜백으로 직접 OAuth (Supabase 미경유, scope 직접 통제).
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import crypto from "node:crypto";
import { STATE_COOKIE } from "@/lib/auth/session";

export const runtime = "nodejs";

export async function GET(req: NextRequest): Promise<Response> {
  const clientId = process.env.KAKAO_REST_API_KEY;
  if (!clientId) {
    return NextResponse.json({ error: "KAKAO_REST_API_KEY 미설정" }, { status: 500 });
  }

  const origin = req.nextUrl.origin;
  const redirectUri = `${origin}/api/auth/kakao/callback`;
  const returnTo = req.nextUrl.searchParams.get("returnTo") || "/";
  const state = crypto.randomBytes(12).toString("hex");

  const authUrl = new URL("https://kauth.kakao.com/oauth/authorize");
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("response_type", "code");
  // ★ 우리가 직접 정하는 scope — 이메일 없이 기본 프로필만 → KOE 에러 구조적으로 불가
  authUrl.searchParams.set("scope", "profile_nickname profile_image");
  authUrl.searchParams.set("state", state);

  const res = NextResponse.redirect(authUrl.toString());
  // CSRF state + 로그인 후 돌아갈 경로 (짧은 수명)
  res.cookies.set(STATE_COOKIE, JSON.stringify({ state, returnTo }), {
    httpOnly: true,
    secure: req.nextUrl.protocol === "https:",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });
  return res;
}
