# 애플펜슬 연결 안 됨·충전 안 됨·필기 끊김 자가점검 조사

- 슬러그: apple-pencil-selfcheck / 코너: repair / 분야: 디지털·IT
- 조사일: 2026-11-03
- 팩트 파일: content/research/facts/apple_apple-pencil-selfcheck.json

## 0. 저장소 확인
- facts 디렉토리에서 "pencil" 키워드는 기존 팩트에 없었다.
- 블루투스 액세서리 일반 절차는 apple_iphone-wifi-bluetooth-selfcheck.json에 이미 있어 재사용했다 (iphone-bluetooth-accessory-basics, iphone-bluetooth-unpair-repair).
- 배터리 스웰링 중단 기준은 공통_as-safety-baseline.json의 battery-swelling-stop-immediately를 재사용했다.
- 배터리 성능 메뉴 위치 팩트(iphone-battery-menu-split, ipad-battery-health-check-location)는 펜슬 점검과 무관해 declined 처리했다.

## 1. 핵심 출처 (직접 연 것 / 검색 발췌만 확인한 것)
- [공식·직접 확인] Apple 지원 "If you can't pair Apple Pencil with your iPad" (문서 108788): https://support.apple.com/en-us/108788 — 본문을 직접 열어 단계 확인. 페어링 절차, Pair 버튼 대기 1분, 케이스 제거(Pro·2세대 한정), 서비스 안내, 1세대 연결 방식(6~9세대 Lightning, 10세대·A16 USB-C 어댑터)이 여기서 나왔다.
- [공식·검색 발췌] Apple iPadOS 사용 설명서 "Pair and charge Apple Pencil" 2세대·Pro·USB-C·1세대 페이지: 본문은 열리지 않아(목차만 로드) 검색 발췌로만 확인. tier "논쟁"으로 낮추고 caution에 원문 재확인을 명시했다.
- [공식·직접 확인] Apple 지원 iPad 수리 페이지: https://support.apple.com/ipad/repair — AppleCare 배터리 80% 기준은 iPad 본체 문구로 확인. 펜슬 적용은 검색 요약에만 있어 "논쟁"으로 처리.
- [공식·직접 확인] Apple 지원 "블루투스 액세서리가 아이폰 또는 아이패드에 연결되지 않는 경우" (문서 111804): 일반 절차 확인.
- [후기] iGeeksBlog 가이드 (제3자): https://www.igeeksblog.com/apple-pencil-not-charging/ — 먼지·두꺼운 케이스 충전 방해, 15~30분 충전 대기, 재시작·재페어링 절차. 공식 근거가 아니므로 후기 등급.
- [후기] Apple Community 토론 thread 253050982: 1세대 펜슬 연결 but 동작 안 함 사례, 전문가 답변(팁 교체 확인, 설정>일반>정보 확인, 분리 상태 배터리 위젯 관찰, 보증 내 Apple Store 교체).

## 2. 세대 구분 (이 글에서 쓰는 기준)
| 모델 | 연결·충전 방식 | 공식 근거 |
|---|---|---|
| Apple Pencil(1세대) | 아이패드 6~9세대는 Lightning 포트, 10세대·A16은 USB-C to Apple Pencil 어댑터 | 108788 직접 확인 |
| Apple Pencil(USB-C) | USB-C 케이블로 아이패드에 연결, 페어링 유지 조건(재시작·블루투스 끔·다른 아이패드 페어링) | 사용 설명서 검색 발췌 |
| Apple Pencil(2세대) | 블루투스 켠 뒤 아이패드 오른쪽 측면 자석 커넥터 | 사용 설명서 검색 발췌 |
| Apple Pencil Pro | 호환 아이패드 긴 쪽 측면 자석 커넥터 | 사용 설명서 검색 발췌 |

## 3. 힌트와 달랐던 점
- 힌트의 "필기 끊김" 전용 절차는 Apple 공식 문서에서 찾지 못했다. 팩트 pencil-handwriting-lag-no-official-steps를 확인실패로 남겼다. 집필은 "페어링·충전이 정상이면 필기 앱 설정과 보호필름을 바꿔 보고, 되풀이되면 서비스"로 쓰는 것이 안전하다.
- 힌트에는 "팁 교체"가 있었으나 Apple 공식 문서에서 팁 교체 절차는 확인하지 못했다. 커뮤니티 답변(후기)에서만 나왔다.

## 4. 서비스 기준
- 공식: Pair 버튼이 끝내 안 뜨면 서비스 받기 (108788).
- 공식(iPad 기준): AppleCare 가입 기기는 배터리 용량 80% 미만이면 무상 교체. 정상 소모 배터리는 보증 제외 (support.apple.com/ipad/repair). 펜슬 적용은 미확인이라 집필 시 명시 필요.
- 서비스 요금 금액은 페이지 가격표가 로드되지 않아 수록하지 않았다.

## 5. 안전
- 배터리 부풀음·과열·타는 냄새 시 즉시 중단 (공통 기준선 재사용). 펜슬 내부 배터리 자가 분해·교체 안내 금지.

## 6. 검색 사용
- WebSearch 4회, WebFetch 9회 (재시도 포함). 웹 검색 6회 이내.
