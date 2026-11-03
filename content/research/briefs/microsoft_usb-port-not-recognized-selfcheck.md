# 조사 전문: USB 장치가 인식되지 않을 때 포트와 드라이버 점검

- slug: usb-port-not-recognized-selfcheck / 코너 repair / 분야 디지털·IT
- 조사일: 2026-11-03
- 팩트 파일: content/research/facts/microsoft_usb-port-not-recognized-selfcheck.json

## 1. 저장소 확인 (0단계)

- facts/ 전수에서 USB 관련 항목을 Grep 으로 확인했다.
- 재사용: `energy-recommendations-menu` (microsoft_laptop-battery-drain-selfcheck.json). "화면이 꺼졌을 때 USB 장치 중지" 절전 옵션과 그 caution(외장 하드 등 백그라운드 동작 시 끌 것)을 그대로 가져왔다.
- 거부: `factory-reset-data-loss` (공통_as-safety-baseline.json). 스마트폰 초기화 기준이라 PC USB 인식 점검에 맞지 않는다.
- 관련 기존 팩트(재사용 안 함): apple_ios-update-stuck-selfcheck.json 의 USB 케이블·포트 점검(Apple 업데이트 전용 맥락), common_fast-charging-not-working-selfcheck.json 의 USB 전원 관련(스마트폰 충전 맥락).

## 2. 조사 경로 (웹 검색 2회, 열람 시도 5회)

1. 검색: "Microsoft support USB device not recognized Windows 11 fix" (support.microsoft.com 한정).
2. 열람 성공: Fix USB-C problems in Windows
   https://support.microsoft.com/en-us/windows/hardware/usb/fix-usb-c-problems-in-windows
   (장치 관리자 오류 코드 확인 절차, 충전기·케이블·포트, 전원, 허브·도킹, USB4·Thunderbolt, Windows 10 지원 종료 공지)
3. 열람 성공: Error codes in Device Manager in Windows
   https://support.microsoft.com/en-us/topic/error-codes-in-device-manager-in-windows-524e9e89-4dee-8883-0afa-6bca0456324e
   (코드 10·19·24·39·41·43·45·46·47·48·52 조치. 코드 20은 이 문서에 없었다)
4. 열람 시도 실패(내용 부정확): USB 포트 비활성화 KB 문서 (support.microsoft.com/en-us/help/817900). 같은 요청에 대해 두 번 호출했는데 한 번은 레지스트리 hotfix 내용, 다른 한 번은 USB-C 문서 요약이 돌아왔다. 불일치하므로 이 문서는 팩트로 쓰지 않았다. Windows 8 전용 hotfix 적용 문서여서 현행 Windows 11 점검 대상이 아니다.
5. 열람 성공(무효 처리): support.microsoft.com/en-gb/help/2830154 "Connected USB device is not detected in Windows". 열람 결과 port·USB 컨트롤러·절전·드라이버 단계가 없고 레지스트리 hotfix만 있었다. 팩트로 쓰지 않았다.
6. 열람 실패(403): digitalcitizen.life 와 elevenforum.com 두 곳. 선택적 일시 중단 메뉴 경로는 검색 요약에만 있어 확인실패로만 남겼다.

## 3. 힌트와 달랐던 점

- 총괄 힌트의 "USB 컨트롤러 재설치(장치 관리자에서 Universal Serial Bus controllers 제거 후 재부팅)"는 Microsoft 현행 USB-C 문서와 오류 코드 문서 어디에서도 확인하지 못했다. 검색 요약에서 "USB port troubleshooting article"을 인용했으나 해당 원문을 열지 못했다. 팩트로 올리지 않았다.
- 힌트의 "절전 설정(USB 선택적 일시 중단)"은 Microsoft 공식 원문에서 확인하지 못했다. 제3자 가이드 두 곳은 열람이 403으로 막혀 살아 있음을 확인하지 못했으므로 팩트 JSON에서 제외했다(srcaudit 미확인 도메인 방지). 검색 요약 수준의 내용: 전원 옵션 고급 설정의 USB 설정 아래 USB 선택적 일시 중단. 집필에서 단정하지 말고 메뉴가 없는 PC도 있다는 점만 언급.
- 힌트의 "데이터 보호"는 Microsoft 공식 USB 문서에 경고가 없다. 대신 기존 Microsoft 절전 팩트와 USB 저장장치 안전 제거(코드 47) 조치에서 파일 쓰기 중 뽑지 말 것을 caution으로 붙였다. 이 caution의 근거는 Microsoft 47번 문서가 아니라 일반 저장장치 동작이라고 cautionSource 에 명시했다.
- "다른 PC에서 테스트해 장치와 PC 중 어디가 문제인지 판별"은 실무에서 흔하지만 열람한 공식 원문에는 없었다. 확인실패로 기록했다(팩트 JSON 에 있음).
- "Windows 10 지원 종료 2025-10-14"는 USB-C 문서 말미에 있어 scope 시기를 Windows 11 기준으로 잡았다.

## 4. 수집 결과

- 새 팩트 16개 (tier 확실 15, 확인실패 1). evidence 공식 16.
- 재사용 1 (energy-recommendations-menu), 거부 1 (factory-reset-data-loss).
- 확인된 핵심 출처: Microsoft "Fix USB-C problems in Windows", Microsoft "Error codes in Device Manager in Windows".
- 공식 출처 상 확인된 보증·AS 접수 경로는 없다. 점검 끝의 착지점은 제조사 문의(코드 43·48·52 조치 문서 기준)로 잡았다.

## 5. 집필 시 주의

- 오류 코드 20은 이 문서에 없다. 코드 20을 쓰려면 별도 확인이 필요하다.
- 드라이버 제거(코드 24·39·41)는 장치 드라이버만 지운다. 파일 보존 여부는 원문에 없고 일반 Windows 동작 기준이다.
- 장치 쪽 고장 판별은 확인실패다. 글에서는 "다른 PC에서 테스트해 보면 대략 가늠할 수 있다"는 식으로 되는 경우를 인정하고, 단정하지 않는다.
- 독자 착지점: 포트·케이블·전원 확인 → 오류 코드 확인 → 드라이버 단계 → 다른 PC 테스트 → 제조사 문의 또는 수리점.
