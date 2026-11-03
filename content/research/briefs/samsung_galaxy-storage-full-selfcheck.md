# 조사 전문: 갤럭시 저장공간이 부족할 때 정리하는 순서

- slug: galaxy-storage-full-selfcheck / 코너: repair / 분야: 디지털·IT
- 조사일: 2026-11-03
- 팩트 파일: content/research/facts/samsung_galaxy-storage-full-selfcheck.json

## 1. 힌트와 달랐던 점

총괄 힌트는 "기기 케어 > 저장공간 > Clean now"였다. 공식 원문은 달랐다.

- 삼성 PH 공식 페이지와 AE 공식 기기 케어 페이지는 Clean now를 **메모리 항목의 기능**으로 설명한다. 실행 중인 백그라운드 앱을 닫아 메모리를 확보한다고만 하며, 파일 삭제로 저장공간을 늘린다는 내용은 없다.
- 그래서 저장공간 정리 순서에서 Clean now는 빼고, 휴지통·대용량 파일·미사용 앱·앱 캐시로 대체했다.
- 기존 팩트 galaxy-update-storage-cleanup-path 는 이 점에서 틀렸다. disputes 로 신고했다.
- 제3자 가이드·커뮤니티는 Clean now가 캐시를 지운다고 쓰지만 공식 원문에서 확인되지 않아 채택하지 않았다.

## 2. 핵심 출처 (실제로 열어 본 것)

| 구분 | 출처 | URL | 확인한 내용 |
|---|---|---|---|
| 공식 | Samsung UK 지원 | https://www.samsung.com/uk/support/mobile-devices/how-to-clear-up-storage-space-on-your-smartphone | 설정 > 배터리 및 기기 케어(구형 '디바이스 케어') > 저장공간. 휴지통 Empty, 미사용 앱 Uninstall, 중복 파일, 대용량 파일 |
| 공식 | Samsung PH 지원 (저장공간 부족 시) | https://www.samsung.com/ph/support/mobile-devices/how-to-free-up-space-on-your-galaxy-device-when-it-is-full/ | 앱 캐시 경로(설정 > 앱 > 앱 > 저장공간 > Clear cache), 기기·버전별 메뉴 차이 안내 |
| 공식 | Samsung PH 지원 (불필요한 파일) | https://www.samsung.com/ph/support/mobile-devices/how-to-remove-unnecessary-files-and-close-background-apps-on-your-samsung-galaxy-phone/ | 메모리 > 지금 정리 = 앱 종료. 파일 삭제 언급 없음 |
| 공식 | Samsung AE 기기 케어 | https://www.samsung.com/ae/support/mobile-devices/what-is-the-device-care-feature-in-galaxy-smartphones | Memory의 Clean now = 백그라운드 앱 중지 |
| 공식(국내) | 삼성전자서비스 디바이스 케어 | https://www.samsungsvc.co.kr/solution/41004 | 설정 > 디바이스 케어 > 지금 최적화 = 저장공간 확보, 불필요한 파일·백그라운드 앱 정리. 캐시 언급 없음 |
| 공식(국내) | 삼성전자서비스 업데이트 안내 | https://www.samsungsvc.co.kr/solution/617801 | 저장공간 부족이 업데이트 실패 원인일 수 있음. 백업(PC·클라우드) 후 공간 확보. 앱 데이터 삭제 시 파일·설정·계정 삭제. 사용하지 않는 앱 삭제. 저장공간 충분하면 안전 모드 업데이트 |
| 공식(국내) | 삼성전자서비스 업데이트 실패 안내 | https://www.samsungsvc.co.kr/solution/40394 | 20% 이상 충전 확인. 해결 안 되면 모바일센터 예약·AI CS Bot 상담 |
| 공식 | Google 포토 고객센터 | https://support.google.com/photos/answer/6128843 | 기기 저장공간 확보는 백업 완료 사진만. 기기에서 지워도 라이브러리에 남음 |
| 공식 | Google 포토 고객센터 (저장공간 관리) | https://support.google.com/photos/answer/9284827 | 클라우드 저장공간 관리는 Google 계정 용량 문제 |

