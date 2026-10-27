// 생활백과 항목의 "일정 상태" 계산 — 허브(상태 필터·배지)와 상세(정보 카드)가 같은 기준을 쓴다. 순수 함수라 서버·클라이언트 모두에서 쓴다.
//
// 디자인 시안(오늘의딜 생활백과.dc.html)의 상태 5종:
//   live 진행 중 · soon 예정 · tba 발표 전 · always 상시 · closed 마감
// 우리 데이터에는 status 필드가 없다 — sale(세일 달력)·apply(신청·환급 달력)의 "확정/미발표/상시"와 start·end 날짜에서 오늘 기준으로 계산한다.
// 영상 속 그 제품(video-pick) 등 일정이 없는 항목은 상태가 없다(null).
//
// ★상태는 날짜가 지나면 바뀐다. 서버에서 빌드 때 계산한 값을 그대로 믿지 말고, 화면(클라이언트)에서 오늘 날짜로 다시 계산해 쓴다.
import type { WikiEntry } from "./types";

export type WikiStatus = "live" | "soon" | "tba" | "always" | "closed";

export const STATUS_LABEL: Record<WikiStatus, string> = {
  live: "진행 중",
  soon: "예정",
  tba: "발표 전",
  always: "상시",
  closed: "마감",
};
/** 상태 필터 표시 순서(시안: 전체 · 진행 중 · 예정 · 발표 전 · 상시 · 마감) */
export const STATUS_ORDER: WikiStatus[] = ["live", "soon", "tba", "always", "closed"];

/** 항목 하나의 일정(날짜는 YYYY-MM-DD, 일 단위로 확정된 것만 채운다) */
export interface WikiSchedule {
  /** 일정이 아예 없는 항목(영상 속 그 제품 등)이면 null */
  kind: "dated" | "tba" | "always" | null;
  startsAt?: string;
  endsAt?: string;
  /** 회차 이름(신청·환급 달력의 next.label) */
  label?: string;
  /** 미발표일 때 직전 회차의 실제 일정(참고용) */
  lastYear?: { start: string; end: string };
}

const FULL = /^\d{4}-\d{2}-\d{2}$/;
const isFull = (s?: string): s is string => !!s && FULL.test(s);

export function scheduleOf(e: WikiEntry): WikiSchedule {
  const a = e.type === "apply" ? e.apply : undefined;
  const s = e.type === "sale" ? e.sale : undefined;
  const st = a?.next.status ?? s?.status;
  if (!st) return { kind: null };
  const lastYear = a?.lastYear ?? s?.lastYear;
  const label = a?.next.label;
  if (st === "상시") return { kind: "always", label };
  if (st === "확정") {
    const start = a ? a.next.start : s?.start;
    const end = a ? a.next.end : s?.end;
    // 월 단위("2026-10")만 있는 값은 일정이 정해진 게 아니다 → 발표 전으로 본다(홈 "다가오는 일정"과 같은 원칙)
    if (isFull(start)) return { kind: "dated", startsAt: start, endsAt: isFull(end) ? end : start, label };
  }
  return { kind: "tba", label, lastYear: lastYear ? { start: lastYear.start, end: lastYear.end } : undefined };
}

/** 한국 날짜 기준 오늘(YYYY-MM-DD). 브라우저·서버 어디서든 같은 값 */
export function kstTodayIso(now: number = Date.now()): string {
  return new Date(now + 9 * 3600 * 1000).toISOString().slice(0, 10);
}

const dayNum = (iso: string) => Math.round(Date.parse(`${iso}T00:00:00Z`) / 86400000);
/** 두 날짜(YYYY-MM-DD)의 일수 차: b - a */
export const daysBetween = (a: string, b: string) => dayNum(b) - dayNum(a);

export function statusAt(sch: WikiSchedule, today: string): WikiStatus | null {
  if (sch.kind === null) return null;
  if (sch.kind === "always") return "always";
  if (sch.kind === "tba") return "tba";
  const start = sch.startsAt!, end = sch.endsAt ?? start;
  if (end < today) return "closed";
  if (start > today) return "soon";
  return "live";
}

const DOW = ["일", "월", "화", "수", "목", "금", "토"];
const md = (iso: string) => `${iso.slice(5, 7)}.${iso.slice(8, 10)}`;
const mdw = (iso: string) => `${md(iso)} (${DOW[new Date(`${iso}T00:00:00Z`).getUTCDay()]})`;

/** 카드에 쓰는 기간 문자열(시안의 `when`). 예: "11.08 ~ 11.15" · "11.11" · "상시" · "일정 발표 전" · "작년 06.15 ~ 06.19" */
export function whenText(sch: WikiSchedule): string {
  if (sch.kind === "always") return "상시";
  if (sch.kind === "tba") return sch.lastYear ? `작년 ${md(sch.lastYear.start)} ~ ${md(sch.lastYear.end)}` : "일정 발표 전";
  if (sch.kind === "dated") {
    const s = sch.startsAt!, e = sch.endsAt ?? s;
    return s === e ? mdw(s) : `${md(s)} ~ ${md(e)}`;
  }
  return "";
}

/** D-day 문구. 진행 중이면 끝까지, 예정이면 시작까지. 예: {prefix:"마감까지", d:"D-65"} · {prefix:"시작까지", d:"D-3"} · {prefix:"", d:"D-DAY"} */
export function ddayOf(sch: WikiSchedule, today: string): { prefix: string; d: string } | null {
  if (sch.kind !== "dated") return null;
  const st = statusAt(sch, today);
  const s = sch.startsAt!, e = sch.endsAt ?? s;
  if (st === "soon") { const n = daysBetween(today, s); return { prefix: "시작까지", d: n === 0 ? "D-DAY" : `D-${n}` }; }
  if (st === "live") { const n = daysBetween(today, e); return { prefix: "마감까지", d: n === 0 ? "D-DAY" : `D-${n}` }; }
  return null; // 마감
}
