// 타임딜 링크 미리보기 — URL 목록 → 플랫폼 자동감지 + OG 메타 + 제휴링크 변환 초안.
// 쿠팡 URL은 타임딜이 아니라 추천딜이므로 unsupported로 안내.
import type { Platform } from "@/lib/types";
import {
  fetchUrlMeta,
  detectPlatform,
  affiliateForPlatform,
} from "@/lib/urlMeta";

interface PreviewItem {
  inputUrl: string;
  supported: boolean;
  platform: Platform | null;
  note?: string; // 미지원 사유
  productName: string;
  imageUrl?: string;
  salePrice?: number;
  productUrl: string;
  affiliateUrl: string; // 변환 실패 시 원본
  linkSource: "linkprice" | "raw";
}

interface PreviewResult {
  ok: boolean;
  items: PreviewItem[];
  error?: string;
}

const MAX_URLS = 15;

export async function POST(request: Request): Promise<Response> {
  let urls: string[] = [];
  try {
    const b = await request.json();
    urls = Array.isArray(b?.urls)
      ? b.urls.map((u: unknown) => String(u).trim()).filter(Boolean)
      : [];
  } catch {
    return Response.json(
      { ok: false, items: [], error: "잘못된 요청" } satisfies PreviewResult,
      { status: 400 }
    );
  }

  urls = [...new Set(urls)].filter((u) => /^https?:\/\//i.test(u)).slice(0, MAX_URLS);
  if (urls.length === 0) {
    return Response.json(
      { ok: false, items: [], error: "유효한 URL이 없어요." } satisfies PreviewResult,
      { status: 400 }
    );
  }

  const items = await Promise.all(
    urls.map(async (url): Promise<PreviewItem> => {
      const detected = detectPlatform(url);

      if (detected === "coupang") {
        return {
          inputUrl: url,
          supported: false,
          platform: null,
          note: "쿠팡 상품은 '추천딜'에서 등록하세요.",
          productName: "",
          productUrl: url,
          affiliateUrl: url,
          linkSource: "raw",
        };
      }
      if (detected === null) {
        return {
          inputUrl: url,
          supported: false,
          platform: null,
          note: "지마켓·11번가·알리익스프레스 링크만 지원해요.",
          productName: "",
          productUrl: url,
          affiliateUrl: url,
          linkSource: "raw",
        };
      }

      const platform = detected as Platform;
      const [meta, aff] = await Promise.all([
        fetchUrlMeta(url),
        Promise.resolve(affiliateForPlatform(platform, url)),
      ]);
      return {
        inputUrl: url,
        supported: true,
        platform,
        productName: meta.title ?? "",
        imageUrl: meta.imageUrl,
        salePrice: meta.price,
        productUrl: url,
        affiliateUrl: aff ?? url,
        linkSource: aff ? "linkprice" : "raw",
      };
    })
  );

  return Response.json({ ok: true, items } satisfies PreviewResult);
}
