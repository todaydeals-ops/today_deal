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
  // RAIL 주석 제외 후 본문만 검사 — 이미지 크레딧의 외국어 실명은 정상 표기라 오탐을 막는다.
  const bodyOnly = body.replace(/<!--[\s\S]*?-->/g, "");
  const plain = bodyOnly.replace(/<[^>]+>/g, "").trim().length;
  const reasons: string[] = [];
  if ((row.read_min || 0) < 7) reasons.push(`read_min<7(${row.read_min ?? 0})`);
  if (plain < 1200) reasons.push(`본문<1200자(${plain})`);
  if (CJK.test(bodyOnly)) reasons.push("한자·외국문자 혼입");
  const hasDesign = /DECISION TREE/.test(bodyOnly) || /grid-template-columns/.test(bodyOnly) || /rgba\(22,20,15,0\.12\)/.test(bodyOnly);
  if (!hasDesign) reasons.push("디자인블록 없음");
  return { ok: reasons.length === 0, reasons };
}

export async function GET(request: Request): Promise<Response> {
  if (!authorized(request)) return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const sb = getSupabaseAdmin();
  if (!sb) return Response.json({ ok: false, error: "Supabase 미설정" }, { status: 500 });

  // 기본 하루 2편. ?n=으로 덮어쓸 수 있고 상한은 5편.
  const count = Math.max(1, Math.min(5, Number(new URL(request.url).searchParams.get("n")) || 2));

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

  // 하루 2편 = AS셀프체크(repair) 1편 + 나머지 3코너 중 1편.
  // AS가 유입의 핵심이라 매일 1편은 반드시 나가야 하고, 나머지 한 자리는
  // 재고가 가장 많은 코너가 가져가 편중을 막는다.
  const OTHERS = ["factcheck", "smartguide", "trendlab"];
  const pickFrom = (pool: string[]): Row | null => {
    const avail = pool.filter((c) => byCorner[c]?.length > 0);
    if (!avail.length) return null;
    avail.sort((a, b) => byCorner[b].length - byCorner[a].length);
    return byCorner[avail[0]].shift() ?? null;
  };

  const picked: Row[] = [];
  const repairFirst = pickFrom(["repair"]); // 1순위는 언제나 AS
  if (repairFirst) picked.push(repairFirst);
  while (picked.length < count) {
    // AS 재고가 비면 나머지로 채우고, 나머지가 비면 AS를 한 편 더 낸다
    const row = pickFrom(OTHERS) ?? pickFrom(["repair"]);
    if (!row) break;
    picked.push(row);
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
