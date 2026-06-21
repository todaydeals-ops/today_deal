// 콘텐츠 발행 자동화 정책 — 맥스(로컬 세션)↔API 라우팅 상수/헬퍼.
// 원칙: 창 열림(로컬 하트비트 신선) = 맥스로 최대 발행 / 창 닫힘 = API로 소량.
// 자세한 정책: docs/automation-policy.md

// settings 테이블 키(별도 DDL 없이 jsonb 저장)
export const HEARTBEAT_KEY = "automation_heartbeat"; // { source, at }
export const API_COUNTER_KEY = "automation_api_counter"; // { day, posts, blurbs }

// 로컬(맥스) 생존 판정 — 마지막 하트비트가 이 분(min) 이내면 '창 열림'으로 간주
export const HEARTBEAT_FRESH_MIN = 15;

// 게시글 '리라이트 대기' 센티넬(새 컬럼 없이 author로 인코딩)
export const PENDING_AUTHOR = "__pending__";

// 창 닫힘(API) 모드의 소량 발행 상한
export const API_DAILY_POSTS = 40; // 게시글 리라이트 하루 상한
export const API_DAILY_BLURBS = 60; // 한줄평 하루 상한
export const API_POSTS_PER_RUN = 3; // ingest 1회당 API 리라이트 상한(시간당 cron 가정)
export const API_BLURBS_PER_RUN = 5; // summaries 1회당 API 한줄평 상한

// 새벽 정지(KST 0~7시) — 트래픽 적고, 창 열리면 채워짐
export const NIGHT_START_HOUR = 0;
export const NIGHT_END_HOUR = 7;

export function isNightKST(now: number = Date.now()): boolean {
  const h = new Date(now + 9 * 3_600_000).getUTCHours();
  return h >= NIGHT_START_HOUR && h < NIGHT_END_HOUR;
}

// KST 기준 YYYY-MM-DD (일일 카운터 리셋 키)
export function kstDay(now: number = Date.now()): string {
  return new Date(now + 9 * 3_600_000).toISOString().slice(0, 10);
}
