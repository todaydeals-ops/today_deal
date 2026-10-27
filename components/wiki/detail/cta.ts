// 정보 카드의 CTA 버튼 — 어느 공식 출처로 보낼지와 버튼 문구를 정한다(순수 함수).
//
// 규칙(총괄 지시): 신청·환급 항목은 sources 중 kind「공식」첫 항목, 세일 항목은「공식 안내 보기 →」, 공식 출처가 없으면 버튼 없음.
// ★보정 하나: 220개 항목 중 111개는 첫 공식 출처가 국가법령정보센터(law.go.kr) 조문 페이지다.
//   그 링크에「공식 사이트에서 신청하기 →」를 달면 독자가 법조문을 신청 창구로 오해한다(금전·기한이 걸린 영역).
//   그래서 법령·보도자료(정책브리핑)만 있는 공식 출처는 건너뛰고 그 다음 공식 출처를 쓴다.
//   건너뛸 곳이 없어 법령·보도자료뿐이면 문구를「공식 근거 보기 →」로 바꿔 사실대로 말한다.
import type { WikiEntry, WikiSource } from "@/lib/wiki/types";

export interface WikiCta {
  href: string;
  /** 일정이 진행 중·예정·발표 전·상시일 때 */
  text: string;
  /** 일정이 이미 마감됐을 때(신청하라고 하지 않는다) */
  closedText: string;
}

const hostOf = (u: string) => {
  try {
    return new URL(u).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
};

/** 법조문·보도자료 — 신청 창구가 아니라 근거 문서다 */
export function isBasisOnly(src: WikiSource): boolean {
  const h = hostOf(src.url);
  if (/(^|\.)law\.go\.kr$|(^|\.)moleg\.go\.kr$|(^|\.)korea\.kr$/.test(h)) return true;
  return /국가법령정보센터|시행령|시행규칙|보도자료|정책브리핑|카드뉴스/.test(src.label);
}

export function pickCta(e: WikiEntry): WikiCta | null {
  if (e.type !== "apply" && e.type !== "sale") return null;
  const official = e.sources.filter((x) => x.kind === "공식");
  if (official.length === 0) return null;
  const window = official.find((x) => !isBasisOnly(x));
  if (!window) {
    return { href: official[0].url, text: "공식 근거 보기 →", closedText: "공식 근거 보기 →" };
  }
  return e.type === "apply"
    ? { href: window.url, text: "공식 사이트에서 신청하기 →", closedText: "공식 사이트 보기 →" }
    : { href: window.url, text: "공식 안내 보기 →", closedText: "공식 안내 보기 →" };
}
