// 핫딜 자동수집 오케스트레이션:
//  수집 → 교차 dedup → (신규만) 페르소나 리라이트 → 대기풀 적재 → 드립 공개 → 활동 시뮬(조회·추천)
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { collectAll, fetchDealMeta, isFreebie, normalizeKey, type RawDeal } from "./sources";
import { categorize } from "./categorize";
import { personaFor } from "./personas";
import { rewriteDeal } from "./rewrite";
import { targetPublishedByNow, windowStartMs, MAX_BURST, isActiveHour, activityBoost } from "./dripConfig";
import { repackageDealUrl } from "./repackage";
import { isLocalAlive, apiRemaining, bumpApi } from "@/lib/automation/heartbeat";
import { PENDING_AUTHOR, API_POSTS_PER_RUN, isNightKST } from "@/lib/automation/policy";

const MAX_ENQUEUE_PER_RUN = 12; // 회차당 신규 적재 상한(수집량 제어). 리라이트는 드레이너가 별도 처리.

// 진단용(테스트). 매 실행 시작 시 초기화.
const _debug: Record<string, unknown> = {};

interface Summary {
  collected: number;
  inserted: number;
  released: number;
  viewed: number;
  liked: number;
}

// 보드 종류별로 라운드로빈 인터리브(hot,overseas,free,coupon 번갈아)
function interleaveByBoard(items: RawDeal[]): RawDeal[] {
  const order = ["hot", "event"];
  const groups = new Map<string, RawDeal[]>();
  for (const c of items) {
    const k = order.includes(c.boardType) ? c.boardType : "hot";
    (groups.get(k) ?? groups.set(k, []).get(k)!).push(c);
  }
  const lists = order.map((t) => groups.get(t) ?? []).filter((l) => l.length);
  const out: RawDeal[] = [];
  for (let i = 0; out.length < items.length; i++) {
    let any = false;
    for (const l of lists) {
      if (i < l.length) {
        out.push(l[i]);
        any = true;
      }
    }
    if (!any) break;
  }
  return out;
}

async function mapLimit<T, R>(items: T[], limit: number, fn: (t: T) => Promise<R>): Promise<R[]> {
  const out: R[] = [];
  for (let i = 0; i < items.length; i += limit) {
    out.push(...(await Promise.all(items.slice(i, i + limit).map(fn))));
  }
  return out;
}

