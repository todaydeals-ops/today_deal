// 생활백과 허브 — 서버(page.tsx)가 클라이언트(WikiHub)에 넘기는 "직렬화 가능한 최소 데이터".
// 상태(진행 중·예정…)·D-day 는 여기에 담지 않는다. 날짜가 지나면 바뀌므로 schedule 만 넘기고 클라이언트가 오늘(KST)로 계산한다.
import type { WikiSchedule } from "@/lib/wiki/status";

/** 대분류 3개 = 항목 타입(세일 달력 · 신청·환급 달력 · 영상 속 그 제품) */
export type TopKey = "sale" | "apply" | "video-pick";

export interface HubItem {
  slug: string;
  title: string;
  /** 카드 요약(2줄 말줄임) — 항목의 description, 없으면 summary[0] */
  sum: string;
  top: TopKey;
  /** 소분류 키 = HubSub.key */
  g: string;
  /** 일정(상태 계산용). 영상 속 그 제품처럼 일정이 없으면 { kind: null } */
  sch: WikiSchedule;
  /** 검색용 보조어 — seoTitle · 다른 이름(aliases) · 인물(people). 표제어는 title 로 따로 찾는다 */
  kw: string[];
}

export interface HubSub {
  /** `${대분류}:${소분류 이름}` — 상태(선택 중인 소분류)로 쓰는 값 */
  key: string;
  label: string;
  /** 그룹 영역의 DOM id. 예전 앵커(`#apply-tax`)와 같은 규칙 `${대분류}-${묶음 id}` */
  id: string;
  count: number;
}

export interface HubTop {
  key: TopKey;
  label: string;
  desc: string;
  /** 72px 썸네일(144×144 JPG) */
  img: string;
  count: number;
  subs: HubSub[];
}

export interface HubData {
  tops: HubTop[];
  items: HubItem[];
}
