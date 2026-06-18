// 커스텀 OAuth 세션 — HMAC 서명 쿠키 (Supabase 미경유). Node 런타임 전용.
import crypto from "node:crypto";

export const COOKIE_NAME = "td_auth";
export const COOKIE_MAXAGE = 60 * 60 * 24 * 30; // 30일
export const STATE_COOKIE = "td_oauth_state";

export interface AuthUser {
  id: string; // "kakao:12345"
  nickname: string;
  provider: "kakao" | "naver";
  profileImage?: string;
  iat?: number;
}

function secret(): string | null {
  return process.env.AUTH_SECRET || null;
}

// payload(base64url).hmac(base64url)
export function signSession(user: AuthUser): string | null {
  const s = secret();
  if (!s) return null;
  const payload = Buffer.from(JSON.stringify({ ...user, iat: Date.now() })).toString("base64url");
  const mac = crypto.createHmac("sha256", s).update(payload).digest("base64url");
  return `${payload}.${mac}`;
}

export function verifySession(token: string | undefined | null): AuthUser | null {
  const s = secret();
  if (!s || !token) return null;
  const dot = token.indexOf(".");
  if (dot < 0) return null;
  const payload = token.slice(0, dot);
  const mac = token.slice(dot + 1);
  const expect = crypto.createHmac("sha256", s).update(payload).digest("base64url");
  const a = Buffer.from(mac);
  const b = Buffer.from(expect);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    return JSON.parse(Buffer.from(payload, "base64url").toString()) as AuthUser;
  } catch {
    return null;
  }
}
