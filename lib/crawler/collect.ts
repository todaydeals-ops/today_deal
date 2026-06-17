// 수집 오케스트레이터. Cron 또는 수동 호출에서 사용.
import type { Platform } from "@/lib/types";
import { PLATFORM_ORDER } from "@/lib/types";
import { replaceDeals, type UpsertResult } from "./upsert";
import { collectAliexpress } from "./aliexpress";
import type { CollectedDeal } from "./types";

// 파이프라인 데모용 mock 생성기 (실제 소스 미연결 플랫폼 시연용).
function mockDeals(platform: Platform): CollectedDeal[] {
  const base = Date.now();
  const samples: Record<Platform, Array<[string, number, number]>> = {
    gmarket: [
      ["[수집데모] 지마켓 슈퍼딜 상품 A", 40, 9900],
      ["[수집데모] 지마켓 슈퍼딜 상품 B", 35, 19900],
    ],
    "11st": [
      ["[수집데모] 11번가 쇼킹딜 상품 A", 30, 14980],
      ["[수집데모] 11번가 쇼킹딜 상품 B", 25, 23150],
    ],
    ali: [
      ["[수집데모] 알리 타임딜 상품 A", 36, 8230],
      ["[수집데모] 알리 타임딜 상품 B", 31, 14970],
    ],
  };
  return samples[platform].map(([name, dc, price], i) => ({
    platform,
    productName: name,
    productUrl: "#",
    discountRate: dc,
    salePrice: price,
    dealEndAt: new Date(base + (8 * 3600 + i * 60) * 1000).toISOString(),
    isSoldout: false,
    displayOrder: i + 1,
  }));
}

export async function runCollectors(opts: { mock?: boolean } = {}): Promise<UpsertResult[]> {
  if (opts.mock) {
    // 파이프라인 시연: 모든 플랫폼에 데모 데이터 기록 (Cron→DB 동작 확인용)
    const out: UpsertResult[] = [];
    for (const p of PLATFORM_ORDER) out.push(await replaceDeals(p, mockDeals(p)));
    return out;
  }

  // 실제 수집 (현재 알리 API만 — 키 있을 때 데이터, 없으면 보존)
  const out: UpsertResult[] = [];
  out.push(await replaceDeals("ali", await collectAliexpress()));
  // 지마켓/11번가: 안정적 소스(텐핑 제휴 네트워크/헤드리스 워커) 연결 전까지 보류(빈 배열→보존)
  out.push(await replaceDeals("gmarket", []));
  out.push(await replaceDeals("11st", []));
  return out;
}
