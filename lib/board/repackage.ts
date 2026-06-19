// 크롤한 딜 링크 재포장 — 원작성자의 제휴 트래킹을 제거하고 우리 제휴링크로 교체.
// 현재 연동: 쿠팡 파트너스(COUPANG_ACCESS_KEY/COUPANG_SECRET_KEY).
// 그 외 매체(11번가·스마트스토어 등)는 ADBC 제휴코드 대기 → 원본 그대로 둠.
import { coupangDeeplink } from "@/lib/coupang";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

// 쿠팡 제휴 트래킹 파라미터(타인 식별자) — 재발급 전에 제거.
const COUPANG_TRACK_PARAMS = new Set([
  "lptag",
  "traceid",
  "subid",
  "subparam",
  "itime",
  "addtag",
  "ctag",
  "mcid",
  "wpcid",
  "wref",
  "wtime",
  "spec",
]);

function hostOf(url: string): string | null {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return null;
  }
}

function isCoupangHost(host: string): boolean {
  return host === "coupang.com" || host.endsWith(".coupang.com");
}

// coupang.com 상품/검색 URL에서 제휴 트래킹 파라미터만 제거(검색어 q 등 기능성 파라미터는 보존).
function stripCoupangTracking(raw: string): string {
  try {
    const u = new URL(raw);
    for (const key of [...u.searchParams.keys()]) {
      if (COUPANG_TRACK_PARAMS.has(key.toLowerCase())) u.searchParams.delete(key);
    }
    return u.toString();
  } catch {
    return raw;
  }
}

// link.coupang.com 단축 제휴링크(타인 트래킹) → 리다이렉트 추적으로 원본 coupang.com URL 복원.
async function resolveShortLink(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      method: "GET",
      headers: { "User-Agent": UA },
      redirect: "follow",
      signal: AbortSignal.timeout(8000),
    });
    const final = res.url;
    if (final && /(^|\.)coupang\.com/i.test(final) && !/link\.coupang\.com/i.test(final)) {
      return final;
    }
    return null;
  } catch {
    return null;
  }
}

// 딜 링크 재포장. 우리 제휴링크로 교체 가능하면 그 URL, 불가하면 null(호출부가 원본 유지).
export async function repackageDealUrl(url: string): Promise<string | null> {
  if (!url) return null;
  const host = hostOf(url);
  if (!host || !isCoupangHost(host)) return null; // 쿠팡 외 매체는 현재 미연동
  if (!process.env.COUPANG_ACCESS_KEY || !process.env.COUPANG_SECRET_KEY) return null;

  let target = url;
  // 단축 제휴링크면 먼저 원본 상품 URL로 복원(복원 실패 시 재포장 포기 → 원본 유지)
  if (host === "link.coupang.com") {
    const resolved = await resolveShortLink(url);
    if (!resolved) return null;
    target = resolved;
  }
  target = stripCoupangTracking(target);

  const ours = await coupangDeeplink(target);
  // 우리 링크가 원본과 사실상 동일하면(이미 우리 것이었다면) 굳이 교체 안 함
  return ours && ours !== url ? ours : null;
}
