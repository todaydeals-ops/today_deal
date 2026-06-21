// 매거진 후킹 문구 — 딜 사이트에서 매거진으로 끌어오는 호기심 질문(슬러그별).
// 새 글은 여기 추가하면 되고, 없으면 subtitle/title로 자동 폴백.
export const MAGAZINE_HOOKS: Record<string, string> = {
  "refrigerator-capacity-guide": "냉장고, 우리 집은 몇 L가 맞을까요?",
  "induction-vs-highlight-vs-gas": "인덕션이 가스보다 전기료 더 나올까요?",
  "aircon-longrun-care": "에어컨, 외출할 땐 꺼야 할까요 켜둬야 할까요?",
  "collagen-fact-check": "먹는 콜라겐, 진짜 피부까지 갈까요?",
  "clothes-dryer-trend-guide": "건조기 ‘자동세척’, 정말 청소 안 해도 될까요?",
  "monitor-size-refresh-guide": "모니터, 27인치가 ‘스위트 스폿’인 이유 아세요?",
  "washer-odor-care": "세탁기 냄새, 통세척보다 먼저 할 게 있다는데?",
  "water-purifier-direct-vs-tank": "직수 정수기가 정말 더 위생적일까요?",
  "supplement-dose-absorption-fact-check": "영양제 ‘고함량’, 많이 먹을수록 좋을까요?",
  "humidifier-type-trend-guide": "가습기, 가열식이 안전할까요 초음파가 나을까요?",
  "summer-electricity-bill-guide": "에어컨 켜면 전기료 폭탄? 누진제 진짜 계산법 아세요?",
  "sunscreen-spf-pa-fact-check": "선크림, SPF 높을수록 정말 좋을까요?",
  "phone-battery-longevity-guide": "스마트폰, 밤새 충전하면 배터리 망가질까요?",
};

export function hookFor(a: { slug: string; title: string; subtitle?: string }): string {
  return MAGAZINE_HOOKS[a.slug] ?? a.subtitle ?? a.title;
}
