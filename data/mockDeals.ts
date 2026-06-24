import type { Deal, Platform } from "@/lib/types";

// 데모용 mock 데이터. 실데이터 연동 시 Supabase fetch로 교체.
// dealEndAt은 "지금부터 N초 뒤"로 생성해 카운트다운이 살아있게 함.
type Seed = Omit<Deal, "id" | "dealEndAt"> & { endInSeconds: number };

const seeds: Record<Platform, Seed[]> = {
  gmarket: [
    {
      platform: "gmarket",
      productName: "퐁퐁 친환경 주방세제 오렌지 980ml + 리필 1.2L 3개",
      productUrl: "https://www.gmarket.co.kr/n/superdeal",
      discountRate: 45,
      salePrice: 9900,
      isSoldout: false,
      endInSeconds: 29801,
    },
    {
      platform: "gmarket",
      productName: "스파크 찬물세척 실내건조 세탁세제 9Kg 1+1",
      productUrl: "https://www.gmarket.co.kr/n/superdeal",
      discountRate: 39,
      salePrice: 20900,
      isSoldout: false,
      endInSeconds: 29801,
    },
    {
      platform: "gmarket",
      productName: "아웃도어프로덕츠 스탠다드 로고 티셔츠 5컬러",
      productUrl: "https://www.gmarket.co.kr/n/superdeal",
      discountRate: 44,
      salePrice: 16240,
      isSoldout: false,
      endInSeconds: 29801,
    },
  ],
  "11st": [
    {
      platform: "11st",
      productName: "식탁정복 소불고기 500g, 3팩",
      productUrl: "https://deal.11st.co.kr",
      discountRate: 30,
      salePrice: 14980,
      isSoldout: false,
      endInSeconds: 33236,
    },
    {
      platform: "11st",
      productName: "바프 허니버터아몬드 파티박스 20gX25",
      productUrl: "https://deal.11st.co.kr",
      discountRate: 14,
      salePrice: 16920,
      isSoldout: true,
      endInSeconds: 33236,
    },
    {
      platform: "11st",
      productName: "바프 허니버터아몬드 마늘버터어묵 20gX25",
      productUrl: "https://deal.11st.co.kr",
      discountRate: 14,
      salePrice: 16920,
      isSoldout: false,
      endInSeconds: 33236,
    },
  ],
  ali: [
    {
      platform: "ali",
      productName: "미담채 국산 전라도 배추김치 포기김치 3kg/5kg 외",
      productUrl: "https://www.aliexpress.com/ssr/300001014/Flashdeal",
      discountRate: 36,
      salePrice: 8230,
      isSoldout: false,
      endInSeconds: 29544,
    },
    {
      platform: "ali",
      productName: "요거프레소 200ml 카페라떼 10컵 + 카페모카 10컵",
      productUrl: "https://www.aliexpress.com/ssr/300001014/Flashdeal",
      discountRate: 31,
      salePrice: 14970,
      isSoldout: false,
      endInSeconds: 29544,
    },
    {
      platform: "ali",
      productName: "고기중독 소고기모듬 1kg 구이용 안창살 토시살",
      productUrl: "https://www.aliexpress.com/ssr/300001014/Flashdeal",
      discountRate: 25,
      salePrice: 23150,
      isSoldout: false,
      endInSeconds: 29544,
    },
  ],
  coupang: [],
  ohou: [],
};

function buildDeals(): Deal[] {
  const base = Date.now();
  const deals: Deal[] = [];
  (Object.keys(seeds) as Platform[]).forEach((platform) => {
    seeds[platform].forEach((seed, i) => {
      const { endInSeconds, ...rest } = seed;
      deals.push({
        ...rest,
        id: `${platform}-${i + 1}`,
        dealEndAt: new Date(base + endInSeconds * 1000).toISOString(),
      });
    });
  });
  return deals;
}

export const mockDeals: Deal[] = buildDeals();

export function getDealsByPlatform(platform: Platform): Deal[] {
  return mockDeals.filter((d) => d.platform === platform);
}
