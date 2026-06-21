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
  "tv-oled-qled-lcd": "TV, OLED랑 QLED랑 뭐가 다른지 아세요?",
  "wireless-earbuds-guide": "무선이어폰, ‘고음질 코덱’만 보면 안 되는 이유?",
  "nonstick-pan-care": "코팅 프라이팬, 왜 1년 만에 들러붙을까요?",
  "protein-supplement-fact-check": "단백질 보충제, 진짜 꼭 필요할까요?",
  "smartwatch-wearable-trend": "스마트워치 건강 수치, 어디까지 믿어도 될까요?",
  "stick-vs-robot-vacuum": "무선청소기 vs 로봇청소기, 뭘 사야 후회 없을까요?",
  "wifi-router-guide": "와이파이 약한 방, 비싼 공유기가 답일까요?",
  "sneaker-care": "운동화, 왜 1~2년 만에 밑창이 떨어질까요?",
  "diet-supplement-fact-check": "다이어트 보조제, 진짜 살이 빠질까요?",
  "airfryer-trend": "에어프라이어, 정말 ‘기름 없이 건강’할까요?",
};

export function hookFor(a: { slug: string; title: string; subtitle?: string }): string {
  return MAGAZINE_HOOKS[a.slug] ?? a.subtitle ?? a.title;
}
