// 생활백과 항목 이미지 — Codex 로 만든 정물 사진풍 설명용 이미지(2026-10-27).
//
// ★한 번 만든 이미지는 고정한다(전역 CLAUDE.md §6). content/wiki-images.json 에 기록돼 있으면 다시 만들지 않는다
//   (scripts/wiki-images.mjs apply 가 이 목록을 채운다). 목록에 없는 항목은 이미지 없이 그대로 나간다.
// ★이미지 안에는 글자·숫자·로고가 없다. 정보는 본문이 맡고 이미지는 분위기와 소재만 맡는다.
import manifest from "@/content/wiki-images.json";

export interface WikiImages {
  hero: string; // 항목 맨 위(1200x675)
  body?: string; // 본문 중간(960x540)
  og: string; // 공유 썸네일(1200x630)
  alt: string;
}

const M = manifest as Record<string, WikiImages>;

export function imagesOf(slug: string): WikiImages | undefined {
  return M[slug];
}
