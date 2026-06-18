// 관리자 로그인 — 아이디/비번 검증 후 세션 쿠키 발급.
// 기본값 admin / admin0808 (Vercel 환경변수 ADMIN_USER/ADMIN_PASS로 덮어쓰기 가능).
import { NextResponse } from "next/server";
import { ADMIN_COOKIE, ADMIN_TOKEN, ADMIN_MAXAGE } from "@/lib/adminAuth";

export const runtime = "nodejs";

interface Body {
  id?: string;
  pw?: string;
}

export async function POST(req: Request): Promise<Response> {
  const ADMIN_ID = process.env.ADMIN_USER || "admin";
  const ADMIN_PW = process.env.ADMIN_PASS || "admin0808";

  let body: Body = {};
  try {
    body = (await req.json()) as Body;
  } catch {
    body = {};
  }

  if (body.id === ADMIN_ID && body.pw === ADMIN_PW) {
    const res = NextResponse.json({ ok: true });
    res.cookies.set(ADMIN_COOKIE, ADMIN_TOKEN, {
      httpOnly: true,
      secure: new URL(req.url).protocol === "https:",
      sameSite: "lax",
      maxAge: ADMIN_MAXAGE,
      path: "/",
    });
    return res;
  }
  return NextResponse.json(
    { ok: false, error: "아이디 또는 비밀번호가 올바르지 않습니다." },
    { status: 401 }
  );
}
