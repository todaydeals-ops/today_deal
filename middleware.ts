import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// 서브도메인 라우팅: goodsleep.todaydeals.co.kr 루트 → /goodsleep(잠자리연구소).
// 개별 글(/magazine/[slug]) 등 다른 경로는 그대로 서빙(같은 앱).
export function middleware(req: NextRequest) {
  const host = (req.headers.get("host") || "").toLowerCase();
  if (host.startsWith("goodsleep.")) {
    const url = req.nextUrl.clone();
    if (url.pathname === "/") {
      url.pathname = "/goodsleep";
      return NextResponse.rewrite(url);
    }
  }
  return NextResponse.next();
}

export const config = { matcher: "/" };
