# 조사 전문: 스마트폰 화면이 켜지지 않을 때 고장 전에 확인할 것

- article: phone-black-screen-selfcheck
- 코너 / 분야: repair / 디지털·IT
- 조사일: 2026-11-03
- 팩트 파일: content/research/facts/common_phone-black-screen-selfcheck.json

## 1. 조사 범위와 힌트 대비

총괄 힌트: 화면 안 켜짐(전원은 켜진 듯한) 원인 — 배터리 방전·강제 재시작·충전기/케이블, 삼성·Apple 공식 기준 순서, 침수·파손은 AS, 데이터 보호.

- 힌트와 달랐던 점 1: 힌트는 "전원은 켜진 듯한" 증상을 상정했다. 공식 문서(삼성 40217)는 "전원이 꺼져서 아무 반응 없음 + 완전 방전"을 기준 시나리오로 다룬다. 글은 두 증상을 나눠 설명해야 한다. "화면만 꺼진 상태"에 대한 공식 절차는 이번 조사에서 확보하지 못했다.
- 힌트와 달랐던 점 2: Apple 강제 재시동 절차는 공식 원문 페이지(support.apple.com/guide/iphone/force-restart-iphone-iph8903c3ee6/ios)를 열었으나 본문이 비어 있었다(내비게이션만 반환). 그래서 기종별 강제 재시동 팩트는 기존 팩트 `iphone-force-restart-generation-split`(2026-07-20 Apple 원문 확인분)을 재사용했다.
- 힌트와 달랐던 점 3: 기존 팩트 `water-damage-saltwater-freshwater-rinse`(헹굼 1분 이내)는 삼성 공식 원문과 다르다(IP 기기 1~3분, 비방수 기기는 헹굼 금지). 재사용하지 않고 disputes 로 신고했다.

## 2. 재사용 팩트

| id | 출처 파일 | 이번 글에서의 쓰임 |
|---|---|---|
| battery-swelling-stop-immediately | 공통_as-safety-baseline | 배터리 부풀음·과열 시 즉시 중단 |
| factory-reset-data-loss | 공통_as-safety-baseline | 초기화 전 백업 |
| iphone-force-restart-generation-split | apple_device-recovery | iPhone 기종별 강제 재시동 3갈래 |
| iphone-recovery-mode-data | apple_device-recovery | 복원=삭제, 업데이트=유지 |
| charging-port-debris-cleaning | samsung_galaxy-charging-issue | 충전 단자 이물질 점검 |
| moisture-detection-charging-block | samsung_galaxy-charging-issue | 물기 감지 시 충전 차단 |
| genuine-charger-importance | samsung_galaxy-charging-issue | 정품 충전기 권장 |
| water-damage-power-off-immediately | 공통_phone-water-damage-selfcheck | 침수 즉시 전원 차단 |
| water-damage-internal-moisture-risk | 공통_phone-water-damage-selfcheck | 겉이 말라도 내부 습기 위험 |
| water-damage-connector-drying-before-charging | 공통_phone-water-damage-selfcheck | 단자 건조 전 충전 금지 |

## 3. 신규 팩트 요약 (13건)

**증상·충전 (삼성 공식 40217 중심)**
- 강제 재시작: 케이스 제거 후 측면+음량 낮추기 7초 이상 (samsung-no-power-force-restart-7sec)
- 완전 방전 시 충전 아이콘이 안 보일 수 있고 0%는 방전 표시, 충전기를 연결한 채 계속 충전 (samsung-drained-no-icon-zero-percent)
- 완전 방전 후 대기 시간은 삼성 공식에서 수치 미확인 — 확인실패 (samsung-drained-wait-time-unconfirmed)
- Android 공통(Google 공식): 완전 방전 시 30분 이상 충전 후 재부팅, 빨간 불빛 고정=완전 방전·깜박임=전력 부족 (android-drained-30min-charge-then-restart)
- 삼성 순서: 정품 충전기 → 여분 충전기·케이블 교체 → 서비스센터 엔지니어 점검, 박스 케이블 지참 (samsung-swap-charger-then-service-center)

