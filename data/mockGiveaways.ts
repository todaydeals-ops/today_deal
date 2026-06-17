import type { Giveaway } from "@/lib/types";

// 데모용 나눔이벤트 mock. 실서비스는 예산 책정 후 직접 경품 지급.
// 주간: 1~2만원대, 5명 추첨 / 월간: 10~100만원대, 1명 몰아주기.
// 상대 시각으로 생성해 진행/예정/마감 상태가 살아있게 함.
type Seed = Omit<Giveaway, "id" | "startAt" | "endAt"> & {
  startsInDays: number; // 음수면 이미 시작
  endsInDays: number;
};

const seeds: Seed[] = [
  // ── 주간 나눔딜 (매주 · 5명) ──
  {
    type: "weekly",
    title: "이번 주 살림 나눔",
    prizeName: "락앤락 비스프리 밀폐용기 14P 세트",
    description: "약 1만원대 살림템을 매주 5분께. 회원가입 + 마케팅 동의로 응모.",
    winnerCount: 5,
    entryCount: 842,
    startsInDays: -2,
    endsInDays: 5,
  },
  {
    type: "weekly",
    title: "다음 주 예고 — 주방 소모품 나눔",
    prizeName: "곰곰 주방 소모품 종합세트",
    description: "곧 시작합니다. 회원이면 오픈 시 알림을 보내드려요.",
    winnerCount: 5,
    entryCount: 0,
    startsInDays: 5,
    endsInDays: 12,
  },
  // ── 월간 나눔딜 (매월 · 1명 몰아주기) ──
  {
    type: "monthly",
    title: "6월의 대형 경품",
    prizeName: "다이슨 에어랩 멀티 스타일러 컴플리트",
    description: "이달의 대형 경품(약 60만원 상당)을 추첨으로 단 한 분께 몰아드립니다.",
    winnerCount: 1,
    entryCount: 3120,
    startsInDays: -10,
    endsInDays: 18,
  },
];

function buildGiveaways(): Giveaway[] {
  const base = Date.now();
  const day = 24 * 60 * 60 * 1000;
  return seeds.map((s, i) => {
    const { startsInDays, endsInDays, ...rest } = s;
    return {
      ...rest,
      id: `g${i + 1}`,
      startAt: new Date(base + startsInDays * day).toISOString(),
      endAt: new Date(base + endsInDays * day).toISOString(),
    };
  });
}

export const mockGiveaways: Giveaway[] = buildGiveaways();

export function getGiveawaysByType(type: Giveaway["type"]): Giveaway[] {
  return mockGiveaways.filter((g) => g.type === type);
}
