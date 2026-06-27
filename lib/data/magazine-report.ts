import { getSupabaseAdmin } from "@/lib/supabase/server";
import type { MagazineArticle } from "./magazine";

export interface MagazineReport {
  slug: string;
  topic: string;
  title: string;
  subtitle?: string;
  excerpt?: string;
  intro: string;
  articleSlugs: string[];
  articles: MagazineArticle[];
  createdAt: string;
}

interface ReportRow {
  slug: string;
  field: string | null;
  title: string;
  subtitle: string | null;
  excerpt: string | null;
  body_html: string;
  created_at: string;
}

function mapRow(r: ReportRow): { meta: { articles: string[]; topic: string }; intro: string } | null {
  const m = (r.body_html ?? "").match(/<!--REPORT:([\s\S]*?)-->\s*/);
  if (!m) return null;
  try {
    const meta = JSON.parse(m[1]);
    const intro = r.body_html.slice(m[0].length).replace(/<[^>]+>/g, "").trim();
    return { meta, intro };
  } catch {
    return null;
  }
}

export async function fetchReportList(limit = 20): Promise<Omit<MagazineReport, "articles">[]> {
  const sb = getSupabaseAdmin();
  if (!sb) return [];
  const { data } = await sb
    .from("magazine")
    .select("slug,field,title,subtitle,excerpt,body_html,created_at")
    .eq("is_published", true)
    .eq("corner", "report")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (!data) return [];
  return (data as ReportRow[]).flatMap((r) => {
    const parsed = mapRow(r);
    if (!parsed) return [];
    return [{
      slug: r.slug,
      topic: r.field ?? parsed.meta.topic ?? "",
      title: r.title,
      subtitle: r.subtitle ?? undefined,
      excerpt: r.excerpt ?? undefined,
      intro: parsed.intro,
      articleSlugs: parsed.meta.articles ?? [],
      createdAt: r.created_at,
    }];
  });
}

export async function fetchReportBySlug(slug: string): Promise<MagazineReport | null> {
  const sb = getSupabaseAdmin();
  if (!sb) return null;

  // report 자체 조회
  const { data: row } = await sb
    .from("magazine")
    .select("slug,field,title,subtitle,excerpt,body_html,created_at")
    .eq("slug", slug)
    .eq("corner", "report")
    .eq("is_published", true)
    .maybeSingle();
  if (!row) return null;

  const parsed = mapRow(row as ReportRow);
  if (!parsed) return null;

  // 포함된 아티클 일괄 조회
  const slugs: string[] = parsed.meta.articles ?? [];
  const { data: artRows } = await sb
    .from("magazine")
    .select("*")
    .in("slug", slugs)
    .eq("is_published", true);

  // slug 순서대로 정렬 + RAIL 파싱
  const artMap = new Map<string, MagazineArticle>();
  for (const a of (artRows ?? []) as { id: string; slug: string; corner: string; field: string | null; title: string; subtitle: string | null; excerpt: string | null; read_min: number | null; body_html: string; closing: string | null; created_at: string }[]) {
    let bodyHtml = a.body_html ?? "";
    let summary: string[] | undefined;
    let callout: string | undefined;
    const rm = bodyHtml.match(/^\s*<!--RAIL:([\s\S]*?)-->\s*/);
    if (rm) {
      try { const j = JSON.parse(rm[1]); summary = j.summary; callout = j.callout; } catch {}
      bodyHtml = bodyHtml.slice(rm[0].length);
    }
    artMap.set(a.slug, { id: a.id, slug: a.slug, corner: a.corner, field: a.field ?? undefined, title: a.title, subtitle: a.subtitle ?? undefined, excerpt: a.excerpt ?? undefined, readMin: a.read_min ?? undefined, bodyHtml, closing: a.closing ?? undefined, summary, callout, createdAt: a.created_at });
  }

  const articles = slugs.map((s) => artMap.get(s)).filter((a): a is MagazineArticle => !!a);

  return {
    slug: (row as ReportRow).slug,
    topic: (row as ReportRow).field ?? parsed.meta.topic ?? "",
    title: (row as ReportRow).title,
    subtitle: (row as ReportRow).subtitle ?? undefined,
    excerpt: (row as ReportRow).excerpt ?? undefined,
    intro: parsed.intro,
    articleSlugs: slugs,
    articles,
    createdAt: (row as ReportRow).created_at,
  };
}

export async function fetchReportSlugs(): Promise<string[]> {
  const sb = getSupabaseAdmin();
  if (!sb) return [];
  const { data } = await sb
    .from("magazine")
    .select("slug")
    .eq("corner", "report")
    .eq("is_published", true);
  return ((data ?? []) as { slug: string }[]).map((r) => r.slug);
}
