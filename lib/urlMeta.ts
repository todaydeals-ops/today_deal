// 타임딜 링크 등록용 — 임의 상품 URL의 OG 메타(제목·이미지·가격) best-effort 추출
// + 플랫폼 자동감지 + 제휴링크 변환. (서버 전용)
import type { Platform } from "@/lib/types";
import { linkpriceDeeplink, LINKPRICE_MERCHANT, gmarketMerchant } from "@/lib/linkprice";

export interface UrlMeta {
  title?: string;
  imageUrl?: string;
  price?: number;
}

// 지원 플랫폼 + 쿠팡(타임딜 아님 → 추천딜로 안내) 구분
export type DetectedPlatform = Platform | "coupang" | null;

export function detectPlatform(url: string): DetectedPlatform {
  const u = url.toLowerCase();
  if (/gmarket\./.test(u)) return "gmarket";
  if (/11st\./.test(u) || /11st\.co\.kr/.test(u)) return "11st";
  if (/aliexpress\./.test(u)) return "ali";
  if (/coupang\./.test(u)) return "coupang";
  return null;
}

// 플랫폼별 제휴링크 변환. 변환 불가(키 미설정 등) 시 null.
export function affiliateForPlatform(platform: Platform, url: string): string | null {
  switch (platform) {
    case "gmarket":
      return linkpriceDeeplink(gmarketMerchant(), url);
    case "11st":
      return linkpriceDeeplink(LINKPRICE_MERCHANT["11st"], url);
    case "ali":
      return linkpriceDeeplink(LINKPRICE_MERCHANT.aliexpress, url);
    default:
      return null;
  }
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(Number(d)));
}

export async function fetchUrlMeta(url: string): Promise<UrlMeta> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
        "Accept-Language": "ko-KR,ko;q=0.9",
      },
      signal: AbortSignal.timeout(8000),
      redirect: "follow",
    });
    if (!res.ok) return {};
    const html = await res.text();

    const meta = (prop: string): string | undefined => {
      // property="og:xxx" 또는 name="xxx" 양쪽 지원, content 순서 무관
      const patterns = [
        new RegExp(`<meta[^>]+(?:property|name)=["']${prop}["'][^>]+content=["']([^"']+)["']`, "i"),
        new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${prop}["']`, "i"),
      ];
      for (const re of patterns) {
        const m = html.match(re);
        if (m?.[1]) return decodeEntities(m[1]);
      }
      return undefined;
    };

    const title = meta("og:title") ?? meta("twitter:title");
    const imageUrl = meta("og:image") ?? meta("twitter:image");

    // 가격: og:price:amount / product:price:amount / JSON-LD "price" best-effort
    let price: number | undefined;
    const metaPrice =
      meta("og:price:amount") ?? meta("product:price:amount") ?? meta("twitter:data1");
    const fromMeta = metaPrice ? Number(metaPrice.replace(/[^\d]/g, "")) : NaN;
    if (fromMeta > 0) {
      price = fromMeta;
    } else {
      const pm = html.match(/["']?price["']?\s*[:=]\s*["']?([\d,]+)/i);
      if (pm) {
        const n = Number(pm[1].replace(/,/g, ""));
        if (n > 0) price = n;
      }
    }

    return { title, imageUrl, price };
  } catch {
    return {};
  }
}
