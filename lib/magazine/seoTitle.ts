// 아티클 검색결과 제목 — 화면 제목(H1, DB title)과 분리한다.
//
// ★왜(2026-10-17 실측): 우리 제목은 "사과식초, 혈당과 체중 관리에서의 자리"처럼 정보 질문형이라 네이버 웹문서
//   30위 안 노출이 0.7%였고, 경쟁 매체는 앞머리를 실제 검색어로 써서 80%였다. 화면 제목은 편집 톤 그대로 두고
//   검색엔진이 보는 <title>·og:title 만 검색어형으로 바꾼다(사장님 승인 10-20).
// ★DB 를 건드리지 않는다 — 저장소 파일(content/magazine-seo-titles.json)을 정적 import 해서 런타임 파일 의존이 없고,
//   되돌리려면 이 파일을 비우면 된다. 명세 .claude/agents/seo-titler.md, 검증 scripts/seo-title-verify.mjs.
import data from "@/content/magazine-seo-titles.json";

const TITLES = (data as { titles: Record<string, string> }).titles;

/** 검색결과 제목. 없으면 화면 제목을 그대로 쓴다. */
export function seoTitleOf(slug: string, fallback: string): string {
  return TITLES[slug] || fallback;
}

export function hasSeoTitle(slug: string): boolean {
  return Boolean(TITLES[slug]);
}
