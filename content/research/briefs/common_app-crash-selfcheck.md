# 조사 전문 — 앱이 자꾸 강제 종료될 때 원인 좁히는 순서

- 슬러그: app-crash-selfcheck / 코너: repair / 분야: 디지털·IT
- 조사일: 2026-11-03
- 팩트 파일: `content/research/facts/common_app-crash-selfcheck.json`

## 1. 기존 팩트 재사용

- 재사용 6건: `factory-reset-data-loss`, `iphone-storage-check-path`, `iphone-offload-vs-delete`, `galaxy-update-storage-cleanup-path`, `galaxy-update-safe-mode-retry`, `galaxy-update-service-center-contact`
- 거부 3건: `iphone-recovery-mode-data`(복구 모드는 부팅 불가용), `galaxy-update-battery-20-percent-official`(업데이트 설치 전용), `galaxy-update-emergency-recovery-pc`(PC 응급 복구는 데이터 위험이 커서 과함)
- 재사용 6건 중 원래 맥락이 업데이트 실패인 것(저장공간 경로·안전 모드·서비스센터 번호)은 본문에서 맥락을 밝혀 쓴다.

## 2. 공식 점검 순서 (원문 기준)

### 애플 (iPhone·iPad) — Apple 지원 HT201398
근거: https://support.apple.com/ht201398 (직접 열어 확인)
1. 앱을 강제 종료한 뒤 다시 연다.
2. 기기를 재시작하고 앱을 확인한다.
3. App Store에서 앱 업데이트를 확인하고, 없으면 iOS를 업데이트한다.
4. 앱을 삭제하고 다시 내려받는다. 이때 앱 데이터를 잃을 수 있다고 원문이 경고한다.
5. 개발사에 문의한다. 최근 구매라면 환불을 요청할 수 있다.

### 갤럭시 — 삼성 AE 공식 지원 페이지 (직접 열어 확인)
근거: https://www.samsung.com/ae/support/mobile-devices/solutions-for-apps-crashing-and-freezing-on-your-galaxy-device/
1. 모바일 데이터·Wi-Fi를 2~3분 끄고 다시 연결해 본다.
2. 앱 캐시를 지운다(설정 > 앱 > 모든 앱 보기 > 앱 > 저장공간 > 캐시 지우기).
3. 그래도 안 되면 데이터 지우기(앱 저장 데이터 전체 삭제, 백업 먼저).
4. 저장공간을 확보한다(설정 > Device Care > Storage).
5. 시스템 업데이트를 확인하고 Google Play 앱을 모두 업데이트한다.
6. 앱을 삭제 후 Play 스토어에서 재설치한다.
7. 최후 수단으로 공장 초기화(설정 > General Management > Reset > Factory Data Reset, 백업 필수).
8. 부가 점검: 안전 모드로 재시작해 제3자 앱 충돌 여부 확인(재사용 팩트), 특정 앱이 멈추면 배터리 최적화 해제.

## 3. 힌트와 달랐던 점

- 힌트는 원인을 "저장공간·업데이트·캐시·OS 버전" 순으로 좁히라고 했지만, 공식 원문은 **네트워크 → 캐시 → 데이터 → 저장공간 → 업데이트 → 재설치 → 초기화** 순이다. 애플은 "재시작 → 앱 업데이트 → iOS 업데이트 → 재설치" 순이다. 원문 순서를 따랐다.
- 저장공간이 강제 종료를 직접 일으킨다는 원문 문장은 확인하지 못했다. `app-crash-low-storage-link-unverified`(확인실패)로 남겼다. 독자에게는 점검 항목으로만 제시한다.
- 애플 원문은 데이터 삭제와 재설치에 대해 "잃을 수 있다"고만 쓰고, 백업을 명령형으로 쓰지 않는다. 백업 지시는 공통 기준선(`factory-reset-data-loss`)과 취지를 맞춰 caution에 적었다.

## 4. 미확인·막힌 점

- Apple 원문에 캐시 지우기 방법은 없다. 앱 캐시 지우기는 삼성 원문에만 있다. iPhone 쪽은 캐시를 시스템이 알아서 지운다는 정도만 확인했다(재사용 팩트 `iphone-storage-check-path`의 caution).
- 앱 강제 종료 AS 접수 기준(보증·어느 시점부터 센터 방문)은 공식 원문에서 확인하지 못했다. 삼성 서비스 대표전화 1588-3366은 기존 업데이트 실패 팩트를 재사용해 "점검 후에도 계속되면 문의" 수준으로만 쓴다.
- 삼성 AE 페이지는 한국어 페이지가 아니다. 메뉴 이름은 KR 기기와 다를 수 있으니 caution에 그대로 적었다.
- 웹 검색·조회는 약 5회로 끝냈다. 커뮤니티 글(discussions.apple.com 등)은 검색 요약만 보고 원문은 열지 않았으므로 팩트 근거로 쓰지 않았다.

## 5. 검증

- `node scripts/magazine-srcaudit.mjs --scope=common_app-crash-selfcheck`: 배제 대상 0건, 미확인 도메인 0건. 출처 세탁·허용목록 위반 0건.
- `research-index.mjs`는 지시대로 실행하지 않았다(INDEX.md 보호).
