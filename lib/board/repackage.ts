// 크롤한 딜 링크 재포장 — 원작성자 제휴 트래킹을 제거하고 우리 제휴링크로 교체.
// ADBC(redirect 딥링크): 마켓컬리·이마트몰·SSG.com·오늘의집 (CPS, 검증완료).
// LinkPrice: DetailMerchantList에서 "기본링크 있음=제휴완료"인 머천트(host→m= 코드 맵).
// 미연동(원본 유지): 11번가(미제휴)·쿠팡(파트너스 정지) 등.
import { adbcDeeplink } from "@/lib/adbc";
import { linkpriceDeeplink, gmarketMerchant } from "@/lib/linkprice";

function hostOf(url: string): string | null {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return null;
  }
}

// LinkPrice 제휴완료 머천트: 사이트 host 접미사 → 머천트 코드(m=). (지마켓은 프로모 전환 위해 동적)
// ★ 절대 추가 금지: emart.ssg.com·ssg.com·kurly.com·ohou — 이들은 ADBC(퀀텀비트) 수수료율이 더 좋아
//   위 ADBC 블록에서 우선 처리한다. LinkPrice에 같은 몰이 풀려도 ADBC 우선(중복방지).
const LINKPRICE_HOSTS: Record<string, string> = {
  "11st.co.kr": "11st", // 11번가(승인완료 2026-06-25)
  "auction.co.kr": "auction",
  "lotteon.com": "lotteon",
  "e-himart.co.kr": "himart",
  "hmall.com": "hmall",
  "lotteimall.com": "woori", // 롯데홈쇼핑(롯데아이몰)
  "nsmall.com": "nsseshop", // NS홈쇼핑
  "gongyoungshop.kr": "gongyoung", // 공영홈쇼핑
  "thirtymall.com": "thirtymall", // 떠리몰
  "cjthemarket.com": "cjbrand", // CJ더마켓
  "wconcept.co.kr": "wconcept",
  "pulmuone.co.kr": "pulmuone", // 풀무원
  "hfashionmall.com": "hfashion", // H패션몰
  "clubclio.co.kr": "clubclio",
  "shein.com": "shein",
  "aliexpress.com": "aliexpress", // 알리(LinkPrice 채널 연결)
};
function linkpriceMerchantFor(host: string): string | null {
  if (host.endsWith("gmarket.co.kr") || host.endsWith("g9.co.kr")) return gmarketMerchant();
  for (const suffix in LINKPRICE_HOSTS) {
    if (host === suffix || host.endsWith("." + suffix)) return LINKPRICE_HOSTS[suffix];
  }
  return null;
}

// 딜 링크 재포장. 우리 제휴링크로 교체 가능하면 그 URL, 불가하면 null(호출부가 원본 유지).
// sub1 = 우리 식별값(글 slug 등) — ADBC 클릭/전환 귀속·분석용.
export async function repackageDealUrl(url: string, sub1 = "board"): Promise<string | null> {
  if (!url) return null;
  const host = hostOf(url);
  if (!host) return null;

  // ADBC(CPS) 우선 — 이미 검증된 머천트
  if (host === "kurly.com" || host.endsWith(".kurly.com")) return adbcDeeplink("kurly", url, sub1);
  if (host === "emart.ssg.com") return adbcDeeplink("emart", url, sub1);
  if (host === "ssg.com" || host.endsWith(".ssg.com")) return adbcDeeplink("ssg", url, sub1);
  if (host === "store.ohou.se" || host === "ohou.se" || host.endsWith(".ohou.se")) return adbcDeeplink("ohou", url, sub1);
  if (host === "coupang.com" || host.endsWith(".coupang.com")) return adbcDeeplink("coupang", url, sub1);

  // LinkPrice 제휴완료 머천트
  const m = linkpriceMerchantFor(host);
  if (m) {
    const ours = linkpriceDeeplink(m, url);
    return ours && ours !== url ? ours : null;
  }
  // 그 외 → 미연동(원본 유지)
  return null;
}
