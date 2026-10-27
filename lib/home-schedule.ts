// 홈 "다가오는 일정" — 생활백과의 확정 일정에서 계산한다(신청·환급 apply.next / 세일 sale). 서버 전용.
// 일 단위 날짜(YYYY-MM-DD)가 있는 것만 쓴다 — "2026-10" 같은 월 단위 값은 일정이 정해진 게 아니라서 뺀다(page.tsx SaleEvent 와 같은 원칙).
import { allEntries } from "@/lib/wiki/load";

export interface Deadline {
  d: string; // "D-13" · "D-DAY" · "진행 중"
  date: string; // "11.09 (월)" · "~11.15 (일)"
  title: string;
  href: string;
}

const DOW = ["일", "월", "화", "수", "목", "금", "토"];
const FULL = /^\d{4}-\d{2}-\d{2}$/;
const parse = (s?: string): Date | null => (s && FULL.test(s) ? new Date(`${s}T00:00:00Z`) : null);
const two = (n: number) => String(n).padStart(2, "0");
const fmt = (d: Date) => `${two(d.getUTCMonth() + 1)}.${two(d.getUTCDate())} (${DOW[d.getUTCDay()]})`;

// 한국 날짜 기준 오늘(UTC 자정으로 맞춰 날짜끼리 뺀다)
function kstToday(): Date {
  const k = new Date(Date.now() + 9 * 3600 * 1000);
  return new Date(Date.UTC(k.getUTCFullYear(), k.getUTCMonth(), k.getUTCDate()));
}

export function upcomingDeadlines(n = 3): Deadline[] {
  const today = kstToday();
  const days = (a: Date, b: Date) => Math.round((a.getTime() - b.getTime()) / 86400000);
  const items: { title: string; href: string; start: Date; end: Date; sale: boolean }[] = [];

  for (const e of allEntries()) {
    let start: Date | null = null, end: Date | null = null, title = e.title, sale = false;
    if (e.type === "apply" && e.apply?.next.status === "확정") {
      start = parse(e.apply.next.start);
      end = parse(e.apply.next.end);
      title = e.apply.next.label || e.title;
    } else if (e.type === "sale" && e.sale?.status === "확정") {
      start = parse(e.sale.start);
      end = parse(e.sale.end);
      sale = true;
    } else continue;
    if (!start) continue;
    if (!end) end = start;
    if (end < today) continue; // 이미 끝난 것
    items.push({ title, href: `/wiki/${e.slug}`, start, end, sale });
  }

  // 아직 시작 전인 것(가까운 순) 먼저, 모자라면 진행 중인 것(끝나는 순)으로 채운다
  const upcoming = items.filter((i) => i.start >= today).sort((a, b) => a.start.getTime() - b.start.getTime());
  const ongoing = items.filter((i) => i.start < today).sort((a, b) => a.end.getTime() - b.end.getTime());
  const out: Deadline[] = [];
  for (const i of upcoming) {
    const n0 = days(i.start, today);
    out.push({ d: n0 === 0 ? "D-DAY" : `D-${n0}`, date: fmt(i.start), title: i.sale ? `${i.title} 시작` : i.title, href: i.href });
  }
  for (const i of ongoing) out.push({ d: "진행 중", date: `~${fmt(i.end)}`, title: i.title, href: i.href });
  return out.slice(0, n);
}
