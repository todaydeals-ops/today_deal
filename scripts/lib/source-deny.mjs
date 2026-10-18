// 출처 배제 목록 — "그 사이트가 제품을 팔거나 시술·수리를 파는가? 팔면 배제한다."
// magazine-srcaudit.mjs(리서치 감사)와 wiki-verify.mjs(생활백과 게이트)가 같은 목록을 쓴다.
// 새 도메인이 뚫리면 여기 한 곳에만 추가한다.
export const DENY = [
  { re: /shopping|shoppinghow|coupang|11st|gmarket|smartstore|auction/i, why: "쇼핑몰" },
  { re: /namu\.wiki|namu\.moe/i, why: "나무위키" },
  { re: /blog\.naver|tistory|blogspot|medium\.com|brunch\.co\.kr/i, why: "개인 블로그" },
  { re: /betterwayhealth|seed\.com|thorne|iherb|now-?foods|swansonvitamins|vitacost|gnc\./i, why: "보충제 판매사" },
  // 영양제 보관 조사에서 tier="확실" 3건이 Nature's Way(보충제 브랜드) 한 곳에서 나왔다(2026-08-11).
  // "냉장 보관이 필요한가"를 보충제 파는 곳에 물으면 답이 한쪽으로 기운다.
  { re: /naturesway|greencirclecap|ipa-biotics|nutraceuticalsworld|vitaminshoppe|puritan/i, why: "보충제 브랜드·캡슐 제조사·업계 협회" },
  // 노화·흰머리·콜라겐 주제는 안티에이징 보충제 브랜드가 검색을 뒤덮는다(2026-08-11).
  { re: /novoslabs|moonjuice|rhonutrition|innerbalance|mitohealth|weleda|bareskincare|endocrinecenter/i, why: "안티에이징 보충제·화장품 브랜드·개인 클리닉" },
  { re: /innovareacademics|scirp\.org|omicsonline|hindawi\.com\/journals\/(?!.)/i, why: "약탈적 저널 의심" },
  // 영양사·전문가 개인 사이트도 1차 출처가 아니다. B12 결핍처럼 건강 직결 주장이
  // plantbasedrds.com/blog 같은 곳에서 온 사례가 있었다(2026-08-10).
  { re: /plantbasedrds|plantnutritionwellness|nutritionfacts\.org|precisionnutrition/i, why: "영양 전문가 개인 사이트" },
  { re: /dsm-firmenich|basf|nutraceuticalbusinessreview|nutraingredients|foodnavigator/i, why: "원료사·업계지" },
  // 주의: 제조사 공식 블로그(kingston.com/blog 등)는 §4 기준 1순위 출처다.
  // "/blog/" 경로만으로 배제하면 오탐이 쏟아진다 — 플랫폼형 블로그만 위에서 걸러낸다.
  { re: /droracle\.ai|medspot\.ai|healthline|verywell|webmd/i, why: "2차 요약·AI 생성 사이트" },
  { re: /typology|thedermaco|paulaschoice|theordinary|drmtlgy|clinikally|thekosmetics|loved01|sophim|gentleglow|halecosmeceuticals|skintypesolutions|hoiahomespa|besthairregrowth/i, why: "화장품 브랜드·판매처 자체 콘텐츠" },
  { re: /naturecan|livemomentous|apollohospitals|ubiehealth|prescriberpoint|todayspractitioner/i, why: "판매처·상업 헬스 사이트" },
  // 시술을 파는 의원·클리닉. 레이저 후 색소침착 위험 팩트 4건이 레이저 클리닉
  // 한 곳에서 나왔다(2026-08-11). 시술의 위험도를 시술 파는 곳에 묻는 셈이다.
  { re: /kins-clinic|-clinic\.com|clinic\.co\.kr|의원|피부과의원|성형외과/i, why: "시술 판매 의원·클리닉" },
  { re: /crnusa\.org|gssiweb\.org/i, why: "업계 협회(이해상충)" },
  { re: /researchgate\.net|auctoresonline|ijpsjournal|scienceinsights/i, why: "프리프린트·약탈적 저널 의심" },
  { re: /clien\.net|dcinside|ppomppu|ruliweb|cafe\.naver|todayhumor|82cook|bobaedream/i, why: "커뮤니티 게시판" },
  { re: /fastercapital|tipbox\.co\.kr|blogspot|wordpress\.com|100mb\.kr|exocctv|ajd\.co\.kr|keyzard/i, why: "콘텐츠팜·팁블로그·판매처" },
  // 시공·설비·자재 업체 — 자기 서비스를 팔려고 증상과 위험을 과장한다.
  // 2026-08-11 동파 해빙 팩트 8건 전부가 배관 시공업체(cpdrain) 하나에서 나왔다.
  // 해빙 온도·직화 금지 같은 안전 수치를 업체 글에서 가져오면 안 된다.
  // ★자기 사이트를 출처로 쓰는 것은 순환 참조다. 전역 규약이 금지한다.
  { re: /todaydeals.co.kr|goodsleep.todaydeals|pill.todaydeals|beauty.todaydeals|b4as.todaydeals/i, why: "자사 사이트(순환 참조)" },
  // 의료기기·건강기기: 매체·비대면진료앱·Q&A 커뮤니티·기기 판매사.
  // 헬스기기 배치에서 52건 중 34건이 여기서 나왔다(2026-09-01).
  { re: /hidoc|doctornow|thebk.co.kr|medicaldaily|doctorsnews|k-health|ilyoweekly|asiae.co.kr|a-ha.io|yellowit|manuals.plus/i, why: "건강 매체·비대면진료앱·Q&A 커뮤니티" },
  { re: /easyclaire|godson.co.kr|yuyuteijin|bakskincare|realrv|yewycharger|serenvia|chinaxiongwei/i, why: "건강기기 판매사" },

  // 자동차: 문제의 해법을 파는 곳에서 그 문제의 기준을 가져오면 안 된다.
  // 엔진오일 경고등 근거를 오일 브랜드(Kixx)에서, 실내 냄새 근거를 에어컨 세정제
  // 판매사(3M)에서 가져온 배치가 있었다(2026-09-01). 제조사 오너스매뉴얼과
  // 국토교통부·교통안전공단이 정본이다.
  { re: /kixxman|3m.co.kr|smartcarview|egenauto|driveind|mycle.co.kr|evpost|radiokorea|carisyou|encar|bobaedream/i, why: "자동차 용품 판매사·자동차 매체" },

  { re: /cpdrain|edisonenc|powerzone\.co\.kr|lxzin|hyundailivart|kccworld|noroo|samhwa|설비|시공|철거/i, why: "시공·설비·자재 업체" },
];
