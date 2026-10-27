import type { Metadata } from "next";
import HubPage, { type HubConfig } from "@/components/hub/HubPage";
import { BEAUTY_CATEGORIES, beautyCategoryByKey } from "@/lib/magazine/beautyCategories";
import { beautyHref } from "@/lib/magazine/subdomain";

// 성분연구소 — 오늘의딜 파생 뷰티·다이어트 성분 검증 미디어. field="뷰티·성분" + 고유 6분류.
// 2026-10-27 리뉴얼: 화면은 건강·뷰티 허브 공용 컴포넌트(components/hub)가 그린다. 이 파일은 SEO·조회 조건·카피만 가진다.
export const revalidate = 3600;

const CONFIG: HubConfig = {
  lab: "beauty",
  field: "뷰티·성분",
  categories: BEAUTY_CATEGORIES,
  eyebrow: "INGREDIENT LAB",
  crumb: "뷰티 성분",
  headline: ["성분을 알면, ", "선택", "이 쉬워집니다."],
  lead: "화제성이나 후기가 아니라, 그 성분이 임상에서 무엇을 증명했고 무엇이 아직인지로 따집니다.",
  catLeadTail: "임상 근거가 어디까지 확인됐는지 갈라 정리했습니다.",
  listTitle: "성분 분석",
  readLabel: "분석 읽기",
  emptyText: "이 분류의 성분 분석을 준비하고 있어요.",
  shortLabel: "성분",
};

// 분류 페이지(?cat=)는 자기 자신을 canonical 로 — 정적 metadata 면 전부 홈을 가리켜 색인이 안 된다.
export async function generateMetadata({ searchParams }: { searchParams: Promise<{ cat?: string }> }): Promise<Metadata> {
  const cat = beautyCategoryByKey((await searchParams).cat);
  if (!cat) {
    return {
      alternates: { canonical: beautyHref() },
      title: "뷰티 성분 가이드 — 이 성분, 내 피부에 맞을까 | 오늘의딜",
      description: "화제성이나 후기가 아니라 임상 근거로 성분을 따집니다. 보습·장벽, 미백·주름, 트러블·모공, 자외선·환경, 두피·모발, 다이어트·바디.",
    };
  }
  return {
    alternates: { canonical: beautyHref(cat.key) },
    title: `${cat.label} | 뷰티 성분 · 오늘의딜`,
    description: `${cat.angle}을(를) 중심으로, 임상 근거가 어디까지 확인됐는지 갈라 정리했습니다.`,
  };
}

export default async function BeautyHome({ searchParams }: { searchParams: Promise<{ cat?: string; page?: string }> }) {
  const sp = await searchParams;
  return <HubPage config={CONFIG} cat={beautyCategoryByKey(sp.cat)} page={Math.max(1, Number(sp.page) || 1)} />;
}
