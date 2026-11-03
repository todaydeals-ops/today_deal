# 조사 브리프: 크롬 브라우저가 느려지고 팝업 광고가 뜰 때

- 슬러그: browser-slow-popup-selfcheck / 코너: repair / 분야: 디지털·IT
- 조사일: 2026-11-03
- 팩트 파일: content/research/facts/google_browser-slow-popup-selfcheck.json (17건)

## 1. 기존 팩트 재사용 검토

- content/research/facts/ 를 Grep 으로 chrome·브라우저·팝업·확장 키워드 검색. 직접 겹치는 Chrome 팩트는 없었다.
- common_webcam-selfcheck.json 이 Chrome 카메라 권한 문서(answer/2693767)를 인용하지만 웹캠 주제라 재사용하지 않았다.
- 공통_as-safety-baseline.json 의 factory-reset-data-loss(삼성 스마트폰 공장 초기화)는 스마트폰 초기화 문서라 Chrome 설정 재설정에는 적용하지 않았다. 재사용 0건, 거부 0건.

## 2. 공식 원문 확인 결과 (핵심만)

| 항목 | 확인 내용 | 출처 |
|---|---|---|
| 팝업 기본 차단 | 기본 차단, 주소창 '팝업 차단됨' 표시 | Chrome 고객센터 answer/95472 (원문 열람) |
| 팝업 설정 경로 | 더보기 > 설정 > 개인 정보 및 보안 > 사이트 설정 > 팝업 및 리디렉션 | answer/95472 (원문 열람) |
| 방해가 되는 광고 | 더보기 > 설정 > 개인 정보 보호 및 보안 > 사이트 설정 > 추가 콘텐츠 설정 > 방해가 되는 광고 | answer/2765944 (원문 열람) |
| 알림 권한 | 설정 > 개인 정보 및 보안 > 사이트 설정 > 알림 | answer/3220216 (원문 열람) |
| 확장 프로그램 관리 | 더보기 > 확장 프로그램 > 확장 프로그램 관리, 사용 중지·삭제 | Chrome 웹 스토어 고객센터 answer/2664769 (원문 열람) |
| 설정 재설정 | 더보기 > 설정 > 설정 초기화 > 설정을 기본값으로 복원 > 설정 초기화. 재설정 후 확장 프로그램 재설정 필요 | answer/2765944, answer/99020 (원문 열람) |
| 캐시·기록 삭제 (데스크톱) | 더보기 > 인터넷 사용 기록 삭제, 쿠키 및 기타 사이트 데이터·캐시된 이미지 및 파일 선택 | answer/95582 desktop (원문 열람) |
| 비밀번호는 별도 | 기록 삭제로 저장된 비밀번호는 지워지지 않음 | answer/95582 desktop |
| 속도 높이기 | 사용하지 않는 탭 닫기, 확장 사용 중지, 작업 관리자 종료(저장 안 된 작업 삭제 주의) | answer/1385029 desktop (원문 열람) |
| 안전하지 않은 사이트 | 세이프 브라우징 끄기 비권장, 경고 사이트 방문 비권장 | answer/99020 desktop (원문 열람) |
| Google 계정 비밀번호 | myaccount.google.com > 보안 및 로그인 > 비밀번호, 변경 시 대부분 기기 로그아웃 | Google 계정 고객센터 answer/41078 (원문 열람) |
| 보안 점검 | myaccount.google.com/security-checkup 에서 계정 보안 문제 확인 | answer/9924802 (원문 열람) |
| 의심 프로그램 제거 | Windows 설정 > 앱 > 설치된 앱, Mac은 응용 프로그램에서 휴지통 이동 | answer/2765944 (원문 열람) |

## 3. 힌트와 달랐던 점

- 범위 힌트의 "확장 프로그램 점검" 근거로 준 URL 답습(answer/2664740)은 404였다. 같은 주제의 Chrome 웹 스토어 고객센터 answer/2664769 로 대체했다.
- 힌트의 "재설정 시 무엇이 초기화되는지(시작 페이지·검색엔진·고정 탭·확장 비활성 등)"는 원문에서 전체 목록을 확인하지 못했다. 재설정 절차와 "확장 프로그램 재설정 필요", "검색 설정 자동 복원 알림"만 팩트로 남겼다. 개별 항목 목록은 확인실패로 두고 글에서 단정하지 않는다.
- 힌트의 "Chrome 정리 도구" 메뉴(chrome://settings)는 검색 요약에서만 보였고 원문 본문에서 확인되지 않았다. 출처 세탁 방지를 위해 팩트에서 제외했다. 글에 쓰려면 원문 재확인이 먼저 필요하다.
- 데스크톱 기준 캐시 삭제 경로는 Android 원문과 다르므로 desktop 파라미터 URL로 열어 확인했다.

## 4. 집필 시 주의

- 팝업 광고가 뜨는 원인은 사이트 알림 구독, 멀웨어, 원치 않는 확장 프로그램으로 나뉜다. 순서는 알림 차단, 확장 프로그램 점검, 설정 재설정, 의심 프로그램 제거 순으로 쓴다.
- 캐시 삭제는 로그인 풀림과 비밀번호 비저장 영향을 같이 안내한다.
- 계정 비밀번호 변경은 의심 활동이 확인될 때의 조치로만 쓰고, 근거 없는 단정은 피한다.
- 회사·학교 기기는 관리자 설정이라 사용자가 바꿀 수 없다는 점을 명시한다.
- 경고가 뜬 사이트에서 "안전하지 않은 사이트로 계속"을 권하지 않는다.

## 5. 검색 사용 내역

WebSearch 4회 (support.google.com 한정), WebFetch 공식 원문 약 14회. 검색 6회 이내 준수.

## 6. 출처 감사

node scripts/magazine-srcaudit.mjs --scope=google_browser-slow-popup-selfcheck 실행 결과: 배제 대상 0건, 미확인 도메인 0건. 허용목록 위반 항목은 출력에 나오지 않았다.

## 7. 원문 확인 출처 목록

- https://support.google.com/chrome/answer/95472?hl=ko
- https://support.google.com/chrome/answer/2765944?hl=ko
- https://support.google.com/chrome/answer/3220216?hl=ko
- https://support.google.com/chrome/answer/99020?hl=ko&co=GENIE.Platform%3DDesktop
- https://support.google.com/chrome/answer/95582?hl=ko&co=GENIE.Platform%3DDesktop
- https://support.google.com/chrome/answer/1385029?hl=ko&co=GENIE.Platform%3DDesktop
- https://support.google.com/chrome_webstore/answer/2664769?hl=ko
- https://support.google.com/accounts/answer/41078?hl=ko
- https://support.google.com/accounts/answer/9924802?hl=ko&co=GENIE.Platform%3DDesktop
