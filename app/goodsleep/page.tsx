import type { Metadata } from "next";
import { sleepHref } from "@/lib/magazine/subdomain";
import HubPage, { type HubConfig } from "@/components/hub/HubPage";
import { SLEEP_CATEGORIES, sleepCategoryByKey } from "@/lib/magazine/sleepCategories";

// 잠자리연구소 — 오늘의딜 파생 수면·침구 전문 미디어. field="수면·침구" + 고유 6분류.
// 2026-10-27 리뉴얼: 화면은 건강·뷰티 허브 공용 컴포넌트(components/hub)가 그린다. 이 파일은 SEO·조회 조건·카피만 가진다.
export const revalidate = 3600;

const CONFIG: HubConfig = {
  lab: "sleep",
  field: "수면·침구",
  categories: SLEEP_CATEGORIES,
  eyebrow: "SLEEP LAB",
  crumb: "수면",
  headline: ["세상의 모든 잠, 오직 ", "과학적 근거", "로만 말합니다."],
  lead: "해외 전문 수면 연구를 기반으로 아이부터 부모님까지, 인생 단계마다 꼭 필요한 수면 솔루션을 정립합니다.",
  catLeadTail: "해외 수면 연구 근거만 골라 정리했습니다.",
  listTitle: "수면 칼럼",
  readLabel: "칼럼 읽기",
  emptyText: "이 분류의 칼럼을 준비하고 있어요.",
  shortLabel: "수면",
};

// ★분류 페이지(?cat=)는 자기 자신을 canonical 로 가리켜야 한다.
// 정적 metadata 로 두면 6개 분류가 전부 홈을 canonical 로 신고해서, 사이트맵에
// 제출해놓고 페이지 스스로 "나는 홈의 사본"이라고 말하는 꼴이 된다 — 색인이 안 된다
// (2026-08-18 GSC "리디렉션이 포함된 페이지" 경고로 발견. b4as 만 generateMetadata 라 멀쩡했다).
export async function generateMetadata({ searchParams }: { searchParams: Promise<{ cat?: string }> }): Promise<Metadata> {
  const cat = sleepCategoryByKey((await searchParams).cat);
  if (!cat) {
    return {
      alternates: { canonical: sleepHref() },
      title: "수면 가이드 — 잠 안 올 때 뭐부터 바꿀까 | 오늘의딜",
      description: "해외 수면 연구를 근거로 검증합니다. 성장하는 잠·공부잘하는 잠·일잘하는 잠·조화로운 잠·늙지않는 잠·잠자리장비학.",
    };
  }
  return {
    alternates: { canonical: sleepHref(cat.key) },
    title: `${cat.label} | 수면 · 오늘의딜`,
    description: `${cat.angle}을(를) 중심으로, 해외 수면 연구 근거만 골라 정리했습니다.`,
  };
}

export default async function GoodSleepHome({ searchParams }: { searchParams: Promise<{ cat?: string; page?: string }> }) {
  const sp = await searchParams;
  return <HubPage config={CONFIG} cat={sleepCategoryByKey(sp.cat)} page={Math.max(1, Number(sp.page) || 1)} />;
}
