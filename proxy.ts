// (1) 관리자(/admin/*) + 쓰기 API 보호 — 쿠키 기반 간단 로그인
// (2) 호스트 정본화 — 같은 글이 5개 호스트에서 열리던 중복 URL을 301로 접는다
// (Next 16 proxy 컨벤션)
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ADMIN_COOKIE, ADMIN_TOKEN } from "@/lib/adminAuth";
import { OWNER_ORIGIN, PATH_TO_OWNER, ownerFromHost, ownerOfSlug } from "@/lib/magazine/owner";

/** 이 요청이 정본 호스트로 온 게 아니면 301 대상 URL을 돌려준다. */
function canonicalRedirect(req: NextRequest): string | null {
  const host = req.headers.get("host") || "";
  const path = req.nextUrl.pathname;
  const here = ownerFromHost(host);

  // /goodsleep·/pill·/beauty·/b4as 는 서브도메인 루트의 내부 rewrite 대상이다.
  // 공개 URL로 노출되면 브랜드 홈이 호스트마다 중복된다 — 각 브랜드 루트로 접는다.
  for (const [p, owner] of Object.entries(PATH_TO_OWNER)) {
    if (path === p || path.startsWith(p + "/")) {
      return OWNER_ORIGIN[owner] + "/" + req.nextUrl.search;
    }
  }

  // 아티클 정본은 www 다(서브도메인이 아니다). 서브도메인으로 들어온 아티클은 www 로 접는다.
  // ★방향을 반대로 하면 안 된다 — www 의 AS 글들이 이미 색인되고 클릭을 받고 있다(2026-08-10 실측).
  //   순위가 붙은 페이지를 이력 0인 새 호스트로 옮기면 재색인 몇 주 동안 순위를 잃는다.
  if (/^\/magazine\//.test(path)) {
    if (here !== "deal") return OWNER_ORIGIN.deal + path + req.nextUrl.search;
    return null;
  }

  // 아티클 말고 나머지 경로(딜·게시판·매거진 목록 등)는 www 만 담당한다.
  // 서브도메인에서 열리면 브랜드와 무관한 페이지가 5벌로 복제된다.
  if (here !== "deal" && path !== "/" && !path.startsWith("/sub-sitemap")) {
    return OWNER_ORIGIN.deal + path + req.nextUrl.search;
  }
  return null;
}

export function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;

  // ── 호스트 정본화 먼저 ──
  const to = canonicalRedirect(req);
  if (to) return NextResponse.redirect(to, 301);

  // ── 관리자 보호 ──
  // matcher 를 정본화 때문에 넓혔으므로, 보호 대상은 여기서 정확히 골라낸다.
  // /api/cron·/api/auth·/api/deals/ingest 는 각자 시크릿이 있어 제외해야 한다.
  const PROTECTED = [
    "/api/deals", "/api/deals/preview", "/api/curated", "/api/giveaways",
    "/api/members", "/api/members/stats", "/api/settings", "/api/board",
  ];
  const needsAuth =
    path.startsWith("/admin") ||
    PROTECTED.some((p) => path === p || path.startsWith(p + "/"));
  if (!needsAuth) return NextResponse.next();
  if (path === "/admin/login") return NextResponse.next();

  const authed = req.cookies.get(ADMIN_COOKIE)?.value === ADMIN_TOKEN;
  if (authed) return NextResponse.next();

  if (path.startsWith("/api/")) {
    return NextResponse.json({ ok: false, error: "관리자 인증이 필요합니다." }, { status: 401 });
  }
  const url = req.nextUrl.clone();
  url.pathname = "/admin/login";
  url.searchParams.set("next", path);
  return NextResponse.redirect(url);
}

// 정본화는 크롤러가 닿는 모든 경로에 필요하므로 matcher를 넓혔다.
// 정적 자산·이미지·favicon 은 제외한다.
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg|apple-icon.png|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|txt|xml)$).*)"],
};
