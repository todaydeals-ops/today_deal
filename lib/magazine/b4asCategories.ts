// AS연구소 고유 콘텐츠 분류 — 제품유형 9분류.
//
// ★다른 서브 미디어와 두 가지가 다르다.
// 1) 격리 기준이 field가 아니라 corner="repair"다. AS는 주제가 아니라 상황("고장났다")이라
//    field가 가전·디지털·IT·리빙·주방·자동차로 흩어져 있어 field 격리가 불가능하다.
// 2) 메뉴 라벨(label)과 페이지 title(seoTitle)이 다르다. 분류 목적이 광고 슬롯이 아니라
//    SEO라서다. "대형가전"으로 검색하는 사람은 없고 "세탁기 고장"으로 검색한다.
//    라벨은 짧게 두고 title에 헤드 키워드를 싣는다(사장님 승인 2026-08-10).
//
// 9분류로 나눈 이유도 SEO다. 한 페이지 12편이라 9분류면 분류당 2페이지,
// 모든 글이 홈에서 2클릭 안에 들어온다. 4분류로 묶으면 36편 3페이지가 되어 뒷글이 묻힌다.
//
// ★새 글을 적재하면 반드시 여기 slugs에 등록해야 분류 페이지·관련글이 동작한다.
//   등록 누락은 `node scripts/magazine-catcheck.mjs`로 잡는다.
export interface B4asCategory {
  key: string;      // URL용 ASCII
  label: string;    // 메뉴·배지에 보이는 짧은 이름(헤드 키워드는 seoTitle 이 싣는다)
  en: string;       // 영문 서브
  color: string;    // 점·강조색
  angle: string;    // 카드 설명
  seoTitle: string; // 페이지 <title>·h1 — 헤드 키워드를 싣는다
  slugs: string[];
}

