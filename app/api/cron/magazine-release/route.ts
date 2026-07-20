// 매거진 자동 공개 — 비축 초안을 코너 골고루 매일 N편 공개.
// 로컬 Windows 작업 스케줄러(run-magazine-release.cmd)가 PC 상태에 따라 멈추는 문제를 없애려고
// Vercel Cron으로 옮긴 것. 게이트 로직은 scripts/magazine-release.mjs와 동일 기준.
import { getSupabaseAdmin } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function authorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  if (request.headers.get("authorization") === `Bearer ${secret}`) return true;
  return new URL(request.url).searchParams.get("key") === secret;
}

// ── 검수 게이트 ── 하나라도 걸리면 공개 차단(저품질 자동발행 방지)
const CJK = /[㐀-䶿一-鿿Ѐ-ӿ぀-ゟ゠-ヺヽ-ヿ]/;
interface Row { slug: string; corner: string; title: string; read_min: number | null; body_html: string; created_at: string }

function inspect(row: Row): { ok: boolean; reasons: string[] } {
  const body = row.body_html || "";
  const plain = body.replace(/<!--[\s\S]*?-->/g, "").replace(/<[^>]+>/g, "").trim().length;
  const reasons: string[] = [];
  if ((row.read_min || 0) < 7) reasons.push(`read_min<7(${row.read_min ?? 0})`);
  if (plain < 1200) reasons.push(`본문<1200자(${plain})`);
  if (CJK.test(body)) reasons.push("한자·외국문자 혼입");
  const hasDesign = /DECISION TREE/.test(body) || /grid-template-columns/.test(body) || /rgba\(22,20,15,0\.12\)/.test(body);
  if (!hasDesign) reasons.push("디자인블록 없음");
  return { ok: reasons.length === 0, reasons };
}

export async function GET(request: Request): Promise<Response> {
  if (!authorized(request)) return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const sb = getSupabaseAdmin();
  if (!sb) return Response.json({ ok: false, error: "Supabase 미설정" }, { status: 500 });

  const count = Math.max(1, Math.min(5, Number(new URL(request.url).searchParams.get("n")) || 1));

  const { data } = await sb
    .from("magazine")
    .select("slug,corner,title,read_min,body_html,created_at")
    .eq("is_published", false)
    .neq("corner", "report")
    .order("created_at", { ascending: true });

  const drafts = (data ?? []) as Row[];
  const byCorner: Record<string, Row[]> = {};
  const blocked: string[] = [];
  for (const a of drafts) {
    const g = inspect(a);
    if (!g.ok) { blocked.push(`${a.slug}: ${g.reasons.join(", ")}`); continue; }
    (byCorner[a.corner] ||= []).push(a);
  }

  // 재고가 많이 남은 코너부터 한 편씩 — 특정 코너만 빠르게 소진되는 걸 방지
  const picked: Row[] = [];
  while (picked.length < count) {
    const corners = Object.keys(byCorner).filter((c) => byCorner[c].length > 0);
    if (!corners.length) break;
    corners.sort((a, b) => byCorner[b].length - byCorner[a].length);
    const row = byCorner[corners[0]].shift();
    if (row) picked.push(row);
  }

  const released: string[] = [];
  for (const a of picked) {
    const { error } = await sb
      .from("magazine")
      .update({ is_published: true, created_at: new Date().toISOString() })
      .eq("slug", a.slug);
    if (!error) released.push(`[${a.corner}] ${a.slug}`);
  }

  const remaining = drafts.length - released.length;
  return Response.json({
    ok: true,
    released: released.length,
    titles: released,
    blocked: blocked.length,
    blockedDetail: blocked.slice(0, 5),
    remainingDrafts: remaining,
  });
}
