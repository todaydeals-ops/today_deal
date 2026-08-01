// 태그 없는 기존 발행글 76편에 검색 태그 소급 주입 (팩트체크·스마트가이드·트렌드랩)
// AS셀프체크와 달리 에러코드가 없으므로 제품군·기술·비교대상·핵심 검색어 중심
import fs from "node:fs";
(function loadEnv() {
  try {
    const t = fs.readFileSync(`${import.meta.dirname}/../.env.local`, "utf8");
    for (const l of t.split(/\r?\n/)) { const m = l.match(/^([A-Z0-9_]+)=(.*)$/); if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].trim(); }
  } catch {}
})();
const SB = process.env.NEXT_PUBLIC_SUPABASE_URL, KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const H = { apikey: KEY, Authorization: `Bearer ${KEY}` };

const TAGS = {
  // ── 팩트체크 16 ─────────────────────────────────────
  "air-purifier-999-factcheck": ["공기청정기", "초미세먼지", "헤파필터", "CADR", "미세먼지제거", "공기청정기효과"],
  "collagen-fact-check": ["콜라겐", "먹는콜라겐", "저분자콜라겐", "콜라겐효과", "피부영양제"],
  "diet-supplement-fact-check": ["다이어트보조제", "체지방감소", "가르시니아", "체중감량", "다이어트영양제"],
  "frozen-food-health-fact": ["냉동식품", "급속냉동", "간편식", "냉동식품건강", "보존료"],
  "hair-dryer-ionic-fact": ["헤어드라이어", "음이온드라이어", "머릿결", "드라이어고르는법"],
  "hairloss-shampoo-fact-check": ["탈모샴푸", "탈모", "두피케어", "의약외품", "탈모증상완화"],
  "hangover-cure-fact-check": ["숙취해소제", "숙취", "헛개", "알코올분해", "음주"],
  "magnesium-vitamind-fact-check": ["마그네슘", "비타민D", "영양제", "결핍증상", "보충제"],
  "omega3-fact-check": ["오메가3", "EPA", "DHA", "혈행개선", "등푸른생선"],
  "probiotics-cfu-factcheck": ["유산균", "프로바이오틱스", "CFU", "장건강", "유산균고르는법"],
  "protein-supplement-fact-check": ["단백질보충제", "프로틴", "유청단백질", "단백질섭취량", "근육"],
  "sunscreen-spf-pa-fact-check": ["선크림", "SPF", "PA지수", "자외선차단", "선크림바르는법"],
  "supplement-dose-absorption-fact-check": ["영양제", "고함량", "흡수율", "생체이용률", "영양제고르는법"],
  "vitamin-c-dosage-fact": ["비타민C", "비타민C권장량", "고용량비타민C", "항산화"],
  "whitening-wrinkle-cosmetics-fact-check": ["미백화장품", "주름개선", "기능성화장품", "나이아신아마이드", "레티놀"],
  "zero-drink-sweetener-fact": ["제로음료", "인공감미료", "아스파탐", "스테비아", "제로칼로리"],
  // ── 스마트가이드 45 ─────────────────────────────────
  "aircon-longrun-care": ["에어컨관리", "에어컨청소", "필터청소", "실외기", "에어컨오래쓰는법"],
  "aircon-types-compare": ["에어컨종류", "벽걸이에어컨", "스탠드에어컨", "창문형에어컨", "이동식에어컨"],
  "bidet-types-compare": ["비데", "일체형비데", "부착형비데", "비데고르는법", "비데설치"],
  "boiler-condensing-compare": ["보일러", "콘덴싱보일러", "일반보일러", "보일러교체", "난방비절약"],
  "camping-tent-guide": ["텐트", "캠핑텐트", "돔텐트", "터널텐트", "텐트고르는법", "내수압"],
  "car-self-maintenance-longrun": ["자동차관리", "셀프정비", "엔진오일", "타이어공기압", "자동차소모품"],
  "castiron-stainless-pan-care-longrun": ["무쇠팬", "스테인리스팬", "시즈닝", "팬관리", "달라붙음"],
  "coffee-machine-types-compare": ["커피머신", "캡슐커피머신", "전자동커피머신", "반자동", "홈카페"],
  "dehumidifier-compressor-vs-desiccant": ["제습기", "컴프레서제습기", "데시칸트", "펠티어", "제습기고르는법"],
  "denim-care-longrun": ["청바지관리", "데님", "청바지세탁", "물빠짐", "생지청바지"],
  "ev-hybrid-ice-compare": ["전기차", "하이브리드", "내연기관", "차종비교", "유지비"],
  "food-waste-disposer-compare": ["음식물처리기", "미생물처리기", "건조분쇄", "음식물쓰레기", "처리기비교"],
  "home-gym-guide": ["홈짐", "홈트레이닝", "덤벨", "운동기구", "홈짐구성"],
  "induction-vs-highlight-vs-gas": ["인덕션", "하이라이트", "가스레인지", "전기레인지", "레인지비교"],
  "keyboard-mouse-guide": ["키보드", "마우스", "기계식키보드", "무선마우스", "사무용키보드"],
  "kimchi-fridge-buying-guide": ["김치냉장고", "뚜껑형김치냉장고", "스탠드형", "김치보관", "김치냉장고고르는법"],
  "kitchen-knife-board-care-longrun": ["주방칼", "도마", "칼갈이", "칼관리", "도마위생"],
  "knit-wool-care-longrun": ["니트관리", "울세탁", "보풀제거", "니트늘어짐", "울코트"],
  "laptop-screen-size-guide": ["노트북", "노트북화면크기", "13인치", "15인치", "노트북고르는법"],
  "laptop-tablet-desktop-compare": ["노트북", "태블릿", "데스크탑", "기기비교", "작업용PC"],
  "leather-goods-care-longrun": ["가죽관리", "가죽가방", "가죽지갑", "가죽오일", "가죽보관"],
  "mattress-care-longrun": ["매트리스관리", "매트리스청소", "진드기", "매트리스수명", "토퍼"],
  "mattress-firmness-guide": ["매트리스", "매트리스경도", "하드매트리스", "소프트매트리스", "허리통증"],
  "mirrorless-camera-buying-guide": ["미러리스", "카메라마운트", "렌즈", "풀프레임", "크롭바디"],
  "monitor-size-refresh-guide": ["모니터", "주사율", "모니터크기", "144Hz", "모니터고르는법"],
  "nonstick-pan-care": ["코팅팬", "프라이팬", "테프론", "코팅벗겨짐", "팬수명"],
  "office-chair-buying-guide": ["사무용의자", "인체공학의자", "요추지지", "의자고르는법", "허리통증"],
  "outdoor-jacket-guide": ["아웃도어재킷", "고어텍스", "방수코팅", "재발수", "등산복"],
  "oven-types-compare": ["오븐", "가스오븐", "전기오븐", "광파오븐", "오븐고르는법"],
  "phone-battery-longevity-guide": ["스마트폰배터리", "배터리수명", "충전습관", "배터리효율", "과충전"],
  "pillow-sleep-guide": ["베개", "경추베개", "메모리폼베개", "베개높이", "목통증"],
  "refrigerator-capacity-guide": ["냉장고용량", "냉장고", "4도어냉장고", "1인가구냉장고", "냉장고고르는법"],
  "robot-vacuum-longrun-care": ["로봇청소기", "로봇청소기관리", "브러시청소", "센서청소", "먼지통"],
  "running-shoes-buying-guide": ["러닝화", "발유형", "쿠셔닝", "안정화", "러닝화고르는법"],
  "sneaker-care": ["운동화세탁", "운동화관리", "스니커즈", "황변", "운동화말리는법"],
  "sofa-buying-guide": ["소파", "가죽소파", "패브릭소파", "소파고르는법", "거실가구"],
  "solid-wood-furniture-care-longrun": ["원목가구", "원목관리", "갈라짐", "가구오일", "습도관리"],
  "stick-vs-robot-vacuum": ["무선청소기", "로봇청소기", "청소기비교", "흡입력", "청소기조합"],
  "summer-electricity-bill-guide": ["전기요금", "누진제", "에어컨전기세", "여름전기료", "절전"],
  "toploader-vs-drum-compare": ["통돌이세탁기", "드럼세탁기", "세탁기비교", "세탁기고르는법", "건조겸용"],
  "tv-oled-qled-lcd": ["OLED", "QLED", "미니LED", "TV비교", "TV고르는법"],
  "washer-odor-care": ["세탁기냄새", "세탁조청소", "세탁기세척", "곰팡이", "통세척"],
  "water-purifier-direct-vs-tank": ["정수기", "직수형정수기", "저수조형", "정수기비교", "정수기고르는법"],
  "wifi-router-guide": ["와이파이", "공유기", "공유기배치", "와이파이속도", "메시와이파이"],
  "wireless-earbuds-guide": ["무선이어폰", "블루투스이어폰", "코덱", "노이즈캔슬링", "이어폰고르는법"],
  // ── 트렌드랩 15 ─────────────────────────────────────
  "airfryer-trend": ["에어프라이어", "에어프라이어추천", "기름없는튀김", "에어프라이어활용"],
  "clothes-dryer-trend-guide": ["의류건조기", "건조기추천", "히트펌프건조기", "건조기용량", "건조기고르는법"],
  "clothing-care-machine-trend": ["의류관리기", "스타일러", "에어드레서", "옷살균", "구김제거"],
  "dishwasher-worth-it": ["식기세척기", "식세기", "빌트인식기세척기", "식기세척기효율", "설거지"],
  "electric-bike-guide": ["전기자전거", "전동킥보드", "PM", "배터리주행거리", "안전규정"],
  "foldable-phone-trend": ["폴더블폰", "폴드", "플립", "폴더블내구성", "주름"],
  "humidifier-type-trend-guide": ["가습기", "가열식가습기", "초음파가습기", "가습기청소", "가습기위생"],
  "massage-gun-trend": ["마사지건", "근막이완", "마사지건효과", "마사지건안전"],
  "projector-vs-tv-trend": ["빔프로젝터", "프로젝터", "TV대체", "안시루멘", "홈시네마"],
  "smart-doorlock-trend": ["스마트도어락", "디지털도어락", "지문인식도어락", "도어락배터리"],
  "smart-home-trend": ["스마트홈", "IoT", "스마트플러그", "홈허브", "매터"],
  "smart-ring-trend": ["스마트링", "갤럭시링", "웨어러블", "수면측정", "스마트워치비교"],
  "smart-scale-inbody-trend": ["스마트체중계", "체성분계", "인바디", "체지방률", "BIA"],
  "smartwatch-wearable-trend": ["스마트워치", "웨어러블", "갤럭시워치", "애플워치", "생태계"],
  "standing-desk-trend": ["스탠딩데스크", "높이조절책상", "허리건강", "재택근무", "자세"],
};

let ok = 0, miss = 0;
for (const [slug, tags] of Object.entries(TAGS)) {
  const r = await fetch(`${SB}/rest/v1/magazine?slug=eq.${slug}&select=body_html`, { headers: H });
  const [row] = await r.json();
  if (!row) { console.log(`✗ NOT FOUND ${slug}`); miss++; continue; }
  const m = row.body_html.match(/^\s*<!--RAIL:([\s\S]*?)-->\s*/);
  let rail = {}, rest = row.body_html;
  if (m) { try { rail = JSON.parse(m[1]); } catch {} rest = row.body_html.slice(m[0].length); }
  rail.tags = tags;
  const p = await fetch(`${SB}/rest/v1/magazine?slug=eq.${slug}`, {
    method: "PATCH", headers: { ...H, "Content-Type": "application/json", Prefer: "return=minimal" },
    body: JSON.stringify({ body_html: `<!--RAIL:${JSON.stringify(rail)}-->\n${rest}` }),
  });
  if (p.status === 204) ok++; else { miss++; console.log(`✗ ${slug} HTTP ${p.status}`); }
}
console.log(`태그 주입: ${ok}편 성공 / ${miss}편 실패 (총 ${Object.keys(TAGS).length}편 시도)`);
