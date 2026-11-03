# 냉장고 아래로 물이 샐 때 정상 결로인지 고장인지 구분 — 조사 브리프

- article: refrigerator-water-leak-selfcheck
- 코너 / 분야: repair / 가전
- 조사일: 2026-11-03
- 팩트 파일: content/research/facts/common_refrigerator-water-leak-selfcheck.json

## 1. 판별 축 (집필 구조 제안)

1. **물이 어디서 나오나** — 냉장고 안쪽(내부) / 냉장고 바깥 바닥(주변 가전 의심) / 뒤쪽 하단(증발 접시·드레인)
2. **양과 빈도** — 문 여닫은 뒤 맺힌 물기 수준이면 결로, 계속 고이면 배수 문제
3. **냉기 상태** — 냉기 정상이면 배수·결로 쪽, 냉기 약하거나 식품이 녹으면 서비스 쪽
4. **해빙 후 반응** — 배수구 막힘이면 해빙 후 대부분 멈춰야 하고, 해빙 후에도 계속 나오면 내부 부품 점검

## 2. 핵심 출처

- [공식] 삼성전자서비스 "마루에 물이 고이고 누수가 발생합니다" — https://www.samsungsvc.co.kr/solution/38793 (2017-05-12 등록, 오래된 페이지. 전화번호는 최신 확인 필요)
- [공식] 삼성전자서비스 "스탠드형 김치냉장고 뒤쪽 누수" — https://www.samsungsvc.co.kr/solution/35220 (2026-10-12 등록, 김치냉장고 기준이라 일반 냉장고에 확장 금지)
- [공식] LG전자 "LG 냉장고 바닥으로 물이 흘러나올 때 어떻게 해야 하나요" — https://www.lge.co.kr/support/solutions-20151288380744 (2026-06-17 게시, 가장 완결된 국내 자가 절차)
- [공식] LG전자 미국 help library (탑프리저, 누수 해결) — https://www.lg.com/us/support/help-library/how-to-troubleshoot-water-leaking-from-the-ceiling-or-pooling-on-the-floor-in-your-lg-top-freezer-refrigerator--20155272207393
- [공식·해외] 삼성 영국 지원 — 누수 종합 https://www.samsung.com/uk/support/home-appliances/what-should-i-do-if-i-suspect-my-samsung-fridge-freezer-is-leaking-water/ , 드레인 트레이 https://www.samsung.com/uk/support/home-appliances/what-should-i-do-when-water-leaks-from-the-drain-tray-of-the-refrigerator/
- [공식·해외] Samsung India — https://www.samsung.com/in/support/home-appliances/water-leakage-in-refrigerator/ (감전·전원 차단 문구만 사용)

## 3. 힌트와 달랐던 점

- **제상수 배수구 막힘**과 **결로**는 힌트대로 확인됐다. LG 안내는 해빙 24시간(여름 하루, 겨울 최대 3일)을 명시한다.
- **정수기·제빙 급수 연결**: 국내 자가 점검 절차는 확인하지 못했다. 삼성 인도 페이지에도 급수 라인 점검이 없었다. 기존 팩트 `ice-not-produced-water-supply-issue`(제빙기 얼음 불생성 시 급수 호스·수도 잠금)만 재사용했고, 누수 절차로는 쓰지 않는다. 주변 정수기 호스 연결 불량은 LG 원인 3분류의 "외부 요인"으로 확보했다.
- **도어 패킹**: 삼성 영국 종이 테스트 절차로 확보했다(국내 공식 근거는 없다).
- **수평**: 삼성 영국 안내(뒤쪽으로 약간 기울임)로 확보했다. 국내 자가 절차는 확인 못 했다.
- **LG 원문에 없는 것**: "날카로운 도구로 얼음을 긁지 말라"는 검색 요약에 있었으나 실제 페이지 본문에서 확인하지 못했다. 팩트로 쓰지 않았다.
- **삼성 국내 2017 페이지**: 정상 결로·배수구 막힘·24시간 절차의 근거이나 오래된 문서다. 전화번호는 2026-10-12 등록 페이지(35220)의 1588-3366을 썼다.

## 4. 감전·안전 (예외: 근거를 확실히 잡음)

- 물은 전기를 통한다. 점검 전 플러그를 뽑고 차단기를 끈다(삼성 인도 안내).
- 물이 콘센트나 전원 코드 주변까지 번졌으면 젖은 손으로 전기 부품을 만지지 않고 안전을 확보한 뒤 점검을 받는다(삼성 35220).
- 해빙을 드라이어나 뜨거운 물로 하지 않는다(LG 미국 안내, 플라스틱 손상).

## 5. 확인실패

- 제빙·정수 급수 연결부 누수의 자가 점검 절차 (`samsung-leak-ice-maker-line-unverified`). 글에서는 "급수 쪽이 의심되면 서비스 점검"까지만 쓴다.
- 배수 청소 절차의 구체적 방법(해외 페이지에 상세 없음). 원문에 있는 "전원 끄고 트레이 청소", "이물질 손으로 제거 또는 따뜻한 물로 흘려보내기"(삼성 해외 Q&A)까지만 쓴다.

## 6. 보증·AS

- LG: 보증 기간이 지나면 방문 요금이 청구될 수 있다. 고객센터 1544-7777. 보증 적용 여부는 페이지에 없어 단정하지 않는다.
- 삼성: 보증 기간 안이라도 고장이 아니면 별도 요금(2017 페이지). 출장 예약은 삼성전자서비스 홈페이지, 대표 1588-3366(35220 기준).

## 7. 검색 기록

- 웹 검색 2회(삼성 국내 누수 원인, LG 바닥 물 원인). 페이지 열람(WebFetch) 9건.
