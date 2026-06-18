// 카카오 콜백 — code 교환 → 사용자 조회 → 서명 세션 쿠키 발급 → 원래 페이지로.
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { COOKIE_NAME, COOKIE_MAXAGE, STATE_COOKIE, canonicalOrigin, signSession, type AuthUser } from "@/lib/auth/session";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export const runtime = "nodejs";

function backTo(origin: string, path: string, err?: string): Response {
  const url = new URL(path.startsWith("/") ? path : "/", origin);
  if (err) url.searchParams.set("login_error", err);
  const res = NextResponse.redirect(url.toString());
  res.cookies.delete(STATE_COOKIE);
  return res;
}

export async function GET(req: NextRequest): Promise<Response> {
  const origin = canonicalOrigin(req.nextUrl.origin);
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");

  let stored: { state?: string; returnTo?: string } = {};
  try {
    stored = JSON.parse(req.cookies.get(STATE_COOKIE)?.value || "{}");
  } catch {
    stored = {};
  }
  const returnTo = stored.returnTo || "/";

  if (!code || !state || state !== stored.state) {
    return backTo(origin, returnTo, "state");
  }

  const clientId = process.env.KAKAO_REST_API_KEY;
  const clientSecret = process.env.KAKAO_CLIENT_SECRET;
  if (!clientId) return backTo(origin, returnTo, "config");

  const redirectUri = `${origin}/api/auth/kakao/callback`;

  // 1) code → access_token
  let accessToken = "";
  try {
    const body = new URLSearchParams({
      grant_type: "authorization_code",
      client_id: clientId,
      redirect_uri: redirectUri,
      code,
    });
    if (clientSecret) body.set("client_secret", clientSecret);
    const tk = await fetch("https://kauth.kakao.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded;charset=utf-8" },
      body,
      signal: AbortSignal.timeout(10000),
    });
    const tj = await tk.json();
    accessToken = tj.access_token || "";
    if (!accessToken) return backTo(origin, returnTo, "token");
  } catch {
    return backTo(origin, returnTo, "token");
  }

  // 2) access_token → 사용자 정보 (닉네임·프로필사진)
  let user: AuthUser;
  try {
    const me = await fetch("https://kapi.kakao.com/v2/user/me", {
      headers: { Authorization: `Bearer ${accessToken}` },
      signal: AbortSignal.timeout(10000),
    });
    const mj = await me.json();
    const props = mj.properties || {};
    const acc = mj.kakao_account?.profile || {};
    user = {
      id: `kakao:${mj.id}`,
      nickname: props.nickname || acc.nickname || "카카오 회원",
      provider: "kakao",
      profileImage: props.profile_image || acc.profile_image_url || undefined,
    };
  } catch {
    return backTo(origin, returnTo, "userinfo");
  }

  // 3) 서명 세션 쿠키 발급
  const token = signSession(user);
  if (!token) return backTo(origin, returnTo, "secret"); // AUTH_SECRET 미설정

  // 회원 DB 저장(로그인 = 마케팅 동의 완료 상태). 실패해도 로그인은 진행. (members 테이블 없으면 패스)
  try {
    const sb = getSupabaseAdmin();
    if (sb) {
      await sb.from("members").upsert(
        {
          id: user.id,
          nickname: user.nickname,
          provider: user.provider,
          profile_image: user.profileImage ?? null,
          marketing_consent: true,
          last_login_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      );
    }
  } catch {
    // 무시
  }

  const url = new URL(returnTo.startsWith("/") ? returnTo : "/", origin);
  const res = NextResponse.redirect(url.toString());
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: req.nextUrl.protocol === "https:",
    sameSite: "lax",
    maxAge: COOKIE_MAXAGE,
    path: "/",
  });
  res.cookies.delete(STATE_COOKIE);
  return res;
}
