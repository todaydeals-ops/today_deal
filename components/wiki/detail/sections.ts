// 섹션·블록 분류 — 우리 데이터(content/wiki/*.json)에서 "기계적으로 안전하게" 시안 모듈로 도출되는 것만 고른다(순수 함수).
// 시안의 대상 확인 AND 토글·금액 세그먼트처럼 데이터에서 도출할 수 없는 모듈은 만들지 않는다(원래 블록을 그대로 그린다).
import type { Block } from "@/lib/wiki/types";

/** 준비물 체크 리스트로 그릴 섹션 — 제목이 준비물 계열이고 블록이 list 일 때 */
const PREP_RE = /준비물|챙길 것|챙겨 둘 것/;
export const isPrepHeading = (h: string) => PREP_RE.test(h);
/** 준비물 박스 제목 — 제목에 "준비물"이 있으면 그대로, 아니면 "챙길 것" */
export const prepTitle = (h: string) => (/준비물/.test(h) ? "준비물" : "챙길 것");

/** 01 한눈에 보기 섹션 */
const GLANCE_RE = /한눈에|지금 상태/;
export const isGlanceHeading = (h: string) => GLANCE_RE.test(h);

export interface Tiles {
  items: { k: string; v: string }[];
  /** "내용(2026년 기준)" 의 괄호 속 설명 — 머리글을 버리지 않으려고 따로 보여 준다 */
  caption?: string;
  /** 값이 길면 2열로 넓게 */
  wide: boolean;
}

/**
 * 한눈에 보기 섹션 안의 표가 "항목|구분 / 내용" 2열이면 시안의 타일(키-값)로 그린다.
 * 머리글이 이 형태가 아니거나(예: "구분 / 2026년 4월부터") 빈 칸이 있으면 null — 일반 표로 그린다(데이터를 잃지 않으려고).
 */
export function glanceTiles(b: Block): Tiles | null {
  if (!("table" in b)) return null;
  const { head, rows } = b.table;
  if (head.length !== 2 || rows.length === 0) return null;
  if (!/^(항목|구분)$/.test(head[0].trim())) return null;
  const m = /^내용(?:\((.+)\))?$/.exec(head[1].trim());
  if (!m) return null;
  if (rows.some((r) => r.length !== 2 || !r[0].trim() || !r[1].trim())) return null;
  const items = rows.map((r) => ({ k: r[0], v: r[1] }));
  return { items, caption: m[1], wide: Math.max(...items.map((x) => x.v.length)) > 48 };
}
