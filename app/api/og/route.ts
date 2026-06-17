// 쿠팡 상품 링크 → OG 메타(섬네일·제목·가격) 스크래핑 엔드포인트
// 클라이언트는 CORS·봇차단으로 직접 못 읽으므로 서버에서 대신 가져온다.
// 짧은 제휴링크(link.coupang.com)는 리다이렉트를 따라가 실제 상품 페이지를 읽는다.
//
// ⚠️ 현실: 쿠팡은 서버 스크래핑을 403으로 자주 막는다 → 자동 실패 시 관리자가 수동 입력.
// TODO(파트너스 API): 키 발급(기획안 §10) 후 이 핸들러를 쿠팡 파트너스 API 호출로 교체.
//   - deeplink API: 상품 URL → 제휴링크 변환
//   - 상품정보(이미지·제목·가격)도 API 응답으로 받아 OgResult 형태 그대로 반환하면
//     관리자 페이지/클라이언트는 수정 없이 동작한다.

interface OgResult {
  ok: boolean;
  finalUrl?: string;
  imageUrl?: string;
  title?: string;
  price?: number;
  error?: string;
}

// SSRF 방지: 쿠팡 계열 도메인만 허용
function isAllowedHost(url: URL): boolean {
  const host = url.hostname.toLowerCase();
  return (
    host === "coupang.com" ||
    host.endsWith(".coupang.com") ||
    host === "coupa.ng"
  );
}

// <meta ...> 태그를 모두 모아 property/name → content 맵으로
function parseMeta(html: string): Record<string, string> {
  const map: Record<string, string> = {};
  const metaTags = html.match(/<meta\b[^>]*>/gi) ?? [];
  for (const tag of metaTags) {
    const attrs: Record<string, string> = {};
    const attrRe = /([\w:-]+)\s*=\s*("([^"]*)"|'([^']*)')/g;
    let m: RegExpExecArray | null;
    while ((m = attrRe.exec(tag)) !== null) {
      attrs[m[1].toLowerCase()] = m[3] ?? m[4] ?? "";
    }
    const key = attrs["property"] || attrs["name"];
    if (key && attrs["content"]) map[key.toLowerCase()] = attrs["content"];
  }
  return map;
}

// JSON-LD에서 가격 보조 추출
function priceFromJsonLd(html: string): number | undefined {
  const blocks =
    html.match(
      /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
    ) ?? [];
  for (const block of blocks) {
    const json = block.replace(/<script[^>]*>|<\/script>/gi, "").trim();
    try {
      const data = JSON.parse(json);
      const nodes = Array.isArray(data) ? data : [data];
      for (const node of nodes) {
        const price = node?.offers?.price ?? node?.price;
        if (price != null) {
          const n = Number(String(price).replace(/[^0-9.]/g, ""));
          if (!Number.isNaN(n) && n > 0) return Math.round(n);
        }
      }
    } catch {
      // 무시
    }
  }
  return undefined;
}

function cleanTitle(raw?: string): string | undefined {
  if (!raw) return undefined;
  return raw.replace(/\s*[-|]\s*쿠팡!?.*$/, "").trim();
}

export async function POST(request: Request): Promise<Response> {
  let url: string;
  try {
    const body = await request.json();
    url = String(body?.url ?? "").trim();
  } catch {
    return Response.json({ ok: false, error: "잘못된 요청" } satisfies OgResult, {
      status: 400,
    });
  }

  if (!url) {
    return Response.json({ ok: false, error: "URL을 입력하세요" } satisfies OgResult, {
      status: 400,
    });
  }

  let target: URL;
  try {
    target = new URL(url);
  } catch {
    return Response.json({ ok: false, error: "올바른 URL이 아닙니다" } satisfies OgResult, {
      status: 400,
    });
  }

  if (!isAllowedHost(target)) {
    return Response.json(
      { ok: false, error: "쿠팡 상품 링크만 지원합니다" } satisfies OgResult,
      { status: 400 }
    );
  }

  try {
    const res = await fetch(target.toString(), {
      redirect: "follow",
      headers: {
        // 봇 차단 완화용 브라우저 UA
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
        "Accept-Language": "ko-KR,ko;q=0.9",
      },
      // 너무 오래 매달리지 않게
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      return Response.json(
        {
          ok: false,
          finalUrl: res.url,
          error: `쿠팡 응답 오류 (${res.status}). 수동으로 입력해주세요.`,
        } satisfies OgResult,
        { status: 200 }
      );
    }

    const html = await res.text();
    const meta = parseMeta(html);

    const imageUrl = meta["og:image"] || meta["twitter:image"];
    const title = cleanTitle(meta["og:title"] || meta["twitter:title"]);
    const metaPrice = meta["product:price:amount"];
    let price: number | undefined = metaPrice
      ? Math.round(Number(metaPrice.replace(/[^0-9.]/g, "")))
      : undefined;
    if (!price || Number.isNaN(price)) price = priceFromJsonLd(html);

    return Response.json({
      ok: true,
      finalUrl: res.url,
      imageUrl,
      title,
      price,
    } satisfies OgResult);
  } catch {
    return Response.json(
      {
        ok: false,
        error:
          "상품 정보를 가져오지 못했습니다 (차단·타임아웃). 수동으로 입력해주세요.",
      } satisfies OgResult,
      { status: 200 }
    );
  }
}
