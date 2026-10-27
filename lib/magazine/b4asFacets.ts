// AS 셀프체크 목록의 "제품 · 증상" 필터 분류 — 키워드 규칙.
//
// ★DB 에 제품·증상 필드가 없다(총괄 결정, 2026-10-27). 글의 제목·부제·요약에서 제품명과 증상 키워드를 찾아 붙인다.
// ★light 목록(lib/data/magazine.ts `light: true`)은 body_html 을 받지 않으므로 RAIL 안의 tags·이미지는 쓰지 못한다.
//   그래서 재료는 title · subtitle · excerpt 세 가지뿐이다.
//
// 원칙
// 1) 제품은 글당 하나다. 맞는 게 없으면 undefined — 억지로 넣지 않는다("전체"에서만 보인다).
//    제목 → 부제 → 요약 순으로 찾고, 앞 단계에서 하나라도 걸리면 거기서 끝낸다(요약에는 다른 제품 이름이 자주 섞인다).
//    규칙은 위에서 아래로 처음 맞는 것이 이긴다 — 구체적인 것(김치냉장고)을 일반적인 것(냉장고) 앞에 둔다.
//    label 이 null 인 규칙은 "이건 이 분류의 칩에 없는 제품이다"라고 먼저 가져가서, 엉뚱한 칩으로 새는 걸 막는다.
// 2) 증상은 글 하나가 여러 개일 수 있다(실외기 글은 소음·진동이자 누수). 건수는 그 증상을 가진 글 수라 합이 전체보다 클 수 있다.
//    카드에 붙는 증상 태그는 PRIORITY 순서의 첫 번째 하나다.
// 3) 칩 목록은 시안(대형가전 = 세탁기·냉장고·에어컨·보일러)을 그대로 앞에 두고, 실제 글이 2편 이상 있는 제품만 뒤에 덧붙였다.
//
// ★새 제품을 칩에 올릴 땐 CATS[분류].chips 와 rules 에 같이 넣고, 실제 발행글 제목으로 분류 결과를 눈으로 확인한다.
//   (2026-10-27 검증: 발행 150편 중 제품 127편 84.7% 분류, 눈으로 본 명백한 오분류 0건. 미발행 28편은 검증하지 못했다.)

export const B4AS_SYMPTOMS = ["작동 이상", "에러코드", "온도·성능", "소음·진동", "누수"] as const;
export type B4asSymptom = (typeof B4AS_SYMPTOMS)[number];

type Rule = [label: string | null, re: RegExp];
interface CatFacet {
  chips: string[]; // 화면에 보이는 순서(시안 항목 먼저)
  rules: Rule[]; // 매칭 우선순위
}