// 1) 수집 + dedup + 신규 리라이트 → 대기풀(is_published=false) 적재
async function ingestNew(sb: NonNullable<ReturnType<typeof getSupabaseAdmin>>): Promise<{ collected: number; inserted: number }> {
  const candidates = await collectAll();
  if (candidates.length === 0) return { collected: 0, inserted: 0 };

  // 배치 내 중복(같은 딜 다중 소스) 제거 — 정규화 제목 기준 첫 글만
  const byKey = new Map<string, RawDeal>();
  for (const c of candidates) {
    const k = normalizeKey(c.title);
    if (!byKey.has(k)) byKey.set(k, c);
  }
  const uniq = [...byKey.values()];

  // 기존 DB와 대조 — slug 또는 정규화 제목 중복 스킵(최근 250건)
  const { data: recent } = await sb.from("board_deals").select("slug, title").order("created_at", { ascending: false }).limit(250);
  const seenSlug = new Set<string>();
  const seenKey = new Set<string>();
  for (const r of (recent as { slug: string | null; title: string }[]) ?? []) {
    if (r.slug) seenSlug.add(r.slug);
    seenKey.add(normalizeKey(r.title));
  }

  // 보드별 라운드로빈으로 섞기 — 한 보드(핫딜)만 먼저 소진되어 다른 보드가 굶지 않게
  const notSeen = uniq.filter((c) => !seenSlug.has(c.slug) && !seenKey.has(normalizeKey(c.title)));
  const fresh = interleaveByBoard(notSeen).slice(0, MAX_ENQUEUE_PER_RUN);
  if (fresh.length === 0) return { collected: candidates.length, inserted: 0 };

  let skippedNoLink = 0;
  let repackagedCount = 0;
  // 적재 단계는 LLM(앤트로픽)을 호출하지 않는다 — 원문 그대로 author='__pending__'로 대기.
  // 리라이트는 드레이너(로컬=맥스 / 서버=API)가 모드에 맞춰 별도 처리(rewritePendingViaApi / 로컬 스크립트).
  const mapped = await mapLimit(fresh, 4, async (c) => {
    // 먼저 글 속 "실제 딜" 추출 — 진짜 쇼핑몰 링크·이미지
    const meta = await fetchDealMeta(c.sourceUrl);
    // 실제 외부 링크를 못 뽑으면 게시 안 함(뽐뿌/루리웹 직링크 방지)
    if (!meta.dealUrl) {
      skippedNoLink++;
      return null;
    }
    // 무료 게임·앱 등은 어느 소스에서 왔든 '이벤트/쿠폰/적립' 보드로 라우팅
    const boardType = isFreebie(c.rawTitle, c.price) ? "event" : c.boardType;
    // 카테고리: 소스 강제값(해외직구) 우선, 없으면 매핑(루리웹 '게임S/W' 등 미매핑 방지)
    const category = c.forceCategory ?? categorize(c.title, c.category);
    const imageUrl = c.imageUrl ?? meta.image;
    // 재포장: 제휴사(지마켓·컬리·이마트·SSG) 링크면 우리 제휴링크로 교체(실패 시 원본 유지). sub1=slug로 귀속.
    const repackaged = await repackageDealUrl(meta.dealUrl, c.slug);
    if (repackaged) repackagedCount++;
    return {
      slug: c.slug,
      source: c.source,
      board_type: boardType,
      title: c.title, // 원문(리라이트 전) — 드레이너가 페르소나 말투로 교체
      shop: c.shop ?? null,
      category,
      price: c.price ?? null,
      shipping: c.shipping ?? null,
      image_url: imageUrl ?? null,
      source_url: repackaged ?? meta.dealUrl,
      original_url: meta.dealUrl,
      body: c.body ?? null, // 원문 설명 — 드레이너 입력
      author: PENDING_AUTHOR, // 리라이트 대기 표식(공개 제외)
      is_published: false, // 대기풀 — 리라이트 완료분만 드립 공개
    };
  });
  const rows = mapped.filter((r): r is NonNullable<typeof r> => r !== null);
  _debug.skippedNoLink = skippedNoLink;
  _debug.repackaged = repackagedCount;
  if (rows.length === 0) return { collected: candidates.length, inserted: 0 };

  const { error } = await sb.from("board_deals").upsert(rows, { onConflict: "slug" });
  if (error) {
    _debug.insErr = error.message;
    return { collected: candidates.length, inserted: 0 };
  }
  return { collected: candidates.length, inserted: rows.length };
}

// 대기풀(author='__pending__')을 API로 소량 리라이트 — 창 닫힘(API) 모드 전용.
// 페르소나는 slug로 재계산(고정 매핑). rewriteDeal은 키 없으면 폴백(원문 정리)으로 동작.
async function rewritePendingViaApi(sb: NonNullable<ReturnType<typeof getSupabaseAdmin>>, limit: number): Promise<number> {
  if (limit <= 0) return 0;
  const { data } = await sb
    .from("board_deals")
    .select("id, slug, title, body, shop, price")
    .eq("author", PENDING_AUTHOR)
    .order("created_at", { ascending: true })
    .limit(limit);
  const rows = (data as Array<{ id: string; slug: string; title: string; body: string | null; shop: string | null; price: number | null }>) ?? [];
  let n = 0;
  for (const r of rows) {
    const persona = personaFor(r.slug);
    const rw = await rewriteDeal({ title: r.title, body: r.body ?? undefined, shop: r.shop ?? undefined, price: r.price ?? undefined }, persona);
    const { error } = await sb.from("board_deals").update({ title: rw.title, body: rw.body || null, author: persona.nick }).eq("id", r.id);
    if (!error) n++;
  }
  return n;
}

// 대기풀에서 조건에 맞는 글 N개를 공개 — 공개시각 0~10분 분산(무더기 방지), 시작 조회수 소량.
async function publishPending(
  sb: NonNullable<ReturnType<typeof getSupabaseAdmin>>,
  filter: { boardType?: string; category?: string | null },
  count: number
): Promise<number> {
  if (count <= 0) return 0;
  let q = sb
    .from("board_deals")
    .select("id")
    .eq("is_published", false)
    .not("source", "is", null) // 크롤 대기분만(유저 제보는 관리자 승인)
    .neq("author", PENDING_AUTHOR) // 리라이트 완료분만 공개(대기 표식 제외)
    .order("created_at", { ascending: true })
    .limit(count);
  if (filter.boardType) q = q.eq("board_type", filter.boardType);
  if (filter.category) q = q.eq("category", filter.category);
  const { data } = await q;
  const ids = ((data as { id: string }[]) ?? []).map((r) => r.id);
  let n = 0;
  for (const id of ids) {
    const seed = 1 + Math.floor(Math.random() * 4); // 시작 조회수 1~4
    const offset = Math.floor(Math.random() * 10) * 60_000; // 0~10분 분산(조금씩 자주)
    const created = new Date(Date.now() - offset).toISOString();
    const { error } = await sb.from("board_deals").update({ is_published: true, created_at: created, views: seed }).eq("id", id);
    if (!error) n++;
  }
  return n;
}

