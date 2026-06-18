// 관리자 페이지(/admin/*) 보호 — Basic Auth.
// ADMIN_USER/ADMIN_PASS 환경변수가 설정돼 있을 때만 보호(미설정이면 통과 — 개발 편의).
// 운영에선 반드시 Vercel 환경변수에 ADMIN_USER/ADMIN_PASS 설정할 것.
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const user = process.env.ADMIN_USER;
  const pass = process.env.ADMIN_PASS;
  if (!user || !pass) return NextResponse.next();

  const auth = req.headers.get("authorization");
  if (auth?.startsWith("Basic ")) {
    try {
      const decoded = atob(auth.slice(6));
      const idx = decoded.indexOf(":");
      const u = decoded.slice(0, idx);
      const p = decoded.slice(idx + 1);
      if (u === user && p === pass) return NextResponse.next();
    } catch {
      // 무시 → 401
    }
  }

  return new NextResponse("관리자 인증이 필요합니다.", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="oneuldeal-admin"' },
  });
}

// /admin 페이지 + 브라우저용 타임딜 API(목록/등록/삭제/미리보기) Basic Auth 보호.
// /api/deals/ingest 는 크롤러(머신)용이라 제외 — 자체 CRON_SECRET으로 인증.
// (관리자 페이지에서 Basic Auth 인증 후 동일 출처 fetch는 브라우저가 자동으로 인증 헤더 전송)
export const config = {
  matcher: ["/admin/:path*", "/api/deals", "/api/deals/preview", "/api/curated"],
};
