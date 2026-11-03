# 노트북 배터리가 빨리 닳을 때 설정부터 점검 — 조사 브리프

- slug: laptop-battery-drain-selfcheck / 코너: repair / 분야: 디지털·IT
- 조사일: 2026-11-03
- 팩트 파일: content/research/facts/microsoft_laptop-battery-drain-selfcheck.json

## 0단계 저장소 확인

- facts 폴더에서 배터리·절전·발열 키워드로 검색. 노트북 전용 배터리 팩트는 없었음.
- 재사용: battery-swelling-stop-immediately (공통 안전 기준선, Apple 정품 배터리 문서). 부풀음 시 즉시 사용 중단.
- 거부: 없음. 삼성 공장 초기화, 충전 통념 팩트 등은 이번 주제(설정 점검)와 층위가 달라 재사용하지 않음.

## 1차 공식 출처 (직접 열어 확인)

1. Microsoft 지원 — Windows 배터리 절약 팁
   https://support.microsoft.com/en-us/windows/experience/power-battery/battery-saving-tips-for-windows
   배터리 사용량 경로, 전원 모드, 에너지 절약 임계치(24H2/24H1 분리), 화면·절전 시간, 동영상 재생 옵션, 재시작.
2. Microsoft 지원 — 앱의 백그라운드 활동 관리
   https://support.microsoft.com/en-us/windows/experience/performance-optimization/manage-background-activity-for-apps-in-windows
   Always / Power optimized(권장) / Never 세 단계. Never는 알림·업데이트 차단, 최소 한 앱은 Always 필요.
3. Microsoft 지원 — 에너지 권장 사항 자세히 알아보기
   https://support.microsoft.com/en-us/windows/experience/power-battery/learn-more-about-energy-recommendations
   에너지 권장 사항 메뉴 경로와 항목 목록. USB 권장 항목은 화면 꺼짐 중 USB 접근을 차단.
4. Microsoft 지원 — Windows 배터리 관리
   https://support.microsoft.com/en-us/windows/experience/power-battery/caring-for-your-battery-in-windows
   powercfg /batteryreport 명령(원문 철자 'Powerfg' 오기 주의), 20~80% 충전 권장, 스마트 충전, 부풀음 시 사용 중단.
   보고서 기본 저장 위치는 이 페이지에 없음 (확인실패로 기록).
5. Microsoft 지원 — Surface 배터리 관리
   https://support.microsoft.com/en-us/surface/caring-for-your-surface-battery-9ccdfa7b-d074-f629-425c-1c090ac66bed
   외장을 밀어낼 정도로 부풀면 사용 중단, 누르거나 찌르지 않기, Surface 교체 요청 양식.
6. Microsoft 지원 — Surface 배터리 용량 확인 방법
   https://support.microsoft.com/en-us/surface/battery/how-to-check-your-surface-battery-capacity
   Surface Repair Tool / Surface Diagnostic Toolkit의 Battery information. 설계 용량 대비 70% 미만이면 교체 검토.

## 후기 출처

7. Microsoft Tech Community 토론 (Windows 11 업그레이드 후 배터리 감소 사례)
   https://techcommunity.microsoft.com/discussions/windows11/battery-drain-issues-post-upgrading-to-windows-11/2933739
   공식 해결책 없음. 사용자들이 시도한 앱 종료·웹 팁·드라이버 갱신은 효과가 없었다는 보고. 커뮤니티 답변은 Feedback Hub 신고를 권함.
   tier 논쟁 / evidence 후기로 기록.

## 힌트와 달랐던 점

- 조사 범위 힌트는 "배터리 사용량 점검·절전 설정·백그라운드 앱·상태 보고서·부풀음/발열 서비스센터"였음. 공식 원문 기준으로 모두 확인 가능.
- Microsoft 공식 페이지는 노트북 제조사별 AS 접수 경로를 다루지 않음. 삼성·LG 등 제조사 AS 경로는 이번 조사에서 확보하지 않았으므로 글에서는 "제조사 고객센터"로 안내하고 세부 경로는 별도 조사가 필요.
- 발열 항목은 공식 근거를 확보하지 못함. 부풀음 항목만 공식 근거가 있음.
- 검색 중 찾은 일부 블로그·콘텐츠 팜 자료는 공식 근거로 쓰지 않았음.
- "powercfg /batteryreport" 공식 Learn 문서 URL은 404로 열리지 않아 Caring 페이지를 근거로 사용.

## 검색 횟수

웹 검색 5회 (6회 이내). 공식 페이지 열람은 WebFetch로 확인.