const CATS: Record<string, CatFacet> = {
  major: {
    chips: ["세탁기", "냉장고", "에어컨", "보일러", "건조기", "김치냉장고"],
    rules: [
      ["건조기", /건조기/],
      ["김치냉장고", /김치|딤채/],
      ["세탁기", /세탁기|트롬/],
      ["냉장고", /냉장고|제빙기/],
      ["에어컨", /에어컨|휘센|실외기/],
      ["보일러", /보일러/],
      [null, /스타일러|히터/],
    ],
  },
  mobile: {
    chips: ["스마트폰", "태블릿", "워치", "충전"],
    rules: [
      ["태블릿", /갤럭시\s?탭|아이패드|태블릿/],
      ["워치", /워치|스마트\s?밴드|미밴드|핏빗/],
      [null, /버즈|에어팟|이어폰|이북|킨들|크레마|리디페이퍼/],
      ["스마트폰", /갤럭시|아이폰|스마트폰|휴대폰|핸드폰|\bsim\b|esim|유심/i],
      ["충전", /무선\s?충전|충전기|파워\s?스테이션|보조\s?배터리/],
    ],
  },
  kitchen: {
    chips: ["전자레인지", "인덕션", "밥솥", "커피머신", "식기세척기", "믹서·착즙기", "오븐·에어프라이어"],
    rules: [
      ["식기세척기", /식기\s?세척기|디오스/],
      ["전자레인지", /전자레인지/],
      ["인덕션", /인덕션|전기레인지|하이라이트/],
      ["밥솥", /밥솥/],
      ["커피머신", /커피\s?머신|커피\s?그라인더|그라인더|캡슐/],
      ["믹서·착즙기", /믹서|블렌더|착즙기|주서/],
      ["오븐·에어프라이어", /오븐|에어프라이어|토스터/],
      [null, /제빵기|전기그릴|전기포트|음식물처리기|가스레인지|건조기/],
    ],
  },
  living: {
    chips: ["청소기", "공기청정기", "정수기", "전기장판", "비데", "가습·제습기", "선풍기"],
    rules: [
      ["정수기", /정수기/],
      ["공기청정기", /공기\s?청정기/],
      ["청소기", /청소기|코드제로|다이슨/],
      ["전기장판", /전기\s?장판|온수\s?매트/],
      ["비데", /비데/],
      ["가습·제습기", /가습기|제습기|제습/],
      ["선풍기", /선풍기|서큘레이터/],
      [null, /재봉틀|다리미/],
    ],
  },
  av: {
    chips: ["TV", "사운드바", "카메라·드론", "게임기", "이어폰·스피커"],
    rules: [
      ["사운드바", /사운드바/],
      ["이어폰·스피커", /에어팟|이어폰|이어버즈|버즈|헤드폰|스피커/],
      ["게임기", /닌텐도|스위치|PS5|플레이스테이션|컨트롤러|게임기|조이콘/i],
      ["카메라·드론", /카메라|액션캠|미러리스|DSLR|드론/i],
      ["TV", /(^|[^A-Za-z])TV(?![A-Za-z])|티비|스마트TV/i],
      [null, /프로젝터|HDMI|턴테이블|리시버/i],
    ],
  },
  pc: {
    chips: ["노트북", "모니터", "프린터", "외장하드", "웹캠·마이크", "데스크톱·윈도우"],
    rules: [
      ["웹캠·마이크", /웹캠|마이크/],
      [null, /그래픽\s?태블릿|NAS|키보드·마우스/i],
      ["노트북", /노트북|갤럭시북|맥북|랩탑|(^|\s)(LG\s?)?그램/],
      ["모니터", /모니터/],
      ["프린터", /프린터|인쇄/],
      ["외장하드", /외장\s?하드|USB|SSD|HDD/i],
      ["데스크톱·윈도우", /데스크톱|윈도우|블루스크린/],
      [null, /키보드|마우스/],
    ],
  },
  wellness: {
    chips: ["고데기·드라이어", "면도기·이발기", "안마의자·마사지기", "체중계·혈압계·체온계", "구강케어"],
    rules: [
      ["고데기·드라이어", /고데기|에어랩|컬링|드라이어/],
      ["면도기·이발기", /면도기|이발기|클리퍼/],
      ["안마의자·마사지기", /안마|마사지/],
      ["체중계·혈압계·체온계", /체중계|혈압계|체온계/],
      ["구강케어", /전동\s?칫솔|구강\s?세정기|칫솔/],
      [null, /제모기|IPL|네블라이저|족욕기|저주파|TENS|워킹패드|러닝머신|찜질|온열/i],
    ],
  },
  service: {
    chips: ["인터넷", "공유기", "IPTV", "도어락·비디오폰", "스마트홈"],
    rules: [
      ["IPTV", /IPTV|셋톱/i],
      ["공유기", /공유기|iptime|아이피타임|메시|증폭기|펌웨어/i],
      ["스마트홈", /홈캠|CCTV|스마트\s?플러그|스마트\s?콘센트/i],
      ["도어락·비디오폰", /도어락|도어폰|비디오폰|월패드/],
      [null, /데이터|통화/], // 휴대폰 회선 문제라 "인터넷" 칩(집 인터넷)에 넣지 않는다
      ["인터넷", /인터넷|와이파이|모뎀|넷플릭스|유튜브|스트리밍/],
      [null, /계정|로그인|차단기|동파|정전|콘센트|누전/],
    ],
  },
  car: {
    chips: ["시동·배터리", "경고등", "블랙박스", "전동킥보드"],
    rules: [
      ["전동킥보드", /킥보드|전기\s?자전거|이스쿠터/],
      ["블랙박스", /블랙박스/],
      [null, /청소기|에어컨|타이어|와이퍼|헤드라이트|전조등/],
      ["시동·배터리", /시동|방전|배터리/],
      ["경고등", /경고등|엔진\s?오일|브레이크|경고/],
    ],
  },
};

/** 분류의 제품 칩(표시 순서). 분류가 없으면(= 전체 보기) 빈 배열 — 제품은 분류 안에서만 고른다. */
export function b4asProductChips(catKey?: string): string[] {
  return (catKey && CATS[catKey]?.chips) || [];
}

const norm = (s: string) => s.toLowerCase().replace(/\s+/g, "");

export interface FacetSource {
  title: string;
  subtitle?: string;
  excerpt?: string;
}

