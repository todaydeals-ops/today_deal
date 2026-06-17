// 쿠팡 URL 일괄 → 등록용 초안 목록.
// 1) 딥링크 일괄 변환(제휴링크), 2) 페이지 OG 메타(이름·이미지·가격) best-effort, 3) AI 한줄평.
// 키 미설정/스크래핑 실패 시 우아하게 폴백(빈 값 → 관리자가 채움).
import {
  coupangDeeplinkBatch,
  fetchCoupangProductMeta,
} from "@/lib/coupang";
import { generateBlurb, mockBlurb } from "@/lib/blurb";

interface BulkItem {
  inputUrl: string;
  affiliateUrl: string; // 제휴링크(딥링크 실패 시 원본 URL)
  productName: string;
  imageUrl?: string;
  salePrice?: number;
  adminNote: string;
  blurbSource: "ai" | "mock";
  linkSource: "coupang" | "raw"; // coupang=딥링크 성공, raw=원본 URL
}

interface BulkResult {
  ok: boolean;
  items: BulkItem[];
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
      { ok: false, items: [], error: "잘못된 요청" } satisfies BulkResult,
      { status: 400 }
    );
  }

  // 쿠팡 URL만, 중복 제거, 최대 MAX_URLS
  urls = [...new Set(urls)]
    .filter((u) => /^https?:\/\/.*coupang\.(com|kr)/i.test(u) || u.includes("coupang"))
    .slice(0, MAX_URLS);

  if (urls.length === 0) {
    return Response.json(
      { ok: false, items: [], error: "유효한 쿠팡 URL이 없어요." } satisfies BulkResult,
      { status: 400 }
    );
  }

  // 1) 제휴링크 일괄 변환 (1회 호출), 2) 메타 병렬 수집
  const [linkMap, metas] = await Promise.all([
    coupangDeeplinkBatch(urls),
    Promise.all(urls.map((u) => fetchCoupangProductMeta(u))),
  ]);

  // 3) 한줄평 병렬 생성 (이름이 있을 때만)
  const blurbs = await Promise.all(
    metas.map((m) =>
      m.title ? generateBlurb({ productName: m.title, price: m.price }) : Promise.resolve(null)
    )
  );

  const items: BulkItem[] = urls.map((url, i) => {
    const meta = metas[i];
    const link = linkMap[url];
    const productName = meta.title ?? "";
    const ai = blurbs[i];
    return {
      inputUrl: url,
      affiliateUrl: link ?? url,
      productName,
      imageUrl: meta.imageUrl,
      salePrice: meta.price,
      adminNote: ai ?? (productName ? mockBlurb(productName) : ""),
      blurbSource: ai ? "ai" : "mock",
      linkSource: link ? "coupang" : "raw",
    };
  });

  return Response.json({ ok: true, items } satisfies BulkResult);
}