**AS·연락처·데이터 (삼성 23262, 38683 / Apple 연락처)**
- 삼성전자서비스 1588-3366, 발신자 부담, 모바일센터 예약 (samsung-service-center-1588-3366)
- 서비스센터는 데이터 이동을 하지 않으므로 직접 백업 (samsung-service-center-no-data-transfer)
- 화면 고장 기기의 PC 스마트 스위치 백업 조건은 공식 미확인 — 확인실패 (samsung-smart-switch-pc-backup-screen-broken-unconfirmed)
- 스마트 스위치 제외 항목: 카카오톡 대화 기록, 보안 폴더 앱 데이터 (samsung-smart-switch-pc-exclusions)
- Apple 국가별 전화번호와 온라인 수리 예약 경로 (apple-contact-page-phone-and-online-repair)

**침수 (삼성 23262)**
- 열원·압축공기·초음파·외부 열 건조 금지 (samsung-water-no-heat-or-compressed-air)
- 무방수 기기: 즉시 전원 차단, 유심·SD 분리, 마른 천, 서비스센터, 자연 건조 (samsung-water-nonip-power-off-dry-service)
- IP 방수 기기: 깨끗하지 않은 액체는 흐르는 물 1~3분 헹굼 후 건조 (samsung-water-ip-rinse-1to3min)

**제외한 후보 (팩트에 넣지 않음)**
- 방전 iPhone 충전 아이콘 "약 10분 후 표시"와 "강제 재시동은 데이터를 지우지 않는다"는 iOS 복구 소프트웨어 판매사 자료(ko.aiseesoft.com)에서만 확인됐다. 판매사 자료라 근거로 쓰지 않고 팩트에서 뺐다. 집필에서 이 두 수치·주장을 쓰려면 Apple 공식 문서에서 따로 확인해야 한다.

## 4. 출처 목록 (실제 열람 확인, 2026-11-03)

- [공식] https://www.samsungsvc.co.kr/solution/40217 — 갤럭시 전원 안 켜짐 (본문 확인)
- [공식] https://www.samsungsvc.co.kr/solution/23262 — 물손상 대처법 (본문 확인)
- [공식] https://www.samsungsvc.co.kr/solution/37809 — 갤럭시 충전 안 됨 (본문 확인, 1588-3366 기재)
- [공식] https://www.samsungsvc.co.kr/solution/38683 — 스마트 스위치 백업/복원 (본문 확인)
- [공식] https://support.google.com/android/answer/7662405?hl=ko — Android 충전·전원 문제 (본문 확인)
- [공식] https://support.apple.com/ko-kr/118106 — 복구 모드 버튼·복원/업데이트 (본문 확인)
- [공식] https://support.apple.com/ko-kr/101575 — 배터리 설계 기준 (본문 확인)
- [공식] https://support.apple.com/ko-kr/contact — 연락처 페이지 (본문 확인, 전화번호는 페이지 내 국가별 링크)
열람하지 못해 쓰지 않은 것: support.apple.com/guide/iphone/force-restart-iphone-iph8903c3ee6/ios (본문 누락), 커뮤니티·블로그 검색 요약에 나온 Apple 080 번호(공식 페이지에서 확인 못 함), ko.aiseesoft.com 판매사 자료(위 제외 후보 참고).

## 5. 검색 사용

웹 검색 5회 + 원문 열람 약 12회. 검색 결과 요약은 근거로 쓰지 않고 원문을 열어 확인한 것만 팩트로 옮겼다.

## 6. 집필 시 주의

- 기기가 "켜진 듯한" 경우의 공식 절차는 확보하지 못했다. 글에서 "화면만 꺼진 경우"를 공식 근거처럼 쓰지 말 것.
- 완전 방전 후 대기 시간은 수치로 쓰지 말고 "30분 이상 충전 후 재부팅(Android 공통 안내)"을 기준으로 하되 삼성 전용 수치가 아님을 밝힐 것.
- 강제 재시동을 데이터 백업 대체로 쓰지 말 것. 백업 우선 원칙을 앞에 둔다.
- Apple 전화번호는 블로그 값을 옮기지 말고 연락처 페이지 경로를 안내할 것.
