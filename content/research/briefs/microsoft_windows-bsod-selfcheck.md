# 조사 브리프 — 윈도우 블루스크린이 뜰 때, 오류 코드로 원인 좁히기

- 슬러그: windows-bsod-selfcheck / 코너: repair / 분야: 디지털·IT
- 조사일: 2026-11-03
- 팩트 파일: content/research/facts/microsoft_windows-bsod-selfcheck.json

## 1. 조사 범위와 힌트 대비

총괄 힌트는 "정지 코드 읽는 법, 드라이버·메모리·디스크 점검 순서, 데이터 백업, 하드웨어 AS 신호"였다. 공식 원문을 열어 보니 다음이 달랐다.

- 디스크 점검은 Microsoft 원문에서 "드라이브 속성 > 도구 > 검사"와 SFC 명령이 중심이다. 별도 디스크 진단 절차는 원문에 없다.
- 데이터 백업을 권하는 문장은 Microsoft 블루스크린 문서 두 곳(지원 문서, Learn 정지 코드 문서)에서 찾지 못했다. 공식 근거는 PC 초기화 옵션의 "모든 항목 제거는 모든 데이터를 삭제한다"는 경고뿐이다. 이 부분은 확인실패로 남겼다.
- AS 접수 기준(보증 기간, 접수 경로)은 Microsoft 문서에 없다. 하드웨어 의심 시 "제조사 진단 도구 실행"과 "제조사에 패치·펌웨어 확인"까지만 있다. 확인실패로 남겼다.
- Learn 0x154 UNEXPECTED_STORE_EXCEPTION의 STORE는 디스크가 아니라 커널 메모리 저장 구성요소다. 이름만 보고 디스크 고장으로 쓰면 안 된다.

## 2. 핵심 출처 (실제로 열어 확인함)

| 출처 | URL | 확인 내용 |
|---|---|---|
| [공식] Microsoft Support - Troubleshooting Windows unexpected restarts and stop code errors | https://support.microsoft.com/en-us/windows/troubleshooting-windows-unexpected-restarts-and-stop-code-errors-60b01860-58f2-be66-7516-5c45a66ae3c6 | 정지 코드 화면 위치, 장치 관리자 느낌표, 최근 하드웨어 제거, 여유 공간 권장("good idea"), 안전 모드 진입 |
| [공식] Microsoft Support - How to fix Error 0xA: IRQL_NOT_LESS_OR_EQUAL | https://support.microsoft.com/en-us/windows/experience/performance-optimization/how-to-fix-error-0xa-irql-not-less-or-equal | 0x0A 원인 3종, 선택적 드라이버 업데이트, mdsched 메모리 진단, Event ID 2001 |
| [공식] Microsoft Learn - Bug Checks (Stop Code Errors) | https://learn.microsoft.com/en-us/windows-hardware/drivers/debugger/bug-checks--blue-screens- | 모듈 이름 표시, 트러블슈팅 표(드라이버·디스크·메모리·SFC·BIOS·하드웨어 진단·이벤트 뷰어) |
| [공식] Microsoft Learn - Bug Check Code Reference | https://learn.microsoft.com/en-us/windows-hardware/drivers/debugger/bug-check-code-reference2 | 16진수 코드 ↔ 이름 대조표 (개발자 대상) |
| [공식] Microsoft Learn - Bug Check 0x154 | https://learn.microsoft.com/en-us/windows-hardware/drivers/debugger/bug-check-0x154--unexpected-store-exception | 커널 메모리 저장 구성요소, 2022-12 작성 |
| [공식] Microsoft Learn - Bug Check 0x3B | https://learn.microsoft.com/en-us/windows-hardware/drivers/debugger/bug-check-0x3b--system-service-exception | NULL 포인터·메모리 조기 해제·자료구조 손상, 드라이버 제거·업데이트 |

기존 저장소 재사용 (공통_windows-boot-selfcheck.json): 정지 코드 읽기, 자동 재시작 해제, 안전 모드, 드라이버 롤백, 최근 하드웨어 제거 테스트, 시동 복구, 이전 빌드 롤백(10일), PC 초기화 두 옵션.

거부: factory-reset-data-loss (삼성 스마트폰 문서, PC와 scope 불일치).

## 3. 정지 코드 읽는 법 (확인된 것)

1. 블루스크린 화면 하단의 정지 코드 이름과 16진수 값을 적는다. 모듈 이름(.sys)이 있으면 함께 적는다.
2. 자동 재시작 때문에 화면을 못 보면 기존 팩트대로 '자동으로 다시 시작' 체크를 해제한다.
3. 이름을 Microsoft Bug Check Code Reference에서 찾는다. 이름에 MEMORY가 들어가도 메모리 불량을 확정하지 않는다.

## 4. 점검 순서 (확인된 것)

1. 드라이버: 장치 관리자 느낌표 확인 → 드라이버 업데이트 → 효과 없으면 사용 안 함·제거. 선택적 업데이트에서 드라이버 일괄 설치. 제조사 사이트 확인.
2. 최근 변경: 블루스크린 직전 설치한 드라이버·프로그램·하드웨어를 되돌리거나 제거.
3. 메모리: 작업 저장 후 mdsched 실행, 재부팅 후 자동 검사, 확장 검사는 F1 → Extended → F10. 결과는 MemoryDiagnostics-Results 또는 Event ID 2001(오류 없음).
4. 시스템 파일·디스크: 드라이브 속성 도구 탭 검사, SFC /scannow. 여유 공간은 10~15% 권장.
5. 하드웨어: 제조사 진단 도구 실행, BIOS·UEFI 펌웨어 업데이트 확인.
6. 이벤트 뷰어: 블루스크린 시각 전후의 시스템 로그 치명적 오류로 장치 특정.

## 5. 주의 · 미확정

- 0x154 페이지는 2022년 작성 개발자 문서다. 메뉴 이름이 최신 화면과 다를 수 있다.
- 기존 팩트 disk-space-15-percent-boot-requirement는 "있어야 정상 작동한다"로 과장돼 있다. 원문은 "좋다"다. disputes에 신고했다.
- Driver Verifier(verifier)는 Microsoft 0x3B 문서에 있으나 개발자 대상이며 오버헤드가 있다. 일반 독자 본문에는 넣지 않는다는 판단으로 팩트에서 뺐다.
- Microsoft 블루스크린 공식 문서 대부분이 Windows 10 화면 기준이다. Windows 11 차이는 "거의 동일"로만 확인했다.

## 6. 집필 연결 제안

- 독자 흐름: 정지 코드 적기 → 장치 관리자 → 최근 변경 되돌리기 → 메모리 진단 → SFC·디스크 → 제조사 진단 → 이벤트 뷰어 → AS 문의
- AS 신호 문장은 Microsoft가 말한 범위(제조사 진단 실행, 펌웨어 확인)까지만 쓰고 보증 기준은 "제조사 공식 지원 페이지에서 확인"으로 끝낸다.
- 백업은 공식 권고 문장이 없으므로 PC 초기화 경고를 근거로 쓰고, 백업 방법 자체는 독자 절차로 제시한다.
