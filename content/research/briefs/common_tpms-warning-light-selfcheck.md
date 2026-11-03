# 조사 전문 — 타이어 공기압 경고등(TPMS)이 안 꺼질 때 확인할 것

- article: tpms-warning-light-selfcheck
- 코너: repair / 분야: 자동차
- 조사일: 2026-11-03
- 웹 검색 4회, 원문 열기 시도 다수 (상세는 아래)

## 1. 저장소 확인 (0단계)

- `content/research/facts/` 전체를 Grep으로 TPMS·타이어·공기압 검색.
- 재사용: `공통_car-tire-pressure.json` 의 cold-tire-pressure-standard, tpms-false-alert-locations, tpms-pressure-check-method, tpms-sensor-malfunction (모두 기아 오너스 매뉴얼 근거).
- 재사용: `common_winter-car-prep-checklist.json` 의 tire-pressure-drop-10f, `common_winter-tire-snow-chain-guide.json` 의 tire-cold-check-3h (AAA 기준).
- 재사용: `common_car-flat-tire-emergency-selfcheck.json` 의 flat-tire-no-sudden-brake, tmk-sensor-sealant-cleaning.
- **거부:** 공통_car-tire-pressure.json 의 tpms-warning-threshold (25% 기준). 법령 원문과 불일치. 아래 4번 참고. disputes 로 신고.
- 공통 안전 기준선(`공통_as-safety-baseline.json`)은 자동차 경고등 주제와 직접 겹치지 않아 재사용하지 않았다.

## 2. 힌트와 달랐던 점

- 총괄 힌트의 "25% 기준"은 국내 법령과 다르다. 국가법령정보센터 원문은 **20% 감소 또는 최소 150kPa 중 큰 값**이다. 25%는 미국 FMVSS 138 기준으로 보인다.
- 국토교통부 정책자료 URL(molit.go.kr/USR/policyTarget/m_24066/dtl.jsp?idx=492)은 리다이렉트 루프로 열리지 않았다. 기존 팩트의 molit 출처는 확인되지 않은 상태다.
- 기아 TPMS 초기화 페이지(ownersmanual.kia.com/docview/webhelp/doc/4444eb48-.../chapter5_6_2.html)는 검색 결과에 나왔지만 **404**였다. 초기화 절차는 공식 확인 실패로 남겼다.

## 3. 확보한 공식 근거 (원문 열어 확인한 것)

| 항목 | 출처 | 열어본 결과 |
|---|---|---|
| 깜빡 약 1분 후 켜짐 = 시스템 이상 | 기아 CT1 2026 오너스 매뉴얼 TPMS 항목 (t00980) | 열림 |
| 저압 상태에서 시스템 고장 시 깜빡 후 점등, 위치 표시 소멸 | 같은 페이지 | 열림 |
| 센서 고장 시 모든 위치 표시등 점등 | 같은 페이지 (기존 팩트 재사용) | 열림 |
| 실런트가 센서·휠에 묻으면 경고등 가능 / 직영·서비스협력사 점검 | 같은 페이지 | 열림 |
| 경고 기준 20% 또는 150kPa, 10분·60분 누적주행 | 국가법령정보센터 자동차안전기준에 관한 규칙 별표 6 | 열림 (2011 공포, 2013-01-01 시행, 현행 표시 없음) |
| 그랜저 GN7 TPMS 경고등 시 블루핸즈·하이테크센터 점검 | 현대 2026 GN7 오너스 매뉴얼 | 열림 |
| 그랜저 GN7 29psi(200kPa) 이하 주행 금지 | 같은 페이지 | 열림 (요약 도구 인용, 수치는 차종 한정) |

## 4. 법령 기준 확인 내용

- 정의: "타이어공기압경고장치란 자동차에 장착된 타이어 공기압의 저하를 감지하여 운전자에게 타이어 공기압의 상태를 알려주는 장치"(제2조 제56호).
- 설치 대상: 승용차와 차량총중량 3.5톤 이하 승합·화물·특수자동차 (복륜·피견인 제외).
- 경고 조건(별표 6): 1개 타이어 운행공기압 20% 감소 또는 150kPa 중 큰 값 도달 후 10분 누적주행 이내 점등. 4개 타이어 20% 감소 후 60분 이내 점등.
- 페이지에 25%라는 문구는 없다.
- 주의: 법정 조건은 '점등해야 하는 조건'이다. 권장 공기압 자체가 아니다. 권장값은 차량 명판 기준이다.

## 5. 후기·비공식 (evidence "후기")

- tilnote 정리글: 계속 켜지면 공기압 쪽, 깜빡인 뒤 켜지면 시스템 쪽으로 보는 구분, 네 바퀴 모두 낮으면 기온·자연 감소 의심, 한 바퀴만 낮으면 펑크 의심. tier 논쟁, 시도 순서로만 쓸 것.
- 검색 요약의 센서 배터리 수명 5~10년 문구는 fanttik 블로그(429로 열지 못함) 기반이라 **팩트로 넣지 않았다.**
- 리셋 후에도 안 꺼지는 경우 원인으로 블로그들이 센서 고장, 밸브 누출, 배터리 방전, 못 박힘을 든다. 공식 문서 확인은 못 했다. 이 글에서는 "정비소 점검 대상"으로만 쓴다.

## 6. 집필 시 권장 흐름 (조사 결과 기반)

1. 경고등이 계속 켜졌는지, 약 1분 깜빡인 뒤 켜졌는지 구분 (공식: 깜빡 후 점등 = 시스템 이상).
2. 식은 상태에서 권장값 확인 후 네 바퀴 점검 (기존 팩트 tpms-pressure-check-method, tire-cold-check-3h).
3. 한 바퀴만 낮으면 펑크 가능성, 네 바퀴 다 낮으면 기온 하락 가능성 (후기).
4. 권장값까지 맞춘 뒤에도 안 꺼지면 센서·시스템 점검 대상. 그랜저 GN7 기준 블루핸즈·하이테크센터, 기아 기준 직영 서비스센터·서비스협력사.
5. 초기화 절차는 쓰지 말고 차량 매뉴얼의 TPMS 항목 확인까지만.
6. 안전: 깜빡임이든 점등이든 급제동 금지, 비상등, 안전한 곳 정차 (flat-tire-no-sudden-brake 재사용).

## 7. 출처 목록

- https://ownersmanual.kia.com/full_webhelp/CT1/2026/ko_KR/topics/t00980.html (기아 공식)
- https://ownersmanual.hyundai.com/full_webhelp/GN7/2026/ko_KR/id3a46fa79f2d.html (현대 공식)
- https://www.law.go.kr/LSW/nwRvsLsInfoR.do?... (국가법령정보센터, 정부)
- https://tilnote.io/en/pages/6ae762c4a565f4932c73bafd (후기)
- 열지 못한 곳: molit.go.kr 정책자료 (리다이렉트 루프), 기아 초기화 페이지 (404), fanttik 블로그 (429)
