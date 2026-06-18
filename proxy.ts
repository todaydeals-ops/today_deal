// 관리자(/admin/*) + 쓰기 API 보호 — 쿠키 기반 간단 로그인. (Next 16 proxy 컨벤션)
// 로그인 안 됐으면: 페이지는 /admin/login으로, API는 401.
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ADMIN_COOKIE, ADMIN_TOKEN } from "@/lib/adminAuth";

export function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;
  // 로그인 화면 자체는 통과
  if (path === "/admin/login") return NextResponse.next();

  const authed = req.cookies.get(ADMIN_COOKIE)?.value === ADMIN_TOKEN;
  if (authed) return NextResponse.next();

  // API는 401, 페이지는 로그인 화면으로 리다이렉트
  if (path.startsWith("/api/")) {
    return NextResponse.json({ ok: false, error: "관리자 인증이 필요합니다." }, { status: 401 });
  }
  const url = req.nextUrl.clone();
  url.pathname = "/admin/login";
  url.searchParams.set("next", path);
  return NextResponse.redirect(url);
}

// /admin 페이지 + 브라우저용 쓰기 API 보호.
// /api/deals/ingest·/api/cron/*·/api/auth/* 는 제외(각자 시크릿/공개 로그인).
// /api/admin/login 은 matcher에 없어 통과(로그인 발급용).
export const config = {
  matcher: ["/admin/:path*", "/api/deals", "/api/deals/preview", "/api/curated", "/api/giveaways/:path*", "/api/members", "/api/members/stats", "/api/settings/:path*", "/api/board"],
};
