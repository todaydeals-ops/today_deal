# 윈도우에서 블루투스 기기가 연결되지 않을 때 — 조사 브리프

- 글 slug: windows-bluetooth-selfcheck / 코너: repair / 분야: 디지털·IT
- 조사일: 2026-11-03
- 팩트 파일: content/research/facts/microsoft_windows-bluetooth-selfcheck.json (16건, 재사용 0, 거부 3, 신고 0)

## 1. 확인한 공식 원문

| 원문 | URL | 확인 방식 |
|---|---|---|
| Fix Bluetooth problems in Windows | https://support.microsoft.com/en-us/windows/hardware/bluetooth/fix-bluetooth-problems-in-windows | 열어서 본문 확인 |
| Troubleshoot Bluetooth not connecting in Windows | https://support.microsoft.com/en-us/windows/hardware/bluetooth/troubleshoot-bluetooth-not-connecting-in-windows | 열어서 본문 확인 |
| Bluetooth keeps disconnecting in Windows | https://support.microsoft.com/en-us/windows/hardware/bluetooth/bluetooth-keeps-disconnecting-in-windows | 열어서 본문 확인 |

세 페이지 모두 열려서 원문을 직접 확인했다. 도구로 요약 추출한 내용이라 메뉴 문구는 영문 원문과 대조해 글에 쓸 때 한 번 더 확인할 것.

## 2. 증상별 점검 순서 (공식 기준)

**A. 기기가 목록에 뜨는데 연결이 안 됨 (페어링·연결 실패)**
1. Get Help 앱의 Bluetooth 문제 해결사 실행 (Windows 11 권장 첫 단계). 경로: 설정 > 시스템 > 문제 해결 > 기타 문제 해결사 > Bluetooth '실행'.
2. Bluetooth 켜기 확인, 기기는 페어링 모드 + PC 근처. 충전식 기기는 완전 충전 후 전원 껐다 켜기, 충전식 헤드폰·스피커는 페어링 중 충전 케이블 연결 유지.
3. 기기 제거 후 재추가: 설정 > Bluetooth 및 장치 > 장치 > 더보기(...) > 장치 제거 > 예 → 다시 추가.
4. Bluetooth 끄기 → 약 10초 대기 → 다시 켜기.
5. 비행기 모드 꺼짐 확인, 노트북 물리 Bluetooth 스위치가 있으면 켜짐 확인.
6. 설정 > Windows Update에서 업데이트 설치.
7. 시작 > 전원 > 다시 시작.
8. USB 3.0 간섭: 차폐되지 않은 USB 3.0 기기가 방해할 수 있으니 Bluetooth 기기를 떨어뜨린다.

**B. 연결은 되는데 자꾸 끊김**
1. 절전 모드 끄기: Windows 11 '에너지 절약 모드', Windows 10 '배터리 절약 모드'.
2. 장치 관리자 > Bluetooth > 기기 우클릭 > 전원 관리 탭 > '전원을 절약하기 위해 컴퓨터가 이 장치를 끌 수 있음' 해제.
3. Bluetooth Support Service 재시작: Win+R > services.msc > 해당 서비스 우클릭 > 다시 시작.
4. 드라이버 업데이트 (아래 C).

**C. 드라이버·어댑터 문제 (장치 관리자)**
1. 장치 관리자 > Bluetooth > 어댑터 우클릭 > 드라이버 업데이트 > 드라이버 자동 검색.
2. 자동 검색 실패 시 PC 제조사 홈페이지에서 받기. .exe면 실행, .inf·.sys 묶음이면 '드라이버 찾아보기'로 폴더 지정.
3. 그래도 안 되면 어댑터 제거 → '시스템 종료'(재시작 아님) → 몇 초 뒤 켜기 → 드라이버 재설치. 안 되면 동작 > 하드웨어 변경 사항 검색.

**D. 여기까지 해도 안 되면**
- 공식 문서는 최신 드라이버가 필요하면 PC 또는 어댑터 제조사에 문의하라고만 안내한다. 보증 기간·AS 접수 기준은 공식 Bluetooth 문서에 없음 (확인실패로 기록).

## 3. 힌트와 달랐던 점 (총괄 참고)

- **재시작 순서**: 힌트의 '드라이버 제거 후 재시작'은 공식 문서에 따르면 **재시작이 아니라 시스템 종료**다. 2차 가이드의 Shift 누른 채 종료 절차는 공식에 없어 쓰지 않았다.
- **서비스 범위**: 공식 페이지가 명시한 서비스는 Bluetooth Support Service 하나. Audio Gateway·User Support 서비스 재시작은 확인실패 처리.
- **USB 3.0 간섭**: 힌트에 없던 항목이지만 공식(Fix Bluetooth problems)에 있어 추가. 단 "can sometimes"라는 완곡 표현이라 단정하지 않는다.
- **Windows 10 지원 종료**: 공식 문서가 2025-10-14 종료와 Windows 11 권장을 밝힘. scope를 Windows 10 포함 여부로 나눠 기록.
- **Windows 10 경로**: 단계는 같고 메뉴 이름만 다름 (설정 > 장치 > Bluetooth 및 기타 장치, 설정 > 업데이트 및 보안 > 문제 해결 등).

## 4. 안전

- Bluetooth 연결 문제 자체에는 감전·화재 등 위험 경고가 공식 문서에 없다. 배터리 부풂 등 기기 안전 문제는 이번 글 범위 밖이라 팩트로 올리지 않았다.
- 드라이버 제거·재설치는 데이터 손실 위험이 낮지만, 제거 전에 드라이버 파일을 미리 받아 두라는 안내를 글에 넣을 것 (공식 문서 자체에는 이 문구가 없으므로 글에서는 '준비 권장' 수준으로 쓴다).

## 5. 재사용·거부

- 재사용: 없음 (Microsoft 기존 팩트는 마이크·Windows Update·BSOD 주제라 Bluetooth 절차와 겹치지 않음).
- 거부 3건: mic-device-manager-reinstall-last (오디오 장치 제거 절차), win-update-troubleshooter-path (대상이 Windows Update), factory-reset-data-loss (이번 범위에 초기화 없음).

## 6. 출처 감사

`node scripts/magazine-srcaudit.mjs --scope=microsoft_windows-bluetooth-selfcheck` 결과: 배제 대상 0건, 미확인 도메인 0건. 모든 source_url은 support.microsoft.com 도메인이며 실제로 열어 본문을 확인한 페이지다.