export const B4AS_CATEGORIES: B4asCategory[] = [
  {
    key: "major", label: "대형가전", en: "APPLIANCE", color: "#3f7a6a",
    angle: "세탁기·냉장고·에어컨·보일러",
    seoTitle: "세탁기·냉장고·에어컨 고장 자가진단",
    slugs: ["aircon-outdoor-unit-selfcheck","aircon-weak-cooling-selfcheck","dryer-not-drying-selfcheck","electric-heater-selfcheck","fridge-cooling-selfcheck","ice-maker-selfcheck","kyungdong-boiler-error","lg-dryer-error-code","lg-fridge-error-code","lg-styler-selfcheck","lg-tromm-error-code","lg-whisen-aircon-error","rinnai-boiler-selfcheck","samsung-aircon-selfdiagnosis","samsung-dryer-error-code","samsung-fridge-error","samsung-kimchi-fridge-selfcheck","samsung-washer-error-code","washer-drain-selfcheck","wine-fridge-selfcheck","winia-kimchi-fridge"],
  },
  {
    key: "mobile", label: "모바일", en: "MOBILE", color: "#38539a",
    angle: "스마트폰·태블릿·워치·충전",
    seoTitle: "스마트폰·태블릿 고장 증상별 자가진단",
    slugs: ["apple-watch-selfcheck","ereader-selfcheck","galaxy-battery-drain","galaxy-buds-selfcheck","galaxy-call-speaker-selfcheck","galaxy-charging-issue","galaxy-force-restart-safemode","galaxy-tab-selfcheck","galaxy-watch-selfcheck","ipad-charging-selfcheck","iphone-battery-health","iphone-faceid-camera-selfcheck","iphone-force-restart","iphone-overheating","phone-touch-selfcheck","portable-power-station-selfcheck","smartband-selfcheck","smartphone-battery-drain-selfcheck","smartphone-charging-selfcheck","smartphone-storage-slow-selfcheck","wireless-charger-selfcheck"],
  },
  {
    key: "kitchen", label: "주방가전", en: "KITCHEN", color: "#8a6a3a",
    angle: "전자레인지·인덕션·밥솥·커피머신",
    seoTitle: "전자레인지·인덕션·밥솥 고장 자가점검",
    slugs: ["air-fryer-selfcheck","bread-maker-selfcheck","coffee-grinder-selfcheck","coffee-machine-selfcheck","cuchen-ricecooker-reset","cuckoo-ricecooker-reset","electric-griddle-selfcheck","electric-kettle-selfcheck","food-waste-processor-selfcheck","gas-range-selfcheck","hand-blender-selfcheck","highlight-cooktop-selfcheck","induction-selfcheck","juicer-selfcheck","lg-dishwasher-selfcheck","microwave-not-heating-selfcheck","oven-selfcheck","samsung-dishwasher-error","stand-mixer-selfcheck","toaster-selfcheck"],
  },
  {
    key: "living", label: "생활가전", en: "LIVING", color: "#5a7a5a",
    angle: "청소기·공기청정기·정수기·전기장판",
    seoTitle: "청소기·공기청정기·정수기 고장 자가점검",
    slugs: ["air-purifier-selfcheck","bidet-selfcheck","bidet-selfcheck2","cordless-vacuum-battery-selfcheck","coway-purifier-selfcheck","dehumidifier-selfcheck","dyson-vacuum-selfcheck","electric-blanket-selfcheck","fan-circulator-selfcheck","handy-fan-selfcheck","humidifier-selfcheck","lg-codezero-vacuum","lg-purifier-selfcheck","robot-vacuum-selfcheck","sewing-machine-selfcheck","skmagic-chungho-purifier-selfcheck","steam-cleaner-selfcheck","steam-iron-selfcheck","water-purifier-selfcheck"],
  },
  {
    key: "av", label: "영상·음향", en: "AV", color: "#7a5a9a",
    angle: "TV·사운드바·카메라·게임기",
    seoTitle: "TV·사운드바·카메라 고장 자가진단",
    slugs: ["action-cam-selfcheck","airpods-selfcheck","bluetooth-speaker-selfcheck","drone-selfcheck","earbuds-case-charging-selfcheck","game-controller-selfcheck","lg-tv-selfcheck","mirrorless-camera-selfcheck","nintendo-switch-selfcheck","projector-selfcheck","ps5-selfcheck","samsung-tv-error","soundbar-selfcheck","tv-no-signal-selfcheck","tv-streaming-app-selfcheck"],
  },
  {
    key: "pc", label: "PC·주변", en: "PC", color: "#4a6a8a",
    angle: "노트북·모니터·프린터·외장하드",
    seoTitle: "노트북·모니터·프린터 고장 자가진단",
    slugs: ["canon-epson-printer-selfcheck","desktop-pc-power-selfcheck","external-drive-selfcheck","galaxy-book-selfcheck","graphics-tablet-selfcheck","hp-printer-selfcheck","laptop-keyboard-selfcheck","laptop-overheat-selfcheck","lg-gram-selfcheck","macbook-selfcheck","monitor-no-signal-selfcheck","nas-selfcheck","printer-not-printing-selfcheck","usb-mic-selfcheck","webcam-selfcheck","windows-boot-selfcheck","wireless-keyboard-mouse-selfcheck"],
  },
  {
    key: "wellness", label: "헬스기기", en: "WELLNESS", color: "#9a5a7a",
    angle: "고데기·면도기·안마의자·체중계",
    seoTitle: "고데기·면도기·안마의자 고장 자가점검",
    slugs: ["blood-pressure-monitor-selfcheck","electric-shaver-selfcheck","electric-toothbrush-selfcheck","foot-spa-selfcheck","hair-clipper-selfcheck","hair-dryer-selfcheck","hair-styler-selfcheck","ipl-epilator-selfcheck","massage-chair-selfcheck","massage-gun-selfcheck","nebulizer-selfcheck","neck-massager-selfcheck","smart-scale-selfcheck","thermometer-selfcheck","walking-pad-selfcheck","water-flosser-selfcheck"],
  },
  {
    key: "service", label: "홈·통신", en: "SERVICE", color: "#8a5a3a",
    angle: "인터넷·공유기·IPTV·도어락",
    seoTitle: "인터넷·공유기 안 될 때 자가점검",
    slugs: ["account-login-selfcheck","doorlock-selfcheck","home-cam-selfcheck","iptime-router-selfcheck","isp-router-selfcheck","mobile-data-call-selfcheck","settop-box-selfcheck","smart-plug-selfcheck","video-doorphone-selfcheck","wifi-disconnect-selfcheck","kt-internet-selfcheck","skb-lgu-internet-selfcheck","wifi-slow-speed-selfcheck","router-firmware-reset-guide","mesh-extender-selfcheck","tv-streaming-app-buffering"],
  },
  {
    key: "car", label: "자동차", en: "MOBILITY", color: "#7a4a4a",
    angle: "시동·배터리·경고등·전동킥보드",
    seoTitle: "자동차 시동·배터리 문제 자가점검",
    slugs: ["car-aircon-selfcheck","car-battery-selfcheck","car-handy-vacuum-selfcheck","dashcam-selfcheck","escooter-ebike-selfcheck"],
  },
];

const SLUG_TO_CAT: Record<string, B4asCategory> = {};
for (const c of B4AS_CATEGORIES) for (const s of c.slugs) SLUG_TO_CAT[s] = c;

export function b4asCategoryOf(slug: string): B4asCategory | undefined {
  return SLUG_TO_CAT[slug];
}
export function b4asCategoryByKey(key?: string): B4asCategory | undefined {
  return B4AS_CATEGORIES.find((c) => c.key === key);
}
