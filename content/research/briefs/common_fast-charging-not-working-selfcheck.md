# 고속충전이 안 되고 충전이 느릴 때 케이블부터 점검 — 조사 브리프

- 슬러그: fast-charging-not-working-selfcheck
- 코너: repair / 분야: 디지털·IT
- 조사일: 2026-11-03
- 팩트 파일: content/research/facts/common_fast-charging-not-working-selfcheck.json

## 1. 조사 범위와 힌트 대비

총괄 힌트(케이블 규격·어댑터 와트·포트 이물·발열 제한, 삼성·Apple 공식, 비정품 과열)를 따랐다. 원문과 달랐던 점은 다음과 같다.

- **아이패드 저출력 어댑터 기준(7.5W)은 원문에서 확인되지 않았다.** Apple 125066 원문은 iPad Pro(M5) 기준 60W 이상 USB-C 어댑터를 안내한다. 기존 팩트 `ipad-slow-charging-with-low-wattage-adapter`와 `ipad-slow-charger-notification`은 disputes로 신고했다.
- **아이폰 15 이후 고속 충전 기준은 18W 이상**(Apple 102574 원문). 같은 페이지에 20W 이상 문구가 따로 나오지만 차이 설명이 없어 `apple-20w-vs-18w-minimum-unclear`를 확인실패로 남겼다.
- **삼성 공식 원문에 PPS 지원 여부·케이블 종류 안내는 없었다.** 삼성전자서비스 37809 본문은 충전기 와트 수를 다루지 않는다. PDO/PPS 설명은 기존 삼성 팩트(`pdo-vs-pps-charging-standard`)를 재사용했다.
- **단자 청소 방법은 원문마다 다르다.** 37809는 부드러운 솔만 명시한다. 기존 팩트의 손전등·공기 분사 방법은 원문에서 확인되지 않아 신고했다.

## 2. 재사용 (reused_facts, 8건)

| id | 출처 | 용도 |
|---|---|---|
| battery-swelling-stop-immediately | Apple 103269 (공통 안전 기준선) | 부풀음·과열·타는 냄새 시 중단 |
| moisture-detection-charging-block | 삼성전자서비스 1004045 | 단자 물기 감지 시 충전 차단 |
| charging-disabled-high-temperature | 삼성 charging-tip | 고온 시 충전 제한 |
| battery-protection-mode-80percent | 삼성전자서비스 1103537 | 배터리 보호 80% 제한 |
| fast-charging-toggle-location-one-ui | 삼성전자서비스 25867 | 고속 충전 설정 위치 |
| charger-wattage-compatibility-rule | 삼성전자서비스 38643 | 충전기 와트와 기기 최대치 |
| genuine-charger-importance | 삼성전자서비스 37805 | 비정품 충전기·케이블의 저속·손상 위험 |
| pdo-vs-pps-charging-standard | 삼성전자서비스 1324310 | PDO와 PPS 차이 |

## 3. 신규 팩트 (14건, tier·evidence)

- 확실·공식 13건, 확인실패·공식 1건(`apple-20w-vs-18w-minimum-unclear`).
- 출처별: Apple 108805(아이폰 충전 점검 순서·인증 알림·최적화 충전), Apple 102574(아이폰 고속 충전 와트), Apple 125066(아이패드 Pro M5 60W), Samsung US TSG10013503(5A 케이블·PC 연결·비호환 액세서리·멤버스 진단), 삼성전자서비스 37809(단자 청소·서비스 점검), KATS 240(KC 표시·제품안전정보센터·신고).

핵심 흐름: 케이블·어댑터 확인 → 콘센트 변경 → 단자 이물 청소 → PC 대신 벽 어댑터 → 고속 충전 설정 → 80% 정지 여부 → 발열 시 식힌 뒤 재시도 → 멤버스 진단 → 서비스센터(휴대전화·어댑터·케이블 동반).

## 4. 제외한 것과 이유

- 출처가 블로그·커뮤니티·언론인 팩트는 재사용하지 않았다(Samsung Members 커뮤니티, large-battery.com, channel.io, 뉴스트리 기사). 공식 원문을 열지 못한 커뮤니티 후기(S10 15W 등)는 수집하지 않았다. 필요하면 후기 근거로 별도 조사한다.
- 비정품 과열의 구체 사례(화재 수치)는 공식 원문으로 확인하지 못했다. 안전 경고는 "중단·서비스 점검", "KC 표시 확인", "비호환 액세서리의 충전 실패·손상 가능성" 수준으로만 쓴다.

## 5. 쓸 때 주의

- 아이패드 60W 기준은 iPad Pro(M5) 원문이다. 다른 아이패드 모델에 확장 적용하지 않는다.
- 삼성 케이블 5A 권장은 미국 지원 페이지 기준이다. 국내 표기 관행은 상식 수준으로만 말한다.
- 삼성 보증기간(충전기·케이블 1년) 수치는 원문 요약에서만 확인했다. 글에 쓰기 전 원문 재확인이 필요하다.
- 단자 청소의 금속 도구 금지는 원문 밖 상식이다. caution에 출처 구분을 적었다.
- 대상 독자는 "지금 충전이 안 된다"는 상황이다. 항목마다 "여기서 해결되면 끝, 안 되면 다음 단계, 마지막은 서비스센터"로 이어지도록 쓴다.

## 6. 기존 팩트 신고 (disputes)

| 대상 id | 파일 | 문제 |
|---|---|---|
| ipad-slow-charging-with-low-wattage-adapter | apple_ipad-charging-selfcheck.json | 7.5W 기준이 125066 원문에 없음. 원문은 60W 이상 |
| ipad-slow-charger-notification | apple_ipad-charging-selfcheck.json | 'Slow Charger' 알림 안내가 원문에 없음 |
| charging-port-debris-cleaning | samsung_galaxy-charging-issue.json | 손전등·공기 분사 방법이 37809 원문에 없음 |

신고만 했고 기존 파일은 수정하지 않았다. 판정은 총괄이 한다.

## 7. 출처 확인 기록

- 직접 열람(WebFetch)해 원문 확인: Apple 108805, Apple 102574, Apple 125066, 삼성전자서비스 37809, Samsung US TSG10013503, KATS 240.
- 검색 결과 요약만 확인한 것: 소비자원 KC 관련 기사(2019·2025 보도, 사용하지 않음).
- 삼성 커뮤니티 글(r1.community.samsung.com)은 리다이렉트 후 열람하지 못해 사용하지 않았다.
- 웹 검색 5회 사용(한도 6회 이내).
