// 수집기(크롤러) 공통 타입
import type { Platform } from "@/lib/types";

export interface CollectedDeal {
  platform: Platform;
  productName: string;
  imageUrl?: string;
  productUrl: string;
  affiliateUrl?: string;
  discountRate?: number;
  salePrice: number;
  originalPrice?: number;
  dealEndAt?: string; // ISO
  isSoldout?: boolean;
  displayOrder: number;
}

export interface Collector {
  platform: Platform;
  // 수집 실패 시 빈 배열 반환 (파이프라인이 기존 데이터를 보존하도록)
  collect(): Promise<CollectedDeal[]>;
}