## 3. 재사용 (reused_facts)

- galaxy-update-backup-before-storage-cleanup: 용량 확보 전 PC·클라우드 백업 (617801, 재확인)
- galaxy-update-storage-amount-not-published: 필요 용량 숫자는 공식 문서에 없음 (PH, 기존 확인 유지)
- galaxy-update-battery-20-percent-official: 업데이트 전 20% 이상 충전 (40394, 재확인)

## 4. 거부 (declined_facts)

- galaxy-update-storage-cleanup-path: Clean now 위치 충돌, disputes 로 신고
- third-party-clean-now-deletes-cache: 공식 원문 미확인

## 5. 수집한 팩트 (새 팩트 14건)

tier 전부 확실, evidence 전부 공식. 상세 scope·caution·cautionSource 는 JSON 참조.

- galaxy-storage-check-path-device-care: 확인 경로와 구형 명칭
- galaxy-storage-storage-menu-tools: 휴지통·미사용 앱·중복·대용량 항목
- galaxy-storage-optimize-now-korea: 국내 지금 최적화 경로
- galaxy-storage-memory-clean-now-not-storage: Clean now는 메모리 기능
- galaxy-storage-cache-clear-path: 캐시 삭제 경로 (Clear data와 구분)
- galaxy-storage-app-data-delete-includes-files: 앱 데이터 삭제 = 파일·설정·계정 포함
- galaxy-storage-uninstall-unused-apps: 미사용 앱 삭제
- galaxy-storage-large-media-cause: 사진·영상이 용량 부족 원인
- galaxy-storage-google-photos-backup-first: 백업 완료 후에만 기기 비우기
- galaxy-storage-google-photos-cloud-copy-remains: 기기에서 지워도 클라우드 보존
- galaxy-storage-cloud-warning-is-separate: 클라우드 경고와 기기 용량 구분
- galaxy-storage-update-fail-safe-mode: 용량 충분 시 안전 모드 업데이트
- galaxy-storage-service-center-escalation: 공식 접수 경로 (모바일센터 예약)
- galaxy-storage-menu-path-varies: 메뉴 경로는 기종·버전별 차이 (PH 원문 인용)

## 6. 집필 권고 순서 (근거 기반)

1. 설정 > 배터리 및 기기 케어(구형은 디바이스 케어) > 저장공간에서 상태 확인 (galaxy-storage-check-path-device-care)
2. 백업 먼저 (galaxy-update-backup-before-storage-cleanup, galaxy-storage-google-photos-backup-first)
3. 휴지통 Empty, 대용량·중복 파일, 미사용 앱 삭제 (galaxy-storage-storage-menu-tools, galaxy-storage-uninstall-unused-apps)
4. 앱별 캐시 삭제. Clear data 는 데이터 삭제이므로 구분 (galaxy-storage-cache-clear-path, galaxy-storage-app-data-delete-includes-files)
5. 사진은 Google 포토 기기 비우기 또는 PC 이동. 클라우드 용량 경고는 별개 (galaxy-storage-cloud-warning-is-separate)
6. 업데이트가 안 되면 용량 재확인 → 안전 모드 → 모바일센터 예약 (galaxy-storage-update-fail-safe-mode, galaxy-storage-service-center-escalation)

## 7. 한계

- 국내 공식 원문은 저장공간 메뉴의 세부 화면(휴지통 보관 기간, 대용량 파일 기준 크기)을 다루지 않는다. 이 부분은 원문에 없으므로 집필에서 수치로 쓰지 않는다.
- Samsung 공식 페이지 다수는 PH·UK·AE 등 해외 지역 페이지다. 국내 메뉴명이 다를 수 있어 집필 시 "기종·One UI 버전에 따라 다를 수 있다"를 반드시 넣는다.
- AS 보증·비용 정보는 공식 출처에서 확인하지 못했다. 집필에서 금액을 말하지 않는다.
