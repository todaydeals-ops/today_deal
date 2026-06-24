// 크롤한 딜 링크 재포장 — 원작성자 제휴 트래킹을 제거하고 우리 제휴링크로 교체.
// 연동: 지마켓→LinkPrice(승인완료) · 마켓컬리/이마트몰/SSG.com→ADBC(redirect 딥링크).
// 미연동(원본 유지): 11번가(LinkPrice 미승인) · 쿠팡(파트너스 정지) · 그 외 매체.
import { adbcDeeplink } from "@/lib/adbc";
import { linkpriceDeeplink, gmarketMerchant } from "@/lib/linkprice";

function hostOf(url: string): string | null {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return null;
  }
}

// 딜 링크 재포장. 우리 제휴링크로 교체 가능하면 그 URL, 불가하면 null(호출부가 원본 유지).
// sub1 = 우리 식별값(글 slug 등) — ADBC 클릭/전환 귀속·분석용.
export async function repackageDealUrl(url: string, sub1 = "board"): Promise<string | null> {
  if (!url) return null;
  const host = hostOf(url);
  if (!host) return null;

  // 지마켓 → LinkPrice (승인완료). g9도 동일 머천트.
  if (host.endsWith("gmarket.co.kr") || host.endsWith("g9.co.kr")) {
    const ours = linkpriceDeeplink(gmarketMerchant(), url);
    return ours && ours !== url ? ours : null;
  }
  // 옥션 → LinkPrice (승인완료)
  if (host.endsWith("auction.co.kr")) {
    const ours = linkpriceDeeplink("auction", url);
    return ours && ours !== url ? ours : null;
  }
  // 롯데온 → LinkPrice (승인완료)
  if (host.endsWith("lotteon.com")) {
    const ours = linkpriceDeeplink("lotteon", url);
    return ours && ours !== url ? ours : null;
  }
  // 마켓컬리 → ADBC
  if (host === "kurly.com" || host.endsWith(".kurly.com")) {
    return adbcDeeplink("kurly", url, sub1);
  }
  // 이마트몰 → ADBC (emart.ssg.com — .ssg.com 일반보다 먼저 매칭)
  if (host === "emart.ssg.com") {
    return adbcDeeplink("emart", url, sub1);
  }
  // SSG.com(신세계몰·백화점 등 SSG 채널) → ADBC
  if (host === "ssg.com" || host.endsWith(".ssg.com")) {
    return adbcDeeplink("ssg", url, sub1);
  }
  // 오늘의집(store.ohou.se/goods/{id}) → ADBC
  if (host === "store.ohou.se" || host === "ohou.se" || host.endsWith(".ohou.se")) {
    return adbcDeeplink("ohou", url, sub1);
  }
  // 11번가 미승인 · 쿠팡 정지 · 그 외 → 미연동(원본 유지)
  return null;
}
