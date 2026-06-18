// 오늘의딜 — 도메인 타입
// 기획안 8.2 DB 스키마(deals) 기반. 화면 비노출 항목은 선택(optional)으로 둠.

export type Platform = "gmarket" | "11st" | "ali" | "coupang";

export interface Deal {
  id: string;
  platform: Platform;
  badge?: DealBadge; // 통합 피드 출처/코너 뱃지
  productName: string;
  imageUrl?: string; // 없으면 placeholder
  productUrl: string; // 원본 상품 URL
  affiliateUrl?: string; // 제휴코드 삽입 링크 (이동용·수익)
  discountRate: number; // 할인율 % (없으면 0)
  salePrice: number; // 판매가 (원)
  originalPrice?: number; // 정가 (저장만, 비노출)
  freeShipping?: boolean; // 저장만, 비노출
  dealEndAt: string; // ISO 8601 마감 시각
  isSoldout: boolean;
}

// 통합 피드 — 출처+코너 뱃지. tier 1=상단(타임딜·골드박스), 2=하단(나머지). 둘 다 할인율순.
export type DealBadge =
  | "gmarket_openrun" // ⚡ G마켓 오픈런타임딜
  | "gmarket_shorts" // 🎬 G마켓 오늘의쇼츠딜
  | "gmarket_encore" // ♻️ G마켓 앵콜딜
  | "11st_time" // ⏰ 11번가 타임딜
  | "11st_today" // 🔥 11번가 오늘의딜
  | "coupang_goldbox" // 📦 쿠팡 골드박스
  | "ali_time"; // 🌏 알리 타임딜

export interface BadgeMeta {
  label: string; // 데스크탑 칩
  short: string; // 모바일 짧은 칩
  tier: 1 | 2;
  color: string; // 칩 배경색
}

export const BADGE_META: Record<DealBadge, BadgeMeta> = {
  gmarket_openrun: { label: "G마켓 오픈런타임딜", short: "G-오픈런", tier: 1, color: "#00a862" },
  coupang_goldbox: { label: "쿠팡 골드박스", short: "쿠팡-골드", tier: 1, color: "#c8901f" },
  "11st_time": { label: "11번가 타임딜", short: "11-타임딜", tier: 1, color: "#ff0038" },
  ali_time: { label: "알리 타임딜", short: "알리-타임딜", tier: 1, color: "#ff6a00" },
  gmarket_shorts: { label: "G마켓 쇼츠딜", short: "G-쇼츠딜", tier: 2, color: "#1fa463" },
  gmarket_encore: { label: "G마켓 앵콜딜", short: "G-앵콜딜", tier: 2, color: "#5fa77f" },
  "11st_today": { label: "11번가 오늘의딜", short: "11-오늘딜", tier: 2, color: "#ff5c79" },
};

// 구버전 3열(점진 폐지 예정). 라벨 Record는 전 플랫폼 키 필요.
export const PLATFORM_LABELS: Record<Platform, string> = {
  gmarket: "지마켓 슈퍼딜",
  "11st": "11번가 쇼킹타임",
  ali: "알리익스프레스 타임딜",
  coupang: "쿠팡",
};

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
  slug?: string; // 개별 페이지 URL (/recommended/[slug])
  productName: string;
  category: CuratedCategory;
  imageUrl?: string;
  affiliateUrl: string; // 쿠팡 제휴 링크
  discountRate?: number;
  salePrice: number;
  adminNote?: string; // 관리자 한줄평 (전환 유도)
  videoUrl?: string; // 쇼츠/릴스 임베드 URL
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
  affiliateUrl?: string; // 경품 구매 링크 (쿠팡 제휴코드) — 공개 페이지서 클릭 시 수익
  drawAt?: string; // 추첨 예정 시각 ISO (주간=종료 다음 월요일 / 월간=익월 5일)
}
