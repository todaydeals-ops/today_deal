// 오늘의딜 매거진 — 3 코너 시스템(형식 브랜드). 색·아이콘·약속. (디자인 핸드오프 §3)
// 통폐합: 끝장비교·롱런팁 → 스마트가이드로 흡수(2026-07). 팩트체크·트렌드랩은 유지.
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
    desc: "고르고·비교하고 오래 쓰는 전 과정",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
        <polygon points="12,7 14.2,12 12,17 9.8,12" fill="currentColor" />
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

// 캐치프라이즈 — 확정본(여러 요소에 재사용)
export const CATCH = {
  // H1(슬로건): 통념 → 우리의 약속
  media: {
    lead: "미디어는 늘 ‘사야 할 이유’를 말합니다.",
    tail: "오늘의딜은 고려해야 할 기준과 숫자를 정리해 드립니다.",
    hi: "고려해야 할 기준과 숫자", // tail 안에서 오렌지 강조
  },
  // 중립 선언 밴드
  lonely: {
    lead: "정답 대신 기준을, 권유 대신 근거를 드립니다",
    sub: "무언가를 고르고 결정한다는 것은 생각보다 외롭습니다",
    hi: "당신은 혼자가 아닙니다",
  },
};

// 코너 인덱스용 한 줄 설명(짧게)
export const CORNER_SHORT: Record<string, string> = {
  factcheck: "광고 너머의 진실",
  smartguide: "고르고·비교하고 오래 쓰기",
  trendlab: "살 가치 있나",
};
export const MAGAZINE_INTRO =
  "광고도 제휴도 받지 않는 중립 쇼핑 가이드.";