// 대기풀에서 oldest N개를 "마지막 공개~현재" 구간 안의 랜덤 시각으로 공개(시간대 균등 + 구간 내 랜덤).
async function publishRate(sb: NonNullable<ReturnType<typeof getSupabaseAdmin>>, count: number): Promise<number> {
  if (count <= 0) return 0;
  const { data } = await sb
    .from("board_deals")
    .select("id")
    .eq("is_published", false)
    .not("source", "is", null) // 크롤 대기분만(유저 제보는 관리자 승인)
    .neq("author", PENDING_AUTHOR) // 리라이트 완료분만 공개(대기 표식 제외)
    .order("created_at", { ascending: true })
    .limit(count);
  const ids = ((data as { id: string }[]) ?? []).map((r) => r.id);
  if (ids.length === 0) return 0;

  // 분산 구간: 마지막 공개시각(오늘 창 이후) ~ 현재
  const now = Date.now();
  const { data: last } = await sb
    .from("board_deals")
    .select("created_at")
    .eq("is_published", true)
    .not("source", "is", null)
    .order("created_at", { ascending: false })
    .limit(1);
  const lastIso = (last as { created_at: string }[] | null)?.[0]?.created_at;
  const lastMs = lastIso ? Math.max(new Date(lastIso).getTime(), windowStartMs(now)) : windowStartMs(now);
  const span = Math.max(60_000, now - lastMs); // 최소 1분
  // 구간 내 랜덤 시각 N개(오름차순) → oldest 글이 이른 시각
  const times = Array.from({ length: ids.length }, () => lastMs + Math.random() * span).sort((a, b) => a - b);

  let n = 0;
  for (let i = 0; i < ids.length; i++) {
    const seed = 1 + Math.floor(Math.random() * 4); // 시작 조회수 1~4
    const created = new Date(times[i]).toISOString();
    const { error } = await sb.from("board_deals").update({ is_published: true, created_at: created, views: seed }).eq("id", ids[i]);
    if (!error) n++;
  }
  return n;
}

// 2) 드립 공개.
//  - override(테스트): 게이트 무시하고 oldest N개 즉시 공개.
//  - 평소: 활동시간 + 누적 목표(하루 DAILY_TARGET개를 시간대 균등). 밀린 만큼만 랜덤 시각으로 공개.
async function releaseDrip(sb: NonNullable<ReturnType<typeof getSupabaseAdmin>>, override?: number): Promise<number> {
  if (typeof override === "number" && override > 0) {
    return publishPending(sb, {}, Math.min(override, 40));
  }
  if (!isActiveHour()) return 0;

  // 오늘(창 시작 이후) 이미 공개된 크롤 글 수
  const { count: publishedToday } = await sb
    .from("board_deals")
    .select("id", { count: "exact", head: true })
    .eq("is_published", true)
    .not("source", "is", null)
    .gte("created_at", new Date(windowStartMs()).toISOString());

  const target = targetPublishedByNow();
  const due = Math.min(MAX_BURST, target - (publishedToday ?? 0));
  _debug.target = target;
  _debug.publishedToday = publishedToday ?? 0;
  _debug.due = due;
  if (due <= 0) return 0;
  return await publishRate(sb, due);
}

// 3) 활동 시뮬 — 최근 글의 조회수 상승 + 가끔 추천(항상 조회수 < 추천수 역전 방지)
async function simulateActivity(sb: NonNullable<ReturnType<typeof getSupabaseAdmin>>): Promise<{ viewed: number; liked: number }> {
  const boost = activityBoost();
  const { data } = await sb
    .from("board_deals")
    .select("id, views, votes, created_at")
    .eq("is_published", true)
    .order("created_at", { ascending: false })
    .limit(40);
  const rows = (data as { id: string; views: number | null; votes: number | null; created_at: string }[]) ?? [];
  const now = Date.now();
  let viewed = 0;
  let liked = 0;
  for (const r of rows) {
    const ageH = (now - new Date(r.created_at).getTime()) / 3_600_000;
    const pView = (ageH < 6 ? 0.8 : ageH < 24 ? 0.4 : 0.12) * boost;
    const pLike = (ageH < 6 ? 0.1 : ageH < 24 ? 0.05 : 0.015) * boost;
    let dv = 0;
    let dvote = 0;
    if (Math.random() < pView) dv = (ageH < 6 ? 1 : 0) + 1 + Math.floor(Math.random() * 3); // 1~4(신상 가중)
    const views = r.views ?? 0;
    const votes = r.votes ?? 0;
    if (Math.random() < pLike && views + dv > votes + 1) dvote = 1; // 추천은 조회수보다 적게 유지
    if (dv || dvote) {
      const { error } = await sb.from("board_deals").update({ views: views + dv, votes: votes + dvote }).eq("id", r.id);
      if (!error) {
        if (dv) viewed++;
        if (dvote) liked++;
      }
    }
  }
  return { viewed, liked };
}

