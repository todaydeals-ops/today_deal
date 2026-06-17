// 오늘의딜 — 도메인 타입
// 기획안 8.2 DB 스키마(deals) 기반. 화면 비노출 항목은 선택(optional)으로 둠.

export type Platform = "gmarket" | "11st" | "ali";

export interface Deal {
  id: string;
  platform: Platform;
  productName: string;
  imageUrl?: string; // 없으면 placeholder
  productUrl: string; // 원본 상품 URL
  affiliateUrl?: string; // 제휴코드 삽입 링크 (이동용)
  discountRate: number; // 할인율 %
  salePrice: number; // 판매가 (원)
  originalPrice?: number; // 정가 (저장만, 비노출)
  freeShipping?: boolean; // 저장만, 비노출
  dealEndAt: string; // ISO 8601 마감 시각
  isSoldout: boolean;
}

// 플랫폼 메타 (라벨 노출용). 소프트 뉴트럴 방향: 색 구분 없이 텍스트로만.
export const PLATFORM_LABELS: Record<Platform, string> = {
  gmarket: "지마켓 슈퍼딜",
  "11st": "11번가 쇼킹타임",
  ali: "알리익스프레스 타임딜",
};

// 3열 노출 순서
export const PLATFORM_ORDER: Platform[] = ["gmarket", "11st", "ali"];

// 추천딜 카테고리 (검색/필터용)
export type CuratedCategory = "가전" | "주방" | "생활" | "가구" | "식품";
export const CURATED_CATEGORIES: CuratedCategory[] = [
  "가전",
  "주방",
  "생활",
  "가구",
  "식품",
];

// 추천딜 (쿠팡 큐레이션, 수동 등록) — 기획안 3.2 / 8.2 curated_deals
export interface CuratedDeal {
  id: string;
  seq: number; // 추천 번호 (인포크식, 클수록 최신)
  productName: string;
  category: CuratedCategory;
  imageUrl?: string;
  affiliateUrl: string; // 쿠팡 제휴 링크
  discountRate?: number;
  salePrice: number;
  adminNote?: string; // 관리자 한줄평 (전환 유도)
  isActive: boolean;
}

// 큐레이션 파트너 프로필 (링크인바이오 헤더) — 가족 파트너 브랜딩
export interface PartnerProfile {
  name: string;
  handle: string; // @아이디
  tagline: string;
  avatarUrl?: string;
  instagramUrl?: string;
}

// 나눔 주기 — 주간(매주·다수 추첨) / 월간(매월·고가 1명)
export type GiveawayType = "weekly" | "monthly";

// 무료나눔 이벤트 — 기획안 3.3 / 8.2 giveaways
export interface Giveaway {
  id: string;
  type: GiveawayType;
  title: string;
  prizeName: string;
  prizeImage?: string;
  description?: string; // 경품 소개·스펙 (콘텐츠 실체)
  startAt: string; // ISO
  endAt: string; // ISO
  winnerCount: number;
  entryCount?: number; // 현재 응모 수 (표시용)
}
