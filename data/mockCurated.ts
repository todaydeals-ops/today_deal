import type { CuratedDeal, PartnerProfile } from "@/lib/types";

// 큐레이션 파트너 프로필 (링크인바이오 헤더). 실서비스는 가족 파트너 정보로 교체.
export const partnerProfile: PartnerProfile = {
  name: "오늘의딜 큐레이터",
  handle: "@oneuldeal_pick",
  tagline: "인생 꿀템만 직접 써보고 골라 추천해요 🛒",
  instagramUrl: "https://instagram.com/",
};

// 데모용 추천딜(쿠팡 큐레이션) mock. 실서비스는 관리자 수동 등록 + 쿠팡 파트너스 API.
// seq: 추천 번호(클수록 최신). 화면은 seq 내림차순(최신순)으로 정렬.
export const mockCurated: CuratedDeal[] = [
  {
    id: "c8",
    seq: 8,
    productName: "필립스 5000 시리즈 에어프라이어 대용량 6.2L",
    category: "가전",
    affiliateUrl: "https://link.coupang.com/a/example8",
    discountRate: 33,
    salePrice: 129000,
    adminNote: "용량 큰데 자리 안 차지함. 4인 가족도 한 번에 끝.",
    isActive: true,
  },
  {
    id: "c7",
    seq: 7,
    productName: "오늘의집 워시드 코튼 사계절 차렵이불 세트",
    category: "생활",
    affiliateUrl: "https://link.coupang.com/a/example7",
    discountRate: 28,
    salePrice: 39900,
    adminNote: "촉감 미쳤다. 이 가격에 이 퀄리티 흔치 않음.",
    isActive: true,
  },
  {
    id: "c6",
    seq: 6,
    productName: "한샘 멀바우 4단 원목 선반 책장 (화이트/오크)",
    category: "가구",
    affiliateUrl: "https://link.coupang.com/a/example6",
    discountRate: 41,
    salePrice: 58000,
    adminNote: "조립 쉽고 마감 깔끔. 자취방 분위기 살아남.",
    isActive: true,
  },
  {
    id: "c5",
    seq: 5,
    productName: "애경 트리오 액체형 주방세제 1.2L x 4개",
    category: "생활",
    affiliateUrl: "https://link.coupang.com/a/example5",
    discountRate: 30,
    salePrice: 11900,
    adminNote: "어차피 쓰는 거 쟁여두기 좋은 타이밍.",
    isActive: true,
  },
  {
    id: "c4",
    seq: 4,
    productName: "테팔 매직핸즈 인덕션 프라이팬 3종 세트",
    category: "주방",
    affiliateUrl: "https://link.coupang.com/a/example4",
    discountRate: 52,
    salePrice: 49900,
    adminNote: "손잡이 분리형이라 수납 굿. 인덕션 겸용.",
    isActive: true,
  },
  {
    id: "c3",
    seq: 3,
    productName: "곰곰 국내산 신선 계란 30구 (대란)",
    category: "식품",
    affiliateUrl: "https://link.coupang.com/a/example3",
    discountRate: 20,
    salePrice: 7980,
    adminNote: "로켓프레시 새벽배송. 가성비 끝.",
    isActive: true,
  },
  {
    id: "c2",
    seq: 2,
    productName: "락앤락 비스프리 모듈러 밀폐용기 24P 풀세트",
    category: "주방",
    affiliateUrl: "https://link.coupang.com/a/example2",
    discountRate: 45,
    salePrice: 32900,
    adminNote: "주방 정리 끝판왕. 이 구성에 이 가격은 거의 못 봄.",
    isActive: true,
  },
  {
    id: "c1",
    seq: 1,
    productName: "샤오미 미지아 무선 청소기 G10 플러스 가정용 핸디",
    category: "가전",
    affiliateUrl: "https://link.coupang.com/a/example1",
    discountRate: 38,
    salePrice: 189000,
    adminNote: "흡입력 대비 가격이 깡패. 원룸·전세살이 필수템.",
    isActive: true,
  },
];

// 활성 추천딜을 최신순(seq 내림차순)으로 반환
export function getActiveCurated(): CuratedDeal[] {
  return mockCurated
    .filter((d) => d.isActive)
    .sort((a, b) => b.seq - a.seq);
}
