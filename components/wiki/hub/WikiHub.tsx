"use client";
// 생활백과 허브 본체 — 2026-10-27 리뉴얼(시안: 오늘의딜 생활백과.dc.html).
// 헤드(소개+검색 · 다가오는 마감·시작) → 대분류 카드 3 → 필터 바(소분류 칩 · 상태) → 소분류별 그룹 리스트 / 검색 결과 / 빈 상태.
//
// ★SEO: 225개 항목의 링크가 전부 서버 렌더(초기 HTML)에 나오도록, 기본 화면은 "전체"(대분류 선택 없음)다.
//   시안은 처음부터 "신청·환급 달력"이 선택돼 있지만, 그러면 세일 달력 19개·영상 속 그 제품 5개 링크가 초기 HTML 에 없다.
//   대분류 카드를 다시 누르면 선택이 풀려 전체로 돌아온다.
// ★상태·D-day 는 날짜가 지나면 바뀐다. 서버는 schedule 만 넘기고(page.tsx), 여기서 오늘(KST)로 계산한다.
//   하이드레이션: 첫 렌더는 서버가 구울 때의 오늘(props.today)로 그린다 → 서버 HTML 과 정확히 같다.
//   마운트 뒤 effect 에서 브라우저의 오늘로 바꾸고(날짜가 같으면 state 가 안 바뀌어 리렌더도 없다), 탭이 다시 보일 때마다 한 번 더 맞춘다.
//   그래서 suppressHydrationWarning 은 쓰지 않는다 — 어긋나는 값이 없다.
// ★필터·검색은 전부 클라이언트 상태다(쿼리 파라미터를 읽지 않는다 → 페이지는 정적/ISR 그대로).
//   다만 다른 화면이 걸어 둔 앵커(`/wiki#sale` · `/wiki#apply-tax` …)는 살아 있어야 해서, 해시가 오면 해당 대분류·소분류를 골라 준다.
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { STATUS_LABEL, STATUS_ORDER, ddayOf, kstTodayIso, statusAt, whenText, type WikiStatus } from "@/lib/wiki/status";
import s from "@/app/wiki/wiki-hub.module.css";
import { buildIndex, searchItems } from "./search";
import type { HubData, HubItem, TopKey } from "./types";

const ALL = "전체";
type StatusFilter = WikiStatus | "all";
interface Row { it: HubItem; st: WikiStatus | null }
interface Group { key: string; id: string; name: string; total: number; countLabel: string; rows: Row[]; more: boolean }

const BADGE: Record<WikiStatus, string> = { live: s.stLive, soon: s.stSoon, tba: s.stTba, always: s.stAlways, closed: s.stClosed };
const DOT: Record<WikiStatus, string> = { live: s.dLive, soon: s.dSoon, tba: s.dTba, always: s.dAlways, closed: s.dClosed };

const PH_LONG = "제도·세일 이름으로 찾기 (예: 연말정산, 숙박세일)";
const PH_SHORT = "제도·세일 이름으로 찾기";
const UPCOMING_N = 5;

const md = (iso: string) => `${iso.slice(5, 7)}.${iso.slice(8, 10)}`;

