# 조사 전문 — 겨울 오기 전 차량 점검 (배터리·부동액·타이어·워셔액·와이퍼)

- article: winter-car-prep-checklist
- 코너: smartguide / 분야: 자동차
- 조사일: 2026-11-03
- 팩트 파일: content/research/facts/common_winter-car-prep-checklist.json

## 0. 저장소 확인

- 기존 자동차 팩트 확인: `공통_car-tire-pressure`, `공통_car-engine-start-failure`, `공통_car-wiper-noise`, `공통_car-engine-oil-warning`, `공통_car-brake-warning`, `공통_car-headlight-check`, `공통_car-aircon-selfcheck`, `공통_as-safety-baseline`.
- 재사용: `cold-tire-pressure-standard`(공기압 기준은 명판), `jumpstart-cable-order`, `battery-frozen-or-low-fluid-explosion-risk`(동결·액 부족 배터리 점프 금지), `hybrid-vehicle-12v-battery-damage-risk`(하이브리드 점프 보조 금지), `wiper-blade-hardening-soap-water`(비눗물 세척 금지), `wiper-blade-inspection-cleaning`.
- 거부: `tpms-warning-threshold`(25% 기준의 원문을 열어 확인하지 못함).
- 힌트와 다른 점: 힌트는 "공식 기관/제조사 기준"이었으나 한국교통안전공단 공식 점검 안내는 찾지 못했다. 국토교통부·경찰청 2026년 2월 안내문 원문은 열지 못해 언론 보도로만 확인했다. 정부 기관 문서 대신 현대 공식 매뉴얼과 미국 DOE 안내를 1차 근거로 삼았다.

## 1. 공식 근거 — 현대 오너스 매뉴얼 (부동액)

출처: https://ownersmanual.hyundai.com/full_webhelp/QV/2026/ko_KR/topic_m5v_bms_s3c.html (열람 확인)

- 대기온도별 부동액 비율: -10℃ 30%, -15℃ 35%, -20℃ 40%, -25℃ 45%, -30℃ 50%.
- 동결온도는 지역 최저 기온에서 5℃를 뺀 값으로 계산한다.
- 동절기 이상한파 대비로 45% 혼합을 권장한다.
- 엔진별: 디젤 45~50%, CNG 50~60%.
- 모순: 같은 페이지 본문에 "보충 및 교환 시 부동액 농도가 50~60%가 되도록 유지하십시오"라는 문장이 있다. 온도 표(30~50%)와 맞지 않는다. tier 논쟁으로 기록했다.
- 교환 주기: 이 페이지에는 기간·주행거리가 없다. 블로그의 "2년·4만km"는 공식 근거를 찾지 못해 확인실패로 남겼다.

집필 시 톤: 특정 비율을 단정하지 말고 "매뉴얼 표를 먼저 보고, 교환·보충은 정비소에 기준을 확인"으로 안내한다.

## 2. 공식 근거 — 미국 DOE fueleconomy.gov (배터리·타이어·공회전)

출처: https://www.fueleconomy.gov/feg/coldweather.shtml (열람 확인)

- "Battery performance decreases in cold weather, making it harder for your alternator to keep your battery charged." 온도별 수치는 없다.
- "Tire pressure decreases in colder temperatures, increasing rolling resistance." 공기압을 정기적으로 확인하라고 권한다.
- "Limit idling. Most manufacturers recommend driving off gently after about 30 seconds."
- 장소: 가능하면 차고 등 따뜻한 곳에 주차, 짧은 운행 반복 줄이기, 좌석 열선·성에 제거기는 필요할 때만.
- 주의: 미국 기준 안내다. 국내 적용은 원리 수준으로만 쓴다.

## 3. 후기·2차 근거

- 교통사고공학연구소(차량기술법인H&T) 겨울철 차량관리 게시글 — https://taei.re.kr/bbs/board.php?bo_table=5&wr_id=37 (열람 확인, 2013년 12월 게시)
  - 기온이 낮아지면 내부저항 증가로 배터리 용량 감소.
  - 시동 절차: 약 10초 크랭킹 후 3~5분 대기 후 재시도. 단일 출처이므로 tier 논쟁.
  - 장기 주차 차량은 주 1회 정도 시동 권고. 단일 출처이므로 논쟁.
  - 신차 사계절용 부동액, 오염·보충 시 동결 방지 약화 가능 → 점검 권고.
  - 시중 워셔액은 대부분 겨울용 표기지만 일부는 동결 방지가 떨어지므로 제품 표기 확인.
  - 마모 상태에 따른 교체 권고 (수치 없음). 1.6mm 기준은 이 게시글에 없다 → 확인실패.
- AAA Club Alliance (미국 소비자 단체) — https://cluballiance.aaa.com/the-extra-mile/advice/car/how-temperature-changes-affect-your-tire-pressure (열람 확인)
  - 기온 10°F 하락당 약 1psi 감소 (AAA 매릴랜드·버지니아 자동차 관리 담당자 인용).
  - 콜드 상태 측정: 최소 3시간 이상 주행 없이 둔 상태.
  - 주의: psi 단위. 국내 계기는 kPa 단위일 수 있다 (1psi ≈ 6.895kPa).
- 비건뉴스 — https://www.vegannews.co.kr/news/article.html?no=391353 (열람 확인, 2026-10-05 등록)
  - 국토교통부·경찰청 2026년 2월 안내문을 인용한 기사. 출발 전 점검 항목: 타이어 공기압·마모·손상, 배터리·케이블, 냉각수·부동액과 워셔액(차량 설명서 규격·농도 확인), 앞뒤 유리 눈·얼음 제거와 와이퍼 동결 여부, 전조등·제동등·브레이크, 체인·점프 케이블 등 비상용품, 블랙박스 작동.
  - 수치는 기사에 없다. 정부 원문은 열람하지 못했으므로 tier 논쟁.

## 4. 열람하지 못한 출처 (사용하지 않음)

- 한국교통안전공단 겨울철 점검 안내: 검색으로 찾지 못함.
- 정책브리핑(gonggam.korea.kr) 겨울철 차량 관리 기사: 열람 시도 시 HTTP 500으로 실패. 검색 요약에만 있었다. 원문 확인 전까지 인용하지 않는다.
- AAA 원 연구의 "0°F에서 배터리 약 60% 손실" 수치: 2차 인용 검색 결과만 있고 원문 미확인. 팩트로 등록하지 않았다.
- 부동액 "2년·4만km" 교환 주기: 블로그 검색 결과만 있고 열람 확인하지 않았다.

## 5. 집필 가이드 (리서치가 넘기는 것)

- 이 글 구조는 "출발 전 체크리스트 → 항목별 '무엇을 보나' → 안 되면 다음 단계" 순서가 맞다.
- 배터리: 원리(저온 시 용량 감소) → 정기 시동·장기 주차 권고 → 시동 실패 시 절차 → 방전 시 점프 원칙(재사용 팩트). 하이브리드·동결 배터리 점프 금지는 경고 유지.
- 부동액: 매뉴얼 온도표 + 동결온도 계산 방법 + 모순 안내. 교환 주기는 수치 금지, 정비소 확인.
- 타이어: 1psi/10°F + 콜드 측정 3시간 + 명판 기준 + 단위 환산. 마모 1.6mm는 쓰지 않는다.
- 워셔액: 동결 방지 표기 확인, 일반 워셔액이면 교체 안내. 규격은 차량 설명서.
- 와이퍼: 얼어붙음 확인, 비눗물 금지, 블레이드 교체 시 암 가동 확인(기존 팩트).
- 착지점: 확인 후에도 이상하면 정비소·긴급출동.
