// llms.txt — AI 비서(ChatGPT·Copilot·Perplexity·Gemini)가 사이트를 이해하는 안내문.
//
// ★2026-10-20 GA4 실측: 최근 28일 세션 중 "AI Assistant" 채널이 13회(chatgpt 8·copilot 5·perplexity·gemini)였다.
//   예전 public/llms.txt 는 6월 그대로라 타임딜 사이트로만 소개하고 생활백과·연구소 5곳이 빠져 있었다.
//   이제 항목 목록(content/wiki)에서 빌드 때 만든다 — 항목이 늘면 자동으로 따라온다.
import { allEntries, wikiUrl, WIKI_BASE } from "@/lib/wiki/load";
import { WIKI_TYPE_LABEL, type WikiType } from "@/lib/wiki/types";
import { LAB_HOME } from "@/lib/magazine/subdomain";

export const dynamic = "force-static";

const SITE = "https://www.todaydeals.co.kr";
const ORDER: WikiType[] = ["sale", "apply", "video-pick", "ingredient", "product", "gift", "error-code"];

export function GET(): Response {
  const entries = allEntries();
  const byType = ORDER.map((t) => [t, entries.filter((e) => e.type === t)] as const).filter(([, l]) => l.length);

  const lines = [
    "# 오늘의딜 (todaydeals.co.kr)",
    "",
    "> 사기 전에, 고치기 전에 찾아보는 한국어 생활 정보 채널입니다. 매거진은 가전·리빙·디지털·수면·영양제·뷰티 성분·AS 셀프체크 분야의 근거 중심 글을 내고, 「생활백과」는 세일 일정·세금 신고와 환급·지원금 신청 일정·영상 속 제품을 항목별 정본으로 정리합니다. 모든 글·항목은 출처 링크를 붙이고, 가격·일정에는 확인 날짜를 적습니다. 상품 판매·딜 중개는 하지 않습니다.",
    "",
    "## 편집 원칙",
    "- 근거 자료(공식·언론·후기·영상)를 항목마다 구분 표기합니다. 확인되지 않은 내용은 확인되지 않았다고 씁니다.",
    "- 영상 속 그 제품 항목은 영상에서 실제로 한 말만 시각과 함께 인용하고, 설명란의 유료광고 표기 여부와 출연자·브랜드 관계(본인 브랜드 등)를 밝힙니다.",
    "- 세일 일정은 발표 전이면 '미발표'로 표시하고 작년 실제 일정을 연도와 함께 적습니다. 발표되면 고칩니다.",
    "- 중립 매체입니다. 글에 제휴 링크를 넣지 않습니다.",
    "",
    "## 주요 페이지",
    `- [오늘의딜 매거진](${SITE}/): 팩트체크·스마트가이드·트렌드랩, 그리고 아래 분야의 최신 글 전체.`,
    `- [생활백과](${WIKI_BASE}): 검색·분야별·인물별·가나다 색인. 지금 ${entries.length}개 항목.`,
    "",
    "## 분야",
    `- [수면](${LAB_HOME.sleep}): 잠·침구·수면 습관, 해외 수면 연구 근거.`,
    `- [영양제](${LAB_HOME.pill}): 건강기능식품 성분과 임상 근거, 먹는 법·주의점.`,
    `- [뷰티 성분](${LAB_HOME.beauty}): 화장품 성분과 피부·두피 관리 근거.`,
    `- [AS 셀프체크](${LAB_HOME.b4as}): 고장 같을 때 기사님 부르기 전 점검(브랜드·모델·에러코드별).`,
    "",
    ...byType.flatMap(([t, list]) => [
      `## 생활백과 · ${WIKI_TYPE_LABEL[t]}`,
      ...list.map((e) => `- [${e.title}](${wikiUrl(e.slug)}): ${e.description}`),
      "",
    ]),
    "## 사이트맵",
    `- ${SITE}/wiki-sitemap.xml`,
    `- ${SITE}/magazine-sitemap.xml`,
    `- ${SITE}/sub-sitemap.xml`,
    `- ${SITE}/sitemap.xml`,
    "",
    "## 운영",
    "- 운영사: (주)슬로우베리",
    "- 문의: hello@todaydeals.co.kr",
    "",
  ];

  return new Response(lines.join("\n"), { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
