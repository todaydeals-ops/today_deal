// 오늘의딜 생활백과 — 항목(entry) 스키마.
//
// 매거진 글이 "읽고 끝나는 글"이라면 생활백과 항목은 "필요할 때 찾아보는 정본"이다.
// 항목 하나 = content/wiki/<slug>.json 하나. 빌드 때 정적 페이지로 굽는다(DB 를 읽지 않는다 —
// egress 와 무관하고, 항목은 git 이력으로 관리된다).
//
// ★근거 없는 항목은 만들지 않는다. sources 가 곧 이 항목의 존재 이유다.
//   scripts/wiki-verify.mjs 가 출처 수·분량·문체·연예인 규칙을 검사하고, 통과 못 하면 커밋하지 않는다.

export type WikiType =
  | "video-pick" // 영상 속 그 제품 — 연예인·유튜버가 영상에서 쓴 제품의 정체
  | "sale" // 세일 달력 — 행사 기간·참여몰·작년 실제 일정
  | "ingredient" // 성분 — 영양제·화장품 성분
  | "product" // 제품 — 고르는 법·가격대·흔한 고장·관리
  | "gift" // 선물 — 관계·나이·예산
  | "error-code" // 에러코드 — 브랜드×제품 에러 표시 의미표
  | "apply"; // 신청·환급 달력 — 세금 신고·환급·지원금, 언제 어디서 신청하는지(2026-10-26 신설)
// ★ingredient·error-code 는 2026-10-26 폐지(분야와 중첩) — 타입은 옛 항목 호환용으로만 남긴다. 게이트가 새 항목을 막는다.

export const WIKI_TYPE_LABEL: Record<WikiType, string> = {
  "video-pick": "영상 속 그 제품",
  sale: "세일 달력",
  ingredient: "성분",
  product: "제품",
  gift: "선물",
  "error-code": "에러코드",
  apply: "신청·환급 달력",
};

export type Block =
  | { p: string }
  | { list: string[] }
  | { steps: string[] }
  | { table: { head: string[]; rows: string[][] } }
  | { note: string }; // 주의 상자(안전·금전 손실 등 흐리면 안 되는 경고)

export interface WikiSource {
  label: string;
  url: string;
  kind: "공식" | "후기" | "영상" | "언론";
}

export interface WikiEntry {
  slug: string;
  type: WikiType;
  /** 표제어 — 사전의 "항목 이름". 색인·검색·빵부스러기에 쓴다. 예: "고운발 크림" */
  title: string;
  /** 다른 이름·검색어. 검색창이 이걸로도 찾는다. 예: ["백지영 발크림", "웰빙헬스 고운발"] */
  aliases: string[];
  /** 검색결과 제목 — 앞머리가 사람들이 실제로 치는 검색어여야 한다. 예: "백지영 발크림, 영상 속 노란 통은 어느 회사 것일까" */
  seoTitle: string;
  description: string;
  /** 핵심 요약 정확히 3줄 */
  summary: string[];
  /** 정보 상자 — 백과의 표제 요약표 */
  infobox: { label: string; value: string }[];
  sections: { h: string; blocks: Block[] }[];
  faq: { q: string; a: string }[];
  sources: WikiSource[];
  /** 영상 속 그 제품 전용 */
  video?: {
    id: string; // 유튜브 video_id
    title: string;
    channel: string;
    published: string; // YYYY-MM-DD
    paidAd: "있음" | "없음" | "불명"; // 설명란·화면의 유료광고 포함 표기
    quotes: { t: string; text: string }[]; // 영상에서 실제로 한 말 — "0:13" 같은 시각과 함께
  };
  /** 영상·항목에 등장하는 인물(인물 색인용). 사진은 절대 싣지 않는다. */
  people?: string[];
  /** 세일 달력 전용 */
  sale?: {
    status: "확정" | "미발표";
    start?: string; // 확정일 때만
    end?: string;
    lastYear?: { start: string; end: string; source: string };
    organizer: string;
  };
  /** 신청·환급 달력 전용 — 날짜를 틀리면 독자가 돈을 잃는 영역이라 근거·확인 상태를 필드로 둔다 */
  apply?: {
    agency: string; // 담당 기관 — "국세청"
    where: string; // 신청·조회하는 곳 — "홈택스·손택스, 가까운 세무서"
    cycle: string; // 해마다 돌아오는 시기 — "매년 5월 1일~31일" / "연중 상시"
    basis?: string; // 기한의 법적 근거 — "소득세법 제70조"
    next: {
      status: "확정" | "미발표" | "상시"; // 다가오는 회차가 공고됐는지. 상시 = 기한 없이 언제든
      start?: string; // 확정일 때만 YYYY-MM-DD
      end?: string;
      label?: string; // "2027년 정기 신청" 같은 회차 이름
    };
    lastYear?: { start: string; end: string; source: string }; // 미발표면 직전 회차 실제 일정
  };
  related?: { entries?: string[]; articles?: string[] };
  /** 근거로 쓴 팩트 id(content/research/facts) — 출처가 바뀌면 이 항목도 고친다 */
  facts?: string[];
  created: string; // YYYY-MM-DD
  updated: string; // YYYY-MM-DD
}