export default function WikiHub({ data, today: serverToday }: { data: HubData; today: string }) {
  const { tops, items } = data;

  const [top, setTop] = useState<TopKey | null>(null); // null = 전체(대분류 선택 없음)
  const [sub, setSub] = useState<string>(ALL);
  const [status, setStatus] = useState<StatusFilter>("all");
  const [q, setQ] = useState("");
  const [today, setToday] = useState(serverToday);
  const [short, setShort] = useState(false); // 모바일이면 검색창 안내 문구를 줄인다(서버 렌더는 데스크톱 문구)
  const filtersRef = useRef<HTMLElement>(null);
  const pendingScroll = useRef<string | null>(null);

  // ── 오늘(KST) 맞추기 ──
  useEffect(() => {
    const sync = () => setToday(kstTodayIso());
    sync();
    document.addEventListener("visibilitychange", sync);
    return () => document.removeEventListener("visibilitychange", sync);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 760px)");
    const f = () => setShort(mq.matches);
    f();
    mq.addEventListener("change", f);
    return () => mq.removeEventListener("change", f);
  }, []);

  // ── 파생 데이터 ──
  const subLabel = useMemo(() => new Map(tops.flatMap((t) => t.subs.map((sb) => [sb.key, sb.label] as const))), [tops]);
  const topLabel = useMemo(() => new Map(tops.map((t) => [t.key, t.label] as const)), [tops]);
  const rows: Row[] = useMemo(() => items.map((it) => ({ it, st: statusAt(it.sch, today) })), [items, today]);
  const rowBySlug = useMemo(() => new Map(rows.map((r) => [r.it.slug, r] as const)), [rows]);
  const rowsByGroup = useMemo(() => {
    const m = new Map<string, Row[]>();
    for (const r of rows) m.set(r.it.g, [...(m.get(r.it.g) ?? []), r]);
    return m;
  }, [rows]);
  const index = useMemo(() => buildIndex(items, (it) => subLabel.get(it.g) ?? ""), [items, subLabel]);

  const terms = q.trim();
  const stOk = useCallback((st: WikiStatus | null) => status === "all" || st === status, [status]);

  const groups: Group[] = useMemo(() => {
    if (terms) {
      const hit = searchItems(index, terms)
        .map((it) => rowBySlug.get(it.slug)!)
        .filter((r) => stOk(r.st));
      return hit.length
        ? [{ key: "search", id: "wiki-search-results", name: "검색 결과", total: hit.length, countLabel: `${hit.length}건`, rows: hit, more: false }]
        : [];
    }
    const out: Group[] = [];
    for (const t of tops) {
      if (top && t.key !== top) continue;
      for (const sb of t.subs) {
        if (sub !== ALL && sub !== sb.key) continue;
        const rs = (rowsByGroup.get(sb.key) ?? []).filter((r) => stOk(r.st));
        if (!rs.length) continue;
        out.push({ key: sb.key, id: sb.id, name: sb.label, total: sb.count, countLabel: `${sb.count}개`, rows: rs, more: sb.count > rs.length });
      }
    }
    return out;
  }, [terms, index, rowBySlug, stOk, tops, top, sub, rowsByGroup]);

  const shown = groups.reduce((n, g) => n + g.rows.length, 0);
  const isEmpty = groups.length === 0;

  // 다가오는 마감·시작: 시작 전이면 시작일, 진행 중이면 끝나는 날을 기준으로 가까운 순 5건(시안의 행 구성).
  const upcoming = useMemo(() => {
    const out: { slug: string; title: string; d: string; date: string; cat: string; at: string }[] = [];
    for (const { it, st } of rows) {
      if (it.sch.kind !== "dated" || (st !== "soon" && st !== "live")) continue;
      const dd = ddayOf(it.sch, today);
      if (!dd) continue;
      const start = it.sch.startsAt!, end = it.sch.endsAt ?? start;
      const at = st === "soon" ? start : end;
      const title = start === end ? it.title : st === "soon" ? `${it.title} 시작` : `${it.title} ${it.top === "sale" ? "종료" : "마감"}`;
      out.push({ slug: it.slug, title, d: dd.d, date: md(at), cat: `${topLabel.get(it.top) ?? ""} · ${subLabel.get(it.g) ?? ""}`, at });
    }
    out.sort((a, b) => (a.at < b.at ? -1 : a.at > b.at ? 1 : 0));
    return out.slice(0, UPCOMING_N);
  }, [rows, today, topLabel, subLabel]);

  // 소분류 칩: [전체, ...소분류]. 대분류를 골랐고 소분류가 1개뿐이면 전체만(시안).
  const curTop = top ? tops.find((t) => t.key === top) ?? null : null;
  const subChips = [
    { key: ALL, label: "전체", count: curTop ? curTop.count : items.length },
    ...(curTop ? (curTop.subs.length > 1 ? curTop.subs : []) : tops.flatMap((t) => t.subs)),
  ];

  // ── 다른 화면의 앵커 링크(`/wiki#sale` · `/wiki#apply-tax`)를 상태로 옮긴다 ──
  const applyHash = useCallback(
    (raw: string) => {
      let id = raw.replace(/^#/, "");
      try { id = decodeURIComponent(id); } catch { /* 그대로 쓴다 */ }
      if (!id) return;
      const t = tops.find((x) => x.key === id);
      if (t) {
        setTop(t.key); setSub(ALL); setStatus("all"); setQ("");
        pendingScroll.current = id;
        return;
      }
      for (const tp of tops) {
        const sb = tp.subs.find((x) => x.id === id);
        if (sb) {
          setTop(tp.key); setSub(sb.key); setStatus("all"); setQ("");
          pendingScroll.current = id;
          return;
        }
      }
    },
    [tops],
  );

  useEffect(() => {
    applyHash(window.location.hash);
    const onHash = () => applyHash(window.location.hash);
    // next/link 의 같은 쪽 해시 이동은 hashchange 를 일으키지 않으므로 클릭을 직접 본다(헤더 메뉴의 "신청·환급 달력" 등).
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a || (a.target && a.target !== "_self")) return;
      const u = new URL(a.href, window.location.href);
      if (u.origin !== window.location.origin || !u.hash) return;
      if (u.pathname.replace(/\/$/, "") !== window.location.pathname.replace(/\/$/, "")) return;
      applyHash(u.hash);
    };
    window.addEventListener("hashchange", onHash);
    document.addEventListener("click", onClick, true);
    return () => {
      window.removeEventListener("hashchange", onHash);
      document.removeEventListener("click", onClick, true);
    };
  }, [applyHash]);

  // 상태가 바뀐 뒤(목록이 다시 그려진 뒤) 앵커 대상으로 스크롤
  useEffect(() => {
    const id = pendingScroll.current;
    if (!id) return;
    pendingScroll.current = null;
    document.getElementById(id)?.scrollIntoView({ block: "start" });
  });

  // ── 동작 ──
  const pickTop = (key: TopKey) => { setTop(top === key ? null : key); setSub(ALL); setQ(""); };
  const pickSub = (key: string) => { setSub(key); setQ(""); };
  const reset = () => { setSub(ALL); setStatus("all"); setQ(""); };
  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    (document.activeElement as HTMLElement | null)?.blur();
    filtersRef.current?.scrollIntoView({ block: "start" });
  };

  return (
    <>
      <section className={s.head}>
        <div className={s.intro}>
          <span className={s.label}>LIFE WIKI</span>
          <h1 className={s.h1}>생활백과</h1>
          <p className={s.lead}>
            사기 전에, 고치기 전에 찾아보는 정본. 항목마다 근거 자료를 붙이고, 바뀌면 고칩니다. 지금 <strong>{items.length}개 항목</strong>.
          </p>
          <form role="search" className={s.search} onSubmit={onSubmit}>
            <span className={s.searchIco} aria-hidden="true" />
            <input
              type="search"
              name="q"
              value={q}
              autoComplete="off"
              enterKeyHint="search"
              placeholder={short ? PH_SHORT : PH_LONG}
              aria-label="생활백과 검색"
              onChange={(e) => setQ(e.target.value)}
            />
          </form>
        </div>

        <aside className={s.upcoming} aria-labelledby="wh-up-title">
          <div className={s.upHead}>
            <h2 id="wh-up-title" className={s.upTitle}>다가오는 마감·시작</h2>
            <span className={s.upAsOf}>{md(today)} 기준</span>
          </div>
          {upcoming.length ? (
            upcoming.map((u) => (
              <Link key={u.slug} href={`/wiki/${u.slug}`} className={s.upRow}>
                <span className={s.upD}>{u.d}</span>
                <span className={s.upMain}>
                  <span className={s.upName}>{u.title}</span>
                  <span className={s.upCat}>{u.cat}</span>
                </span>
                <span className={s.upDate}>{u.date}</span>
              </Link>
            ))
          ) : (
            <p className={s.upEmpty}>지금 확정된 마감·시작 일정이 없어요. 아래 항목에서 상시 신청 제도를 먼저 확인해 보세요.</p>
          )}
        </aside>
      </section>

      <section className={s.tops} aria-label="대분류">
        {tops.map((t) => {
          const on = top === t.key;
          return (
            <button key={t.key} id={t.key} type="button" aria-pressed={on} className={`${s.top} ${on ? s.topOn : ""}`} onClick={() => pickTop(t.key)}>
              <span className={s.topImg}>
                <img src={t.img} alt="" width={72} height={72} loading="lazy" decoding="async" />
              </span>
              <span className={s.topText}>
                <span className={s.topRow}>
                  <span className={s.topName}>{t.label}</span>
                  <span className={s.topCount}>{t.count}</span>
                </span>
                <span className={s.topDesc}>{t.desc}</span>
              </span>
            </button>
          );
        })}
      </section>

      <section className={s.filters} ref={filtersRef} aria-label="소분류와 상태 필터">
        <div className={s.subs} role="group" aria-label="소분류">
          {subChips.map((c) => {
            const on = c.key === sub;
            return (
              <button key={c.key} type="button" aria-pressed={on} className={`${s.sub} ${on ? s.subOn : ""}`} onClick={() => pickSub(c.key)}>
                {c.label}
                <span className={s.subN}>{c.count}</span>
              </button>
            );
          })}
        </div>
        <div className={s.stRow} role="group" aria-labelledby="wh-st-label">
          <span id="wh-st-label" className={s.stLabel}>상태</span>
          {(["all", ...STATUS_ORDER] as StatusFilter[]).map((v) => {
            const on = v === status;
            return (
              <button key={v} type="button" aria-pressed={on} className={`${s.stBtn} ${on ? s.stOn : ""}`} onClick={() => setStatus(v)}>
                <span className={`${s.dot} ${v === "all" ? s.dAll : DOT[v]}`} aria-hidden="true" />
                {v === "all" ? "전체" : STATUS_LABEL[v]}
              </button>
            );
          })}
        </div>
      </section>

      <p className={s.srOnly} role="status" aria-live="polite">
        {terms ? `"${terms}" 검색 결과 ${shown}건` : `${shown}개 항목`}
      </p>

      <section className={s.groups} aria-label="항목 목록">
        {groups.map((g) => (
          <section key={g.key} id={g.id} className={s.group} aria-labelledby={`${g.id}-h`}>
            <div className={s.gHead}>
              <h2 id={`${g.id}-h`} className={s.gTitle}>
                {g.name} <span className={s.gCount}>{g.countLabel}</span>
              </h2>
              {g.more && (
                <button type="button" className={s.gMore} onClick={() => { setSub(g.key); setStatus("all"); }}>
                  {g.total}개 모두 보기 →
                </button>
              )}
            </div>
            <div className={s.cards}>
              {g.rows.map(({ it, st }) => {
                // 기간 문구는 날짜가 있을 때만(확정 · 미발표지만 작년 일정이 있을 때). "상시"·"일정 발표 전"은 배지와 같은 말이라 반복하지 않는다.
                const when = it.sch.kind === "dated" || (it.sch.kind === "tba" && it.sch.lastYear) ? whenText(it.sch) : "";
                return (
                  <Link key={it.slug} href={`/wiki/${it.slug}`} className={s.card}>
                    {st && (
                      <span className={s.cardTop}>
                        <span className={`${s.badge} ${BADGE[st]}`}>{STATUS_LABEL[st]}</span>
                        {when && <span className={s.when}>{when}</span>}
                      </span>
                    )}
                    <span className={s.cardTitle}>{it.title}</span>
                    {it.sum && <span className={s.cardSum}>{it.sum}</span>}
                  </Link>
                );
              })}
            </div>
          </section>
        ))}

        {isEmpty && (
          <div className={s.empty}>
            <strong>조건에 맞는 항목이 없어요</strong>
            <p>상태 필터를 바꾸거나 다른 이름으로 찾아보세요.</p>
            <div className={s.emptyBtns}>
              <button type="button" className={`${s.btn} ${s.btnLine}`} onClick={reset}>필터 초기화</button>
              {terms && (
                <Link href={`/search?q=${encodeURIComponent(terms)}`} className={`${s.btn} ${s.btnGreen}`}>매거진까지 넓혀서 찾아보기</Link>
              )}
            </div>
          </div>
        )}
      </section>
    </>
  );
}
