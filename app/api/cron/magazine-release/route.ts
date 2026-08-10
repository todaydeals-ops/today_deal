// 매거진 자동 공개 — 비축 초안을 코너 골고루 매일 N편 공개.
// 로컬 Windows 작업 스케줄러(run-magazine-release.cmd)가 PC 상태에 따라 멈추는 문제를 없애려고
// Vercel Cron으로 옮긴 것. 게이트 로직은 scripts/magazine-release.mjs와 동일 기준.
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { SUB_MEDIA_FIELDS, SUB_MEDIA_CORNERS } from "@/lib/data/magazine";

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

  // 기본 하루 1편. 서브 미디어 3개가 주 6일을 채우게 되면서 메인까지 2편씩 낼 이유가 없어졌다.
  // 리저브 소진 속도를 절반으로 늦춰 집필 여력을 서브 미디어 쪽에 돌린다. ?n=으로 덮어쓴다(상한 5).
  const count = Math.max(1, Math.min(5, Number(new URL(request.url).searchParams.get("n")) || 1));

  const { data } = await sb
    .from("magazine")
    .select("slug,corner,title,read_min,body_html,created_at")
    .eq("is_published", false)
    .neq("corner", "report")
    // 서브 미디어(잠자리·알약·성분)는 아래 SUB_SCHEDULE의 요일 스케줄로만 공개한다.
    // 여기서 "수면·침구"만 빼던 시절, 알약·성분 리저브가 메인 풀로 새어
    // 재고 최다 코너 우선 로직에 매번 이겨버렸다(일요일 발행·요일 무시).
    // 그 사이 메인 자체 리저브는 repair를 빼고 한 편도 못 나갔다.
    .not("field", "in", `("${SUB_MEDIA_FIELDS.join('","')}")`)
    // AS연구소도 별도 요일 스케줄로 나가므로 메인 풀에서 뺀다(corner 격리).
    .not("corner", "in", `("${SUB_MEDIA_CORNERS.join('","')}")`)
    .order("created_at", { ascending: true });

  const drafts = (data ?? []) as Row[];
  const byCorner: Record<string, Row[]> = {};
  const blocked: string[] = [];
  for (const a of drafts) {
    const g = inspect(a);
    if (!g.ok) { blocked.push(`${a.slug}: ${g.reasons.join(", ")}`); continue; }
    (byCorner[a.corner] ||= []).push(a);
  }

  // 같은 코너에 편중되지 않게, 뽑을 때는 재고가 가장 많은 코너가 가져간다.
  // repair(AS셀프체크)는 AS연구소로 분리돼 위 쿼리에서 이미 빠졌다 — 여기 남은 건 메인 3코너뿐.
  const OTHERS = ["factcheck", "smartguide", "trendlab"];
  const pickFrom = (pool: string[]): Row | null => {
    const avail = pool.filter((c) => byCorner[c]?.length > 0);
    if (!avail.length) return null;
    avail.sort((a, b) => byCorner[b].length - byCorner[a].length);
    return byCorner[avail[0]].shift() ?? null;
  };

  const picked: Row[] = [];
  while (picked.length < count) {
    const row = pickFrom(OTHERS);
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

  // ── 서브 미디어 예약 발행 — 각자 정해진 요일(KST)에 1편씩 공개 ──
  // 월 알약 / 화 AS / 수 성분 / 목 알약 / 금 잠자리 / 토 성분 / 일 AS.
  // 리저브는 created_at 오름차순(분류 인터리브 순서로 미리 세팅)이라 오래된 것부터 나간다.
  const kstDow = new Date(Date.now() + 9 * 3600 * 1000).getUTCDay(); // 0일 1월 2화 3수 4목 5금 6토
  // field 또는 corner 하나로 대상을 고른다. AS연구소만 corner 기준이다.
  const SUB_SCHEDULE: { field?: string; corner?: string; label: string; days: number[] }[] = [
    { field: "수면·침구", label: "잠자리연구소", days: [5] },      // 93편 목표 달성 → 금 1회로 축소
    { field: "건강기능식품", label: "알약연구소", days: [1, 4] },   // 월·목
    { field: "뷰티·성분", label: "성분연구소", days: [3, 6] },      // 수·토
    { corner: "repair", label: "AS연구소", days: [2, 0] },         // 화·일 (잠자리에서 넘겨받은 화요일)
  ];
  const subReleased: string[] = [];
  for (const s of SUB_SCHEDULE) {
    if (!s.days.includes(kstDow)) continue;
    let sq = sb.from("magazine").select("slug,body_html").eq("is_published", false);
    sq = s.corner ? sq.eq("corner", s.corner) : sq.eq("field", s.field!);
    const { data: subDrafts } = await sq.order("created_at", { ascending: true }).limit(5);
    for (const a of (subDrafts ?? []) as { slug: string; body_html: string }[]) {
      const plain = (a.body_html || "").replace(/<!--[\s\S]*?-->/g, "").replace(/<[^>]+>/g, "").trim().length;
      if (plain < 1500) continue; // 분량 게이트(검증필 원고라 통상 통과)
      const { error } = await sb
        .from("magazine")
        .update({ is_published: true, created_at: new Date().toISOString() })
        .eq("slug", a.slug);
      if (!error) { subReleased.push(`[${s.label}] ${a.slug}`); break; } // 해당 요일 1편만
    }
  }
  const sleepReleased = subReleased; // 응답 하위호환

  const remaining = drafts.length - released.length;
  return Response.json({
    ok: true,
    released: released.length,
    titles: released,
    sleepReleased,
    sleepReleasedCount: sleepReleased.length,
    blocked: blocked.length,
    blockedDetail: blocked.slice(0, 5),
    remainingDrafts: remaining,
  });
}
