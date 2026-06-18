// 공개 — 핫딜 링크의 OG 메타(제목·이미지·가격·쇼핑몰) 추출. 무가입 제보 자동양식용.
// SSRF 방지: http(s) 공개 호스트만. (내부망/사설IP 차단)
export const runtime = "nodejs";

function isPublicHttpUrl(u: URL): boolean {
  if (u.protocol !== "http:" && u.protocol !== "https:") return false;
  const h = u.hostname.toLowerCase();
  if (h === "localhost" || h.endsWith(".local") || h === "0.0.0.0" || h === "::1" || h.startsWith("[")) return false;
  if (/^(127\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.)/.test(h)) return false;
  return true;
}

function parseMeta(html: string): Record<string, string> {
  const map: Record<string, string> = {};
  const tags = html.match(/<meta\b[^>]*>/gi) ?? [];
  for (const tag of tags) {
    const attrs: Record<string, string> = {};
    const re = /([\w:-]+)\s*=\s*("([^"]*)"|'([^']*)')/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(tag)) !== null) attrs[m[1].toLowerCase()] = m[3] ?? m[4] ?? "";
    const key = attrs["property"] || attrs["name"];
    if (key && attrs["content"]) map[key.toLowerCase()] = attrs["content"];
  }
  return map;
}

function titleTag(html: string): string | undefined {
  const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return m ? m[1].replace(/\s+/g, " ").trim() : undefined;
}

export async function POST(request: Request): Promise<Response> {
  let url = "";
  try {
    url = String(((await request.json()) as { url?: string }).url ?? "").trim();
  } catch {
    return Response.json({ ok: false, error: "잘못된 요청" }, { status: 400 });
  }
  let target: URL;
  try {
    target = new URL(url);
  } catch {
    return Response.json({ ok: false, error: "올바른 URL이 아니에요." }, { status: 400 });
  }
  if (!isPublicHttpUrl(target)) {
    return Response.json({ ok: false, error: "지원하지 않는 주소예요." }, { status: 400 });
  }

  try {
    const res = await fetch(target.toString(), {
      redirect: "follow",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
        "Accept-Language": "ko-KR,ko;q=0.9",
      },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) {
      return Response.json({ ok: true, partial: true, finalUrl: res.url, shop: target.hostname.replace(/^www\./, "") });
    }
    const html = (await res.text()).slice(0, 600000);
    const meta = parseMeta(html);
    const priceRaw = meta["product:price:amount"] || meta["og:price:amount"];
    const price = priceRaw ? Math.round(Number(priceRaw.replace(/[^0-9.]/g, ""))) : undefined;
    return Response.json({
      ok: true,
      finalUrl: res.url,
      title: (meta["og:title"] || meta["twitter:title"] || titleTag(html) || "").slice(0, 200),
      imageUrl: meta["og:image"] || meta["twitter:image"] || undefined,
      shop: (meta["og:site_name"] || target.hostname.replace(/^www\./, "")).slice(0, 60),
      price: price && price > 0 ? price : undefined,
    });
  } catch {
    return Response.json({ ok: true, partial: true, shop: target.hostname.replace(/^www\./, "") });
  }
}
