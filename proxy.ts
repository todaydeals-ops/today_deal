// (1) 관리자(/admin/*) + 쓰기 API 보호 — 쿠키 기반 간단 로그인
// (2) 호스트 정본화 — 같은 글이 5개 호스트에서 열리던 중복 URL을 301로 접는다
// (Next 16 proxy 컨벤션)
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ADMIN_COOKIE, ADMIN_TOKEN } from "@/lib/adminAuth";
import { WWW_ORIGIN } from "@/lib/magazine/owner";
import { LAB_HOME, LEGACY_SUBDOMAIN } from "@/lib/magazine/subdomain";

/** 이 요청이 정본 호스트로 온 게 아니면 301 대상 URL을 돌려준다. */
function canonicalRedirect(req: NextRequest): string | null {
  const host = (req.headers.get("host") || "").toLowerCase();
  const path = req.nextUrl.pathname;
  const search = req.nextUrl.search;

  // ★2026-10-17 중앙 집중 — 연구소 5곳을 www 아래 경로로 모았다(lib/magazine/subdomain.ts).
  // 옛 서브도메인으로 들어온 요청은 전부 www 로 접는다.
  //   루트("/?cat=…" 포함) → 그 연구소 홈 경로(www/goodsleep?cat=…)
  //   그 밖(/magazine/<slug>, robots.txt, sub-sitemap.xml 등) → www 의 같은 경로
  // 아티클은 원래부터 정본이 www 였으므로(owner.ts) 색인된 글의 주소는 바뀌지 않는다.
  const lab = LEGACY_SUBDOMAIN[host.split(".")[0]];
  if (lab && host.endsWith(".todaydeals.co.kr")) {
    return (path === "/" ? LAB_HOME[lab] : WWW_ORIGIN + path) + search;
  }
  return null;
}

// ★2026-10-21 개편(사장님 지시): 타임딜·추천딜·핫딜글·나눔은 폐지 — 오늘의딜은 정보성 콘텐츠 채널이다.
//   목록 주소는 홈으로 301(즐겨찾기로 온 사람이 길을 잃지 않게), 개별 딜·게시물은 410(검색엔진이 가장 빨리
//   색인에서 지운다). DB 데이터(deals·deal_archive·board_deals·curated_deals)는 지우지 않았다 — 되돌릴 수 있다.
const DEAL_HUBS = new Set(["/deals", "/recommended", "/board", "/giveaway"]);
const DEAL_DETAIL = /^\/(?:deals|deal|recommended|board|giveaway)\/.+/;

function goneResponse(): NextResponse {
  const html = `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="robots" content="noindex"><meta name="viewport" content="width=device-width,initial-scale=1"><title>종료된 페이지 | 오늘의딜</title></head><body style="font-family:Pretendard,-apple-system,sans-serif;max-width:560px;margin:80px auto;padding:0 20px;color:#16140f;line-height:1.7"><h1 style="font-size:24px">이 페이지는 종료됐어요</h1><p>오늘의딜은 딜 소개를 마치고, 사기 전에·고치기 전에 찾아보는 정보 채널로 바뀌었습니다.</p><p><a href="/" style="color:#ff5a3c">오늘의딜 매거진</a> · <a href="/wiki" style="color:#ff5a3c">생활백과</a> · <a href="/wiki/error-codes" style="color:#ff5a3c">가전 에러코드 사전</a></p></body></html>`;
  return new NextResponse(html, { status: 410, headers: { "Content-Type": "text/html; charset=utf-8", "X-Robots-Tag": "noindex" } });
}

export function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;

  // ── 호스트 정본화 먼저 ──
  const to = canonicalRedirect(req);
  if (to) return NextResponse.redirect(to, 301);

  // ── 폐지된 딜 영역 ──
  if (DEAL_HUBS.has(path)) return NextResponse.redirect(`${WWW_ORIGIN}/`, 301);
  if (DEAL_DETAIL.test(path)) return goneResponse();

  // ── 관리자 보호 ──
  // matcher 를 정본화 때문에 넓혔으므로, 보호 대상은 여기서 정확히 골라낸다.
  // /api/cron·/api/auth·/api/deals/ingest 는 각자 시크릿이 있어 제외해야 한다.
  // ★ 자기 시크릿으로 인증하는 머신-투-머신 엔드포인트는 먼저 빠져나간다.
  // 2026-08-10 아래 PROTECTED 에 "/api/deals" 를 넣으면서 prefix 매칭이
  // /api/deals/ingest 까지 잡아버렸다. 크롤러는 CRON_SECRET 을 Bearer 로 보내는데
  // 프록시가 그 앞에서 401 을 돌려줘, 수집한 딜이 3일간 전부 버려졌다
  // (crawl.log: "39건 전송 → ✗ ingest 실패: 401").
  // 주석으로 "제외해야 한다"고 적어두는 것으로는 안 지켜진다. 코드로 뺀다.
  const MACHINE = ["/api/deals/ingest", "/api/cron", "/api/auth", "/api/adbc/postback"];
  if (MACHINE.some((p) => path === p || path.startsWith(p + "/"))) return NextResponse.next();

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
