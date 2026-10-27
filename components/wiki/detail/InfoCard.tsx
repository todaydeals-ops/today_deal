"use client";

import { useEffect, useState, type ReactNode } from "react";
import { ddayOf, kstTodayIso, statusAt, STATUS_LABEL, type WikiSchedule, type WikiStatus } from "@/lib/wiki/status";
import s from "@/app/wiki/[slug]/wiki-detail.module.css";
import type { WikiCta } from "./cta";

// 정보 카드(시안의 우측 사이드바 첫 카드) — 다크 헤더(항목명 · 상태 배지 · D-day · 확정 기간) + 키-값 행(children) + CTA.
//
// ★상태·D-day 는 "오늘"에 따라 바뀐다. 이 페이지는 빌드 때 정적으로 구워지므로(generateStaticParams) 서버에서 계산한 값은
//   날짜가 지나면 틀린다(마감된 일정이 "진행 중"으로 남는다). 그래서 날짜에 따라 달라지는 값은 브라우저에서 오늘(KST)로 계산한다.
// ★하이드레이션: 서버 HTML 과 클라이언트 첫 렌더가 달라지면 안 된다. `today` 는 null 로 시작하고(서버·첫 렌더 동일),
//   마운트 뒤 useEffect 에서 오늘 날짜를 채운다. 그 전에는 날짜에 의존하는 값(상태 배지·D-day·CTA 문구)을 그리지 않고,
//   자리만 같은 높이로 잡아 둬 레이아웃이 흔들리지 않게 한다.
//   일정이 "발표 전(tba)"·"상시(always)"인 항목은 오늘과 무관하니 서버에서 그대로 그린다(statusAt 이 오늘을 보지 않는다).
// ★일정이 없는 항목(영상 속 그 제품 등)은 상태 배지·D-day 없이 헤더에 종류 라벨과 항목명만 둔다.

const fmtDot = (iso: string) => iso.replace(/-/g, ".");
const range = (a: string, b: string) => (a === b ? fmtDot(a) : `${fmtDot(a)} ~ ${fmtDot(b)}`);

const ST_CLASS: Record<WikiStatus, string> = {
  live: s.stLive,
  soon: s.stSoon,
  tba: s.stTba,
  always: s.stAlways,
  closed: s.stClosed,
};

export type WikiNoun = "신청" | "행사";

export default function InfoCard({
  kindLabel,
  title,
  noun,
  schedule,
  monthNote,
  cta,
  children,
}: {
  kindLabel: string;
  title: string;
  /** 일정의 성격 — 신청·환급 달력은 "신청", 세일 달력은 "행사" */
  noun: WikiNoun;
  schedule: WikiSchedule;
  /** 월 단위로만 알려진 확정 일정("2026.10 ~ 2026.11")처럼 날짜로 못 박지 못한 표시용 문구 */
  monthNote?: string;
  cta: WikiCta | null;
  children: ReactNode;
}) {
  const [today, setToday] = useState<string | null>(null);
  useEffect(() => {
    setToday(kstTodayIso());
  }, []);

  const dated = schedule.kind === "dated";
  const hasSchedule = schedule.kind !== null;
  // 날짜에 의존하는 값은 today 가 채워진 뒤에만 안다. tba·always 는 today 와 무관.
  const status: WikiStatus | null = !hasSchedule ? null : dated ? (today ? statusAt(schedule, today) : null) : statusAt(schedule, "");
  const pending = dated && !today; // 날짜 계산 전(서버 렌더·하이드레이션 직후)

  let big = "";
  if (hasSchedule) {
    if (pending) big = `${noun} 일정`;
    else if (schedule.kind === "dated") {
      const dd = ddayOf(schedule, today!);
      big = dd ? `${dd.prefix ? dd.prefix + " " : ""}${dd.d}` : noun === "신청" ? "신청이 마감됐어요" : "행사가 끝났어요";
    } else if (schedule.kind === "tba") big = "일정 발표 전";
    else big = noun === "신청" ? "회차 없이 수시 신청" : "상시 운영";
  }

  const mono: string[] = [];
  if (schedule.label) mono.push(schedule.label);
  if (schedule.kind === "dated") mono.push(`확정 ${range(schedule.startsAt!, schedule.endsAt ?? schedule.startsAt!)}`);
  if (schedule.kind === "tba") {
    if (monthNote) mono.push(`월 단위 일정 ${monthNote}`);
    if (schedule.lastYear) mono.push(`${noun === "신청" ? "직전 회차" : "지난 행사"} ${range(schedule.lastYear.start, schedule.lastYear.end)}(참고)`);
  }

  const ctaText = cta && (status === "closed" ? cta.closedText : cta.text);

  return (
    <section className={s.card} aria-label="항목 정보">
      <div className={s.cardHead}>
        {hasSchedule ? (
          <>
            <div className={s.cardTop}>
              <span className={s.cardKind}>{title}</span>
              {status ? (
                <span className={`${s.st} ${ST_CLASS[status]}`}>
                  <i className={s.stDot} aria-hidden="true" />
                  {STATUS_LABEL[status]}
                </span>
              ) : (
                <span className={s.stSlot} aria-hidden="true" />
              )}
            </div>
            <div className={s.cardBig}>{big}</div>
            {mono.length > 0 && <div className={s.cardMono}>{mono.join(" · ")}</div>}
          </>
        ) : (
          <>
            <span className={s.cardKind}>{kindLabel}</span>
            <div className={s.cardName}>{title}</div>
          </>
        )}
      </div>
      <dl className={s.cardRows}>{children}</dl>
      {cta && ctaText && (
        <a className={s.cta} href={cta.href} target="_blank" rel="noopener nofollow">
          {ctaText}
        </a>
      )}
    </section>
  );
}
