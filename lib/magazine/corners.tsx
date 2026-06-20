// 오늘의딜 매거진 — 5 코너 시스템(형식 브랜드). 색·아이콘·약속. (디자인 핸드오프 §3)
import type { ReactNode } from "react";

export interface Corner {
  key: string;
  name: string; // 한글 코너명
  nameEn: string; // 모노 라벨
  color: string; // 텍스트/강조색(저채도)
  chipBg: string; // 칩 배경
  desc: string; // 약속
  icon: ReactNode; // 20x20 인라인 SVG (currentColor)
}

export const CORNERS: Corner[] = [
  {
    key: "factcheck",
    name: "팩트체크",
    nameEn: "FACT CHECK",
    color: "#1f6b66",
    chipBg: "#e3efee",
    desc: "광고 너머의 진실·숨은 단점",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <circle cx="10" cy="10" r="6.5" stroke="currentColor" strokeWidth="2" />
        <line x1="15" y1="15" x2="20" y2="20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    key: "smartguide",
    name: "스마트가이드",
    nameEn: "SMART GUIDE",
    color: "#e0481f",
    chipBg: "#ffe9e2",
    desc: "내 상황엔 뭘 골라야? · Decision Tree",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
        <polygon points="12,7 14.2,12 12,17 9.8,12" fill="currentColor" />
      </svg>
    ),
  },
  {
    key: "compare",
    name: "끝장비교",
    nameEn: "VS COMPARE",
    color: "#38539a",
    chipBg: "#e9edf7",
    desc: "A vs B, 3년 총비용까지",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <rect x="4" y="12" width="4" height="8" rx="1" fill="currentColor" />
        <rect x="10" y="6" width="4" height="14" rx="1" fill="currentColor" />
        <rect x="16" y="9" width="4" height="11" rx="1" fill="currentColor" />
      </svg>
    ),
  },
  {
    key: "longrun",
    name: "롱런팁",
    nameEn: "LONG-RUN",
    color: "#7a5f2e",
    chipBg: "#f1ecdf",
    desc: "본전 뽑고 오래 쓰는 법",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M20 6a5 5 0 0 1-6.5 6.5L7 19l-2-2 6.5-6.5A5 5 0 0 1 18 4l-2.5 2.5 2 2L20 6z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    key: "trendlab",
    name: "트렌드랩",
    nameEn: "TREND LAB",
    color: "#6e4690",
    chipBg: "#efe7f5",
    desc: "신기술, 살 가치 있나?",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M10 3v6l-5 8.5A1.5 1.5 0 0 0 6.3 20h11.4a1.5 1.5 0 0 0 1.3-2.5L14 9V3" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        <line x1="9" y1="3" x2="15" y2="3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
];

export const CORNER_MAP: Record<string, Corner> = Object.fromEntries(CORNERS.map((c) => [c.key, c]));
export function cornerOf(key?: string): Corner {
  return CORNER_MAP[key ?? ""] ?? CORNERS[0];
}
export function isCorner(key?: string): boolean {
  return !!key && key in CORNER_MAP;
}

// 분야 태그 (코너와 교차 = 주제 매트릭스)
export const MAGAZINE_FIELDS = ["가전", "리빙·주방", "디지털·IT", "식품·건강", "뷰티", "유아·반려"] as const;

export const MAGAZINE_SLOGAN = "광고가 끝나는 곳에서, 기준이 시작됩니다.";
export const MAGAZINE_INTRO =
  "광고도 제휴도 받지 않는 중립 쇼핑 가이드.";