// 기존 게시분 일괄 재포장 — 아직 원작성자 링크인 쿠팡 딜(source_url == original_url)을
// 우리 파트너스 링크로 교체. 멱등: 한 번 교체되면 source_url != original_url 이라 재처리 안 됨.
async function repackageBacklog(
  sb: NonNullable<ReturnType<typeof getSupabaseAdmin>>,
  limit: number
): Promise<number> {
  if (limit <= 0) return 0;
  const { data } = await sb
    .from("board_deals")
    .select("id, source_url, original_url")
    .ilike("source_url", "%coupang.com%")
    .order("created_at", { ascending: false })
    .limit(Math.min(limit, 100));
  const rows = (data as { id: string; source_url: string; original_url: string | null }[]) ?? [];
  let n = 0;
  for (const r of rows) {
    // 이미 재포장된 행(source_url != original_url)은 건너뜀
    if (r.original_url && r.source_url !== r.original_url) continue;
    const ours = await repackageDealUrl(r.source_url);
    if (!ours) continue;
    const { error } = await sb
      .from("board_deals")
      .update({ source_url: ours, original_url: r.original_url ?? r.source_url })
      .eq("id", r.id);
    if (!error) n++;
  }
  return n;
}

// 크롤/자동시딩 글만 삭제(유저 제보·관리자 글 보존). reset 테스트용.
async function resetCrawl(sb: NonNullable<ReturnType<typeof getSupabaseAdmin>>): Promise<number> {
  let n = 0;
  // ① 크롤 글(source 있음)
  const d1 = await sb.from("board_deals").delete().is("submitter_id", null).not("source", "is", null).select("id");
  if (d1.error) _debug.resetErr1 = d1.error.message;
  else n += d1.data?.length ?? 0;
  // ② 구 자동시딩(slug hot-)
  const d2 = await sb.from("board_deals").delete().is("submitter_id", null).like("slug", "hot-%").select("id");
  if (d2.error) _debug.resetErr2 = d2.error.message;
  else n += d2.data?.length ?? 0;
  return n;
}

export async function runBoardIngest(opts?: { releaseOverride?: number; reset?: boolean; repackageBacklog?: number }): Promise<
  Summary & { purged?: number; repackaged?: number; debug?: Record<string, unknown> }
> {
  for (const k of Object.keys(_debug)) delete _debug[k];
  const sb = getSupabaseAdmin();
  if (!sb) return { collected: 0, inserted: 0, released: 0, viewed: 0, liked: 0 };
  const purged = opts?.reset ? await resetCrawl(sb) : 0;
  const backfilled = opts?.repackageBacklog ? await repackageBacklog(sb, opts.repackageBacklog) : 0;
  const { collected, inserted } = await ingestNew(sb);

  // 리라이트 라우팅: 창 열림(로컬=맥스)이면 로컬 스크립트가 대기풀을 소진하므로 API 미사용.
  // 창 닫힘이면 API로 소량만(시간당 상한·일일 상한·새벽 정지).
  const localAlive = await isLocalAlive(sb);
  let apiRewritten = 0;
  if (!localAlive && !isNightKST()) {
    const budget = Math.min(API_POSTS_PER_RUN, await apiRemaining(sb, "posts"));
    apiRewritten = await rewritePendingViaApi(sb, budget);
    await bumpApi(sb, "posts", apiRewritten);
  }
  _debug.mode = localAlive ? "local(max)" : isNightKST() ? "api(night-stop)" : "api";
  _debug.apiRewritten = apiRewritten;

  const released = await releaseDrip(sb, opts?.releaseOverride);
  const { viewed, liked } = await simulateActivity(sb);
  return { collected, inserted, released, viewed, liked, purged, repackaged: backfilled, debug: _debug };
}
