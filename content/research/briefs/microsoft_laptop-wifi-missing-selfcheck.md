# 노트북 와이파이 아이콘이 사라지거나 목록이 안 뜰 때 — 조사 브리프

- 슬러그: laptop-wifi-missing-selfcheck / 코너: repair / 분야: 디지털·IT
- 조사일: 2026-11-03
- 팩트 파일: `content/research/facts/microsoft_laptop-wifi-missing-selfcheck.json` (15건)

## 1. 핵심 출처

- **[공식] Microsoft 지원 — Wi-Fi 연결 문제 해결(Windows)**
  https://support.microsoft.com/en-us/windows/experience/connectivity-networking/fix-wi-fi-connection-issues-in-windows
  직접 열어 본문을 확인했다. 점검 순서(물리 스위치 → Wi-Fi 설정 → 비행기 모드 → 대역 → 어댑터 활성화 → WLAN AutoConfig → 드라이버 → 전원 관리 → 네트워크 재설정)가 이 문서에 있다.
- **[후기] Microsoft Q&A 커뮤니티 답변**
  https://learn.microsoft.com/en-us/answers/questions/3832214/wireless-network-adapter-error-code-43-and-code-10
  사용자 질문 1건과 답변 1건이다. 하드웨어 고장 가능성과 제조사 수리 권고가 여기서 나왔다. 오류 코드 43·10의 정확한 의미는 이 페이지에 없었다.
- **[후기] HelpDeskGeek — Windows 11 Wi-Fi 옵션 누락 수정법**
  https://helpdeskgeek.com/wi-fi-option-not-showing-up-in-windows-11-11-fixes-to-try/
  WLAN AutoConfig 시작 유형, 빠른 설정 편집, 드라이버 롤백 등 보조 절차의 출처다. 공식 문서에는 없다.

## 2. 힌트와 달랐던 점

- 총괄 힌트는 "네트워크 초기화"를 자주 언급했지만, 공식 문서는 네트워크 재설정을 **마지막 수단**으로 명시한다. 재설정은 어댑터와 설정을 지우므로 독자 안내에서 순서를 뒤로 뒀다.
- 힌트의 "공식 원문이 우선" 기준에 따라, 공식 문서가 명시한 점검 순서를 그대로 따랐다.
- Microsoft 공식 문서에는 **AS 접수 기준이나 보증 안내가 없다.** 장치 관리자에 어댑터가 아예 없으면 드라이버를 수동 설치하라는 절차까지만 공식이다. 그 뒤 AS 판단은 커뮤니티 답변 1건(후기)이라 tier를 논쟁으로 뒀다.

## 3. 확보한 팩트 요약

| 구분 | 건수 | id |
|---|---|---|
| 공식·확실 | 12 | 물리 스위치, 비행기 모드, 대역 불일치, 고급 탭 대역 필터, 디바이스 사용, 어댑터 미감지 시 제조사 드라이버, WLAN AutoConfig, 드라이버 버전 확인, 드라이버 제거 후 재설치, 전원 관리 해제, 네트워크 재설정(Win11), 네트워크 재설정 경로(Win10) |
| 후기·논쟁 | 3 | 오류 코드 43·10, 드라이버 재설치 후 수리 권고, 내장 무선카드 분해 방법 |

- 재사용: `battery-swelling-stop-immediately` (분해 전 배터리 확인 주의, as-safety-baseline)
- 거부: 공장 초기화 데이터 삭제(스마트폰 기준이라 범위 불일치), 연결은 되는데 인터넷이 안 되는 증상용 팩트 2건, 채널 간섭 팩트 1건

## 4. 집필 시 주의

- **분해 금지.** 내장 무선카드 재장착은 커뮤니티에서 제안된 방법이지만, 자가점검 글에서는 권하지 않는다. 배터리 부풀음이 있으면 즉시 중단하고 제조사 수리로 안내한다.
- **네트워크 재설정은 마지막 단계.** 저장된 와이파이 비밀번호, VPN 클라이언트, Hyper-V 가상 스위치가 지워질 수 있음을 먼저 알린다.
- **AS 기준은 단정하지 않는다.** 장치 관리자에 어댑터가 없고 드라이버 수동 설치로도 안 되면 제조사 고객센터에서 보증 여부를 확인하도록 쓴다.
- 본문은 Windows 10과 11의 메뉴 경로가 다르므로 버전 확인 방법(설정 > 시스템 > 정보)을 먼저 안내한다.
- 대역·물리 스위치 위치는 기종마다 다르다. 제조사 매뉴얼로 확인하도록 쓴다.

## 5. 검색 사용

- 웹 검색 6회 사용. 상한 도달.
- 공식 문서 WebFetch 2회(영문 Wi-Fi 문서 성공, 한국어 재설정 문서·Ethernet 문서는 404로 실패).
- 후기 WebFetch: Microsoft Q&A 2건, HelpDeskGeek 1건 성공. HP 커뮤니티·The Windows Club은 403으로 실패해 출처에서 뺐다.
