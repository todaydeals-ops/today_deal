// 미디어 패밀리 정본 — 푸터 브랜드 블록과 교차유도 팝업이 같은 데이터를 쓴다.
//
// 카피 원칙: "부르기 전 5분 셀프체크"처럼 **읽는 순간 무슨 사이트인지 딱 이해되는** 문구.
// 추상적·시적 표현("광고가 끝나는 곳에서 시작하는 기준")은 쓰지 않는다.
// 독자가 자기 상황을 떠올릴 수 있어야 한다.
// ※ 2026-08-10 Gemini·Groq 교차검증을 거친 문구다. 바꿀 때도 교차검증할 것.
//   (오늘의딜 desc 는 2026-08-18 Gemini·OpenRouter 재검증 후 교체)
//
// ★새 미디어를 추가하면 여기 한 줄만 넣으면 푸터·팝업이 함께 따라온다.
import { SUB_ORIGIN } from "@/lib/magazine/subdomain";

export type BrandKey = "deal" | "sleep" | "pill" | "beauty" | "b4as" | "sponsor";

export interface Brand {
  key: BrandKey;
  name: string;
  desc: string; // 푸터 한 줄 — 12자 안팎
  hook: string; // 팝업 문장 — 한 문장, 상황을 떠올리게
  url: string;
  color: string;
}

export const BRANDS: Brand[] = [
  {
    key: "deal", name: "오늘의딜",
    // 구 "살 물건 정하고, 싸게 사고" — 독자 상황이 아니라 사이트 이용 순서를 나열한 문구였고,
    // 고르기와 싸게 사기를 한 줄에 우겨넣어 어색했다(형제 넷은 전부 한 가지만 말한다).
    // 가전으로 좁히지 않은 것은 리빙·디지털까지 다루기 때문이다.
    desc: "사기 전에 뭘 봐야 할까",
    hook: "가전·리빙·디지털, 사기 전에 뭘 봐야 하는지 정리했습니다.",
    url: "https://www.todaydeals.co.kr", color: "#ff5a3c",
  },
  {
    key: "sleep", name: "잠자리연구소",
    desc: "잠 안 올 때 뭐부터 바꿀까",
    hook: "잠이 안 오면 매트리스부터 습관까지, 뭐부터 손대면 되는지 정리했습니다.",
    url: SUB_ORIGIN.sleep, color: "#3f5a54",
  },
  {
    key: "pill", name: "알약연구소",
    desc: "영양제 사기 전 5분 확인",
    hook: "그 영양제가 나한테 맞는지, 사기 전 5분이면 확인됩니다.",
    url: SUB_ORIGIN.pill, color: "#8a6a3a",
  },
  {
    key: "beauty", name: "성분연구소",
    desc: "이 성분, 내 피부에 맞을까",
    hook: "화장품 성분표에서 뭘 보면 되는지, 성분별로 정리했습니다.",
    url: SUB_ORIGIN.beauty, color: "#8a5a6a",
  },
  {
    key: "b4as", name: "AS연구소",
    desc: "부르기 전 5분 셀프체크",
    hook: "기사님 부르기 전에, 5분이면 끝나는 것들이 있습니다.",
    url: SUB_ORIGIN.b4as, color: "#38539a",
  },
  {
    key: "sponsor", name: "협찬연구소",
    desc: "이 방송, 누가 돈을 냈을까",
    hook: "낮 방송에 나온 그 원료, 같은 날 어디서 팔렸는지 시각으로 정리했습니다.",
    url: SUB_ORIGIN.sponsor, color: "#3f5a7a",
  },
];

/** 현재 호스트로 지금 보고 있는 브랜드를 판별한다(팝업이 자기 브랜드를 권하지 않게). */
export function brandKeyFromHost(host: string): BrandKey {
  const h = host.toLowerCase();
  if (h.startsWith("goodsleep")) return "sleep";
  if (h.startsWith("pill")) return "pill";
  if (h.startsWith("beauty")) return "beauty";
  if (h.startsWith("b4as")) return "b4as";
  if (h.startsWith("sponsor")) return "sponsor";
  return "deal";
}