function findProduct(catKey: string | undefined, a: FacetSource): string | undefined {
  const rules = catKey ? CATS[catKey]?.rules : undefined;
  if (!rules) return undefined;
  for (const text of [a.title, a.subtitle, a.excerpt]) {
    if (!text) continue;
    for (const [label, re] of rules) {
      if (re.test(text)) return label ?? undefined; // null 은 "이 분류 칩에 없는 제품" — 여기서 끝낸다
    }
  }
  return undefined;
}

// ── 증상 규칙 ──
// 작동 이상은 맨 마지막 "넓은 그물"이다. 시안에서도 "탈수가 안 될 때"가 작동 이상으로 들어간다.
const SYMPTOM_RULES: Record<B4asSymptom, RegExp> = {
  에러코드: /에러|오류|코드(?!제로)|표시|경고등/,
  누수: /누수|물\s?(?:이\s?)?(?:새|샐|샌|샘|떨어|흐르)|새요|결로|동파|침수/,
  "소음·진동": /소음|진동(?!\s?약)|시끄|요란|떨림|떨릴|떨려|떨어요|흔들|덜덜|웅웅|드르륵/,
  "온도·성능": /시원하지|안\s?시원|찬\s?바람|냉각|냉방|냉동|미지근|안\s?데워|안\s?뜨거|안\s?따뜻|뜨거|뜨겁|발열|과열|열이|온도|식어요|안\s?내려|화력|약해|약함|약할|느려|느림|느리|흡입력|빨리\s?닳|닳을|배터리\s?(?:급감|수명)|성능|속도|안\s?마를|제습이\s?안|효과|오차|들쑥날쑥|오락가락|다르게|수치가\s?다르/,
  "작동 이상": /안\s?켜|안\s?되|안\s?됨|안\s?돼|안\s?될|안\s?돌|안\s?나|안\s?열|안\s?잡|안\s?울|안\s?움직|안\s?눌|안\s?먹|안\s?갈|안\s?섞|안\s?익|안\s?깎|안\s?들|안\s?보|안\s?뜰|안\s?잡히|안\s?차|안\s?오|안\s?내려|인식\s?(?:안|불)|끊김|끊길|끊기|꺼짐|꺼질|멈추|멈출|먹통|작동|부팅|전원|충전\s?(?:이\s?)?안|연결\s?안|이륙|점화|시동|오프라인|반응|신호\s?없|신호없|화면\s?안|소리\s?안|소리\s?작|엉킬|엉킴|박힘|드리프트|까맣게|흐릿|깜빡|깜박|고장/,
};
const PRIORITY: B4asSymptom[] = ["에러코드", "누수", "소음·진동", "온도·성능", "작동 이상"];

function findSymptoms(a: FacetSource): B4asSymptom[] {
  // 제목 → 부제 → 요약 순으로, 처음 하나라도 걸린 단계에서 끝낸다(부제·요약은 곁다리 단어가 많아 앞 단계를 덮어쓰면 오분류가 늘었다).
  for (const text of [a.title, a.subtitle, a.excerpt]) {
    if (!text) continue;
    const out = PRIORITY.filter((s) => SYMPTOM_RULES[s].test(text));
    if (out.length) return out;
  }
  return [];
}

export interface Facets {
  /** 제품 칩에 걸리는 이름. 없으면 undefined(전체에서만 보인다). */
  product?: string;
  /** 해당하는 증상 전부(PRIORITY 순). */
  symptoms: B4asSymptom[];
  /** 카드 태그로 쓰는 대표 증상 하나. */
  symptom?: B4asSymptom;
}

export function b4asFacetsOf(catKey: string | undefined, a: FacetSource): Facets {
  const symptoms = findSymptoms(a);
  return { product: findProduct(catKey, a), symptoms, symptom: symptoms[0] };
}

/**
 * 카테고리 내 검색 — 시안과 같이 공백으로 나눈 단어 중 하나라도 들어 있으면 통과.
 * 공백·대소문자는 무시한다(4E = 4e, "안됨" = "안 됨"). 재료는 제목·부제·제품·증상 라벨·분류명이다.
 * (본문·tags 는 light 목록에 없어서 못 본다 — 에러코드가 제목에 있는 글은 잡히고, 본문 속 코드만 있는 글은 못 잡는다.)
 */
export function b4asQueryTerms(q: string): string[] {
  return q.trim().split(/\s+/).filter(Boolean).slice(0, 6).map(norm);
}
export function b4asMatchesQuery(terms: string[], a: FacetSource, f: Facets, catLabel?: string): boolean {
  if (terms.length === 0) return true;
  const hay = norm([a.title, a.subtitle ?? "", f.product ?? "", ...f.symptoms, catLabel ?? ""].join(" "));
  return terms.some((t) => hay.includes(t));
}
