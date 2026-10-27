// 홈 정적 카피 — 시안(오늘의딜 홈.dc.html)의 pillars·as·chips 를 그대로 옮겼다. 링크만 실제 라우트(lib/nav.ts)로 잇는다.
import { NAV } from "@/lib/nav";

export const HOME_CHIPS = ["세탁기 에러코드", "청년월세", "마그네슘", "와이파이 느림"];

// 4개 축 카드 — 하위 링크 3개는 NAV 의 소메뉴 href 를 순서대로 쓴다(AS 는 묶음 머리에 페이지가 없어 묶음의 첫 분류로 잇는다).
const linksOf = (key: string): string[] => {
  const g = NAV.find((x) => x.key === key)!;
  return g.items.map((it) => it.href ?? it.children?.[0]?.href ?? g.href ?? "/");
};
export const PILLARS = [
  { no: "01", en: "WIKI", title: "생활백과", href: "/wiki", img: "/renewal/pillar-wiki.jpg", alt: "탁상 달력과 쇼핑백, 서류 봉투가 놓인 책상",
    desc: "세일 일정·신청과 환급·영상 속 그 제품, 찾아보는 정본",
    links: ["세일 달력", "신청·환급 달력", "영상 속 그 제품"], hrefs: linksOf("wiki") },
  { no: "02", en: "SELF CHECK", title: "AS 셀프체크", href: "/b4as", img: "/renewal/pillar-as.jpg", alt: "문이 열린 세탁기 앞에 놓인 수건과 점검 체크리스트",
    desc: "기사님 부르기 전, 5분이면 되는 셀프체크",
    links: ["가전", "디지털", "헬스·통신·자동차"], hrefs: linksOf("b4as") },
  { no: "03", en: "HEALTH & BEAUTY", title: "건강·뷰티", href: linksOf("health")[0], img: "/renewal/pillar-health.jpg", alt: "협탁 위 영양제 병과 물컵, 안대가 놓인 침실",
    desc: "잠·영양제·화장품 성분, 근거부터 확인",
    links: ["수면 — 잠 안 올 때", "영양제 — 사기 전 5분", "뷰티 성분 — 내 피부에 맞을까"], hrefs: linksOf("health") },
  { no: "04", en: "MAGAZINE", title: "매거진", href: "/#guides", img: "/renewal/pillar-magazine.jpg", alt: "펼친 잡지와 안경, 커피잔이 놓인 원목 테이블",
    desc: "가전·리빙·디지털, 사기 전에 볼 기준",
    links: ["팩트체크", "스마트가이드", "트렌드랩"], hrefs: linksOf("magazine") },
];

// AS 셀프체크 모듈 — 탭(가전/디지털/헬스·통신·자동차) × 카테고리 카드. 카드 태그(대표 제품)는 시안 그대로.
export const AS_ITEMS: Record<string, string[]> = {
  major: ["세탁기", "냉장고", "에어컨", "보일러"],
  kitchen: ["전자레인지", "인덕션", "밥솥", "커피머신"],
  living: ["청소기", "공기청정기", "정수기", "전기장판"],
  mobile: ["스마트폰", "태블릿", "워치", "충전"],
  pc: ["노트북", "모니터", "프린터", "외장하드"],
  av: ["TV", "사운드바", "카메라", "게임기"],
  wellness: ["고데기", "면도기", "안마의자", "체중계"],
  service: ["인터넷", "공유기", "IPTV", "도어락"],
  car: ["시동", "배터리", "경고등", "전동킥보드"],
};
export const AS_IMG_ALT: Record<string, string> = {
  major: "세탁기와 냉장고가 놓인 밝은 다용도실", kitchen: "전자레인지·밥솥·커피머신이 놓인 주방 조리대", living: "청소기와 공기청정기가 있는 거실",
  mobile: "스마트폰·태블릿·워치와 충전 케이블", pc: "노트북과 모니터, 프린터가 있는 책상", av: "TV와 사운드바가 있는 거실",
  wellness: "고데기·면도기·체중계가 놓인 욕실 선반", service: "공유기와 도어락이 보이는 현관 선반", car: "점프 케이블과 자동차 열쇠가 놓인 주차장",
};

// 최신 가이드 코너 탭 — 라벨 / URL 의 corner 키
export const CORNER_TABS: { label: string; corner?: string }[] = [
  { label: "전체" },
  { label: "팩트체크", corner: "factcheck" },
  { label: "스마트가이드", corner: "smartguide" },
  { label: "트렌드랩", corner: "trendlab" },
  { label: "AS셀프체크", corner: "repair" },
];

// 큐레이션 리포트 커버 이미지가 있는 리포트 슬러그(public/renewal/report-<slug>.jpg, 3:4). 새 리포트가 생기면 이미지를 만들고 여기에 추가한다.
export const REPORT_COVER_SLUGS = [
  "kitchen-living-guide-2-2606",
  "kitchen-living-guide-1-2606",
  "digital-device-selection-2606",
  "home-appliance-selection-2606",
  "home-appliance-maintenance-2606",
];
