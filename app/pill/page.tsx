import type { Metadata } from "next";
import HubPage, { type HubConfig } from "@/components/hub/HubPage";
import { PILL_CATEGORIES, pillCategoryByKey } from "@/lib/magazine/pillCategories";
import { pillHref } from "@/lib/magazine/subdomain";

// 알약연구소 — 오늘의딜 파생 건강기능식품 검증 미디어. field="건강기능식품" + 고유 7분류(성분 6 + 기초·가이드 1).
// 2026-10-27 리뉴얼: 화면은 건강·뷰티 허브 공용 컴포넌트(components/hub)가 그린다. 이 파일은 SEO·조회 조건·카피만 가진다.
export const revalidate = 3600;

const CONFIG: HubConfig = {
  lab: "pill",
  field: "건강기능식품",
  categories: PILL_CATEGORIES,
  eyebrow: "PILL LAB",
  crumb: "영양제",
  headline: ["그 영양제, ", "임상", "은 뭐라고 말할까."],
  lead: "성분 하나하나, 무엇이 증명됐고 무엇이 아직인지 정리합니다.",
  catLeadTail: "임상 근거가 어디까지 확인됐는지 갈라 정리했습니다.",
  listTitle: "성분 분석",
  readLabel: "분석 읽기",
  emptyText: "이 분류의 성분 분석을 준비하고 있어요.",
  shortLabel: "영양",
};

// 분류 페이지(?cat=)는 자기 자신을 canonical 로 — 정적 metadata 면 전부 홈을 가리켜 색인이 안 된다.
export async function generateMetadata({ searchParams }: { searchParams: Promise<{ cat?: string }> }): Promise<Metadata> {
  const cat = pillCategoryByKey((await searchParams).cat);
  if (!cat) {
    return {
      alternates: { canonical: pillHref() },
      title: "영양제 가이드 — 사기 전 5분, 성분과 근거 | 오늘의딜",
      description: "실제 연구 결과로 성분을 따져봅니다. 눈 건강·관절과 뼈·피로와 간·면역과 장·혈관과 심장·여성과 남성.",
    };
  }
  return {
    alternates: { canonical: pillHref(cat.key) },
    title: `${cat.label} | 영양제 · 오늘의딜`,
    description: `${cat.angle}을(를) 중심으로, 임상 근거가 어디까지 확인됐는지 갈라 정리했습니다.`,
  };
}

export default async function PillHome({ searchParams }: { searchParams: Promise<{ cat?: string; page?: string }> }) {
  const sp = await searchParams;
  return <HubPage config={CONFIG} cat={pillCategoryByKey(sp.cat)} page={Math.max(1, Number(sp.page) || 1)} />;
}
