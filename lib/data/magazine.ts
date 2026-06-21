// 매거진(중립 쇼핑 가이드) 데이터 접근. magazine 테이블 없으면 빈 배열로 폴백.
import { getSupabaseAdmin } from "@/lib/supabase/server";

export interface MagazineArticle {
  id: string;
  slug: string;
  corner: string; // factcheck | smartguide | compare | longrun | trendlab
  field?: string; // 분야 태그
  title: string;
  subtitle?: string;
  excerpt?: string;
  readMin?: number;
  bodyHtml: string; // 본문(메인 컬럼 HTML) — 본문 내 구매/제휴 링크 없음
  closing?: string; // 정직한 마무리(조건부 결론, 풀폭)
  summary?: string[]; // 사이드 레일: 3줄 요약
  callout?: string; // 사이드 레일: '짚고 가요' (HTML 허용)
  createdAt: string;
}

interface Row {
  id: string;
  slug: string;
  corner: string;
  field: string | null;
  title: string;
  subtitle: string | null;
  excerpt: string | null;
  read_min: number | null;
  body_html: string;
  closing: string | null;
  created_at: string;
}

function map(r: Row): MagazineArticle {
  // 본문 맨 앞 <!--RAIL:{...}--> 주석에서 레일용(summary·callout) 분리
  let bodyHtml = r.body_html ?? "";
  let summary: string[] | undefined;
  let callout: string | undefined;
  const m = bodyHtml.match(/^\s*<!--RAIL:([\s\S]*?)-->\s*/);
  if (m) {
    try {
      const j = JSON.parse(m[1]);
      if (Array.isArray(j.summary)) summary = j.summary;
      if (typeof j.callout === "string") callout = j.callout;
    } catch {
      /* ignore malformed rail */
    }
    bodyHtml = bodyHtml.slice(m[0].length);
  }
  return {
    id: r.id,
    slug: r.slug,
    corner: r.corner,
    field: r.field ?? undefined,
    title: r.title,
    subtitle: r.subtitle ?? undefined,
    excerpt: r.excerpt ?? undefined,
    readMin: r.read_min ?? undefined,
    bodyHtml,
    closing: r.closing ?? undefined,
    summary,
    callout,
    createdAt: r.created_at,
  };
}

export async function fetchMagazineList(opts?: { corner?: string; limit?: number }): Promise<MagazineArticle[]> {
  const sb = getSupabaseAdmin();
  if (!sb) return [];
  try {
    let q = sb
      .from("magazine")
      .select("*")
      .eq("is_published", true)
      .order("created_at", { ascending: false })
      .limit(opts?.limit ?? 60);
    if (opts?.corner) q = q.eq("corner", opts.corner);
    const { data, error } = await q;
    if (error || !data) return [];
    return (data as Row[]).map(map);
  } catch {
    return [];
  }
}

export async function fetchMagazineBySlug(slug: string): Promise<MagazineArticle | null> {
  const sb = getSupabaseAdmin();
  if (!sb) return null;
  try {
    const { data, error } = await sb.from("magazine").select("*").eq("slug", slug).limit(1).maybeSingle();
    if (error || !data) return null;
    return map(data as Row);
  } catch {
    return null;
  }
}

// 관련 글: 같은 코너(+2)·같은 분야(+1) 가중치 후 최신순. 내부링크/색인용.
export async function fetchRelatedMagazine(article: MagazineArticle, limit = 4): Promise<MagazineArticle[]> {
  const all = await fetchMagazineList({ limit: 60 });
  const scored = all
    .filter((x) => x.slug !== article.slug)
    .map((x) => {
      let s = 0;
      if (x.corner === article.corner) s += 2;
      if (x.field && x.field === article.field) s += 1;
      return { x, s };
    });
  scored.sort((a, b) => b.s - a.s || (a.x.createdAt < b.x.createdAt ? 1 : -1));
  return scored.slice(0, limit).map((e) => e.x);
}

export async function fetchMagazineSlugs(limit = 1000): Promise<string[]> {
  const sb = getSupabaseAdmin();
  if (!sb) return [];
  try {
    const { data } = await sb.from("magazine").select("slug").eq("is_published", true).order("created_at", { ascending: false }).limit(limit);
    return ((data as { slug: string }[]) ?? []).map((r) => r.slug);
  } catch {
    return [];
  }
}
