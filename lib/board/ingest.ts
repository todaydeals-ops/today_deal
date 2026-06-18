// 핫딜 자동수집 오케스트레이션:
//  수집 → 교차 dedup → (신규만) 페르소나 리라이트 → 대기풀 적재 → 드립 공개 → 활동 시뮬(조회·추천)
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { collectAll, fetchDealMeta, isFreebie, normalizeKey, type RawDeal } from "./sources";
import { categorize } from "./categorize";
import { personaFor } from "./personas";
import { rewriteDeal } from "./rewrite";
import { perRunCap, isActiveHour, activityBoost } from "./dripConfig";

const MAX_REWRITE_PER_RUN = 12; // 회차당 신규 리라이트 상한(지연·비용 제어)

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
  const order = ["hot", "overseas", "free", "coupon"];
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
  const fresh = interleaveByBoard(notSeen).slice(0, MAX_REWRITE_PER_RUN);
  if (fresh.length === 0) return { collected: candidates.length, inserted: 0 };

  let skippedNoLink = 0;
  const mapped = await mapLimit(fresh, 4, async (c) => {
    // 먼저 글 속 "실제 딜" 추출 — 진짜 쇼핑몰 링크·이미지
    const meta = await fetchDealMeta(c.sourceUrl);
    // 실제 외부 링크를 못 뽑으면 게시 안 함(뽐뿌/루리웹 직링크 방지) — LLM 호출 전에 스킵
    if (!meta.dealUrl) {
      skippedNoLink++;
      return null;
    }
    const persona = personaFor(c.slug);
    // 무료 게임·앱 등은 어느 소스에서 왔든 '무료/이벤트' 보드로 라우팅
    const boardType = isFreebie(c.rawTitle, c.price) ? "free" : c.boardType;
    // 카테고리는 모든 보드에서 매핑(루리웹 원본 '게임S/W' 등 미매핑 노출 방지)
    const category = categorize(c.title, c.category);
    const rw = await rewriteDeal({ title: c.title, body: c.body, shop: c.shop, price: c.price }, persona);
    const imageUrl = c.imageUrl ?? meta.image;
    return {
      slug: c.slug,
      source: c.source,
      board_type: boardType,
      title: rw.title,
      shop: c.shop ?? null,
      category,
      price: c.price ?? null,
      shipping: c.shipping ?? null,
      image_url: imageUrl ?? null,
      source_url: meta.dealUrl,
      original_url: meta.dealUrl,
      body: rw.body || null,
      author: persona.nick,
      is_published: false, // 대기풀 — 드립으로 공개
    };
  });
  const rows = mapped.filter((r): r is NonNullable<typeof r> => r !== null);
  _debug.skippedNoLink = skippedNoLink;
  if (rows.length === 0) return { collected: candidates.length, inserted: 0 };

  const { error } = await sb.from("board_deals").upsert(rows, { onConflict: "slug" });
  if (error) {
    _debug.insErr = error.message;
    return { collected: candidates.length, inserted: 0 };
  }
  return { collected: candidates.length, inserted: rows.length };
}

// 2) 드립 공개 — 활동시간대에만, 회차당 perRunCap개. 공개 시각=now(신선하게), 시작 조회수 소량 부여.
//    override 지정 시(수동 테스트) 활동시간 무시하고 그 수만큼 공개.
async function releaseDrip(sb: NonNullable<ReturnType<typeof getSupabaseAdmin>>, override?: number): Promise<number> {
  let cap: number;
  if (typeof override === "number" && override > 0) {
    cap = Math.min(override, 30);
  } else {
    if (!isActiveHour()) return 0;
    cap = perRunCap();
  }
  const { data, error: selErr } = await sb
    .from("board_deals")
    .select("id")
    .eq("is_published", false)
    .not("source", "is", null) // 크롤 대기분만(유저 제보는 관리자 승인)
    .order("created_at", { ascending: true })
    .limit(cap);
  if (selErr) _debug.relSel = selErr.message;
  const ids = ((data as { id: string }[]) ?? []).map((r) => r.id);
  _debug.relFound = ids.length;
  let released = 0;
  for (const id of ids) {
    const seed = 1 + Math.floor(Math.random() * 4); // 시작 조회수 1~4
    const { error } = await sb
      .from("board_deals")
      .update({ is_published: true, created_at: new Date().toISOString(), views: seed })
      .eq("id", id);
    if (error) _debug.relUpd = error.message;
    else released++;
  }
  return released;
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

export async function runBoardIngest(opts?: { releaseOverride?: number; reset?: boolean }): Promise<
  Summary & { purged?: number; debug?: Record<string, unknown> }
> {
  for (const k of Object.keys(_debug)) delete _debug[k];
  const sb = getSupabaseAdmin();
  if (!sb) return { collected: 0, inserted: 0, released: 0, viewed: 0, liked: 0 };
  const purged = opts?.reset ? await resetCrawl(sb) : 0;
  const { collected, inserted } = await ingestNew(sb);
  const released = await releaseDrip(sb, opts?.releaseOverride);
  const { viewed, liked } = await simulateActivity(sb);
  return { collected, inserted, released, viewed, liked, purged, debug: _debug };
}
