# 조사 전문 — 컴퓨터 소리가 안 날 때, 출력 장치부터 순서대로 확인

- article: pc-no-sound-selfcheck
- 코너: repair / 분야: 디지털·IT
- 조사일: 2026-11-03
- 산출 팩트: content/research/facts/microsoft_pc-no-sound-selfcheck.json (14건)

## 1. 기존 저장소 확인

- facts/ 전체에서 Windows 소리 출력 관련 기존 팩트는 없다(검색어: 소리·사운드·오디오·스피커·sound·audio). 공통 기준선 `공통_as-safety-baseline.json`은 읽었다.
- 기준선의 `factory-reset-data-loss`(삼성 스마트폰 초기화)는 이 글에 쓰지 않는다고 판단해 `declined_facts`에 적었다. PC 소리 점검에 초기화 단계가 없기 때문이다.
- 재사용 0건. 첫 편이라 정상이다.

## 2. 웹 조사 (검색 4회, 페이지 열람 6회)

검색은 `support.microsoft.com` 도메인으로 제한했다. 검색 요약은 참고만 하고, 팩트 근거는 실제로 연 페이지 본문에서만 잡았다.

열어 본 공식 페이지(모두 접근 확인):
1. https://support.microsoft.com/en-us/windows/hardware/audio/fix-sound-or-audio-problems-in-windows  (메인 점검 문서, 13단계)
2. https://support.microsoft.com/en-us/windows/hardware/audio/fix-audio-issues-when-no-sound-plays-from-speakers-or-headphones-in-windows  (소리가 안 날 때 전용)
3. https://support.microsoft.com/en-us/windows/hardware/audio/fix-missing-or-undetected-audio-output-device-in-windows  (출력 장치가 안 보일 때)
4. https://support.microsoft.com/en-us/windows/hardware/audio/fix-app-audio-not-working-while-system-sounds-work-in-windows  (앱만 소리 없음)

검색에만 나오고 열지 않은 페이지(사용하지 않음): Bluetooth 연결돼 있는데 소리 없음, 무선 디스플레이 어댑터. 이 두 주제는 본문을 확인하지 못해 팩트로 넣지 않았다. 필요하면 다음 조사에서 여는 것이 좋다.

## 3. 총괄 힌트와 달랐던 점

- 힌트는 "드라이버/서비스/HDMI 출력"이었다. 공식 문서에서 HDMI는 별도 단계가 아니라 "기본 출력 장치를 모니터로 잡으면 소리가 없다"는 내용으로 나온다. 그래서 HDMI는 기본 장치 팩트(`pc-sound-default-device-monitor-trap`)에 묶었다.
- 메인 문서는 Windows 11 기준 13단계이고, 우선순위는 힌트와 달랐다. 공식 문서 순서는 (1) 출력 장치와 음소거·볼륨 → (2) 기본 장치 설정 → (3) 오디오 향상 끄기 → (4) 문제 해결사 → (5) 소리 설정·장치 사용 → (6) 기본 장치 재설정 → (7) 업데이트 → (8) 재부팅 → (9) 드라이버 → (10) 서비스 재시작 → (11) 마이크 개인정보 설정 순이다. 글을 쓸 때 이 순서를 따른다.
- AS를 맡기는 기준이 공식 문서에 없었다. 이 부분은 `tier: 확인실패`로 남겼다. 글에서는 "점검 순서를 다 해보고도 안 되면 제조사 고객지원"으로 쓴다.

## 4. 주의

- Windows 10은 2025-10-14에 지원이 끝났다(공식 문서 확인). 메뉴 경로가 Windows 11과 달라서 scope를 나눴다.
- 문제 해결사는 Windows 11에서는 Get Help 앱(aka.ms/GetHelp-AudioTroubleshooter)에서 실행한다. 설정 > 시스템 > 문제 해결 > 기타 문제 해결사 > 오디오 실행 경로도 공식 문서에 있다.
- 서비스 재시작 대상은 Windows Audio, Windows Audio Endpoint Builder, 그리고 메인 문서 기준 Remote Procedure Call(RPC)이다.

## 5. 핵심 출처 요약

| 출처 | 쓴 팩트 |
|---|---|
| Fix audio issues when no sound plays | 출력 장치·음소거, 기본 장치 함정(모니터), 향상 끄기 |
| Fix sound or audio problems in Windows | 장치 사용 설정, 서비스 재시작, 드라이버 업데이트·롤백, 업데이트 우선, Windows 10 지원 종료 |
| Fix missing or undetected audio output device | 장치 관리자 숨겨진 장치, 재부팅, 제조사 드라이버, AS 기준 없음(확인실패) |
| Fix app audio not working while system sounds work | 볼륨 믹서, 앱별 출력 장치 |

## 6. 본문 집필 메모(집필 담당에게)

- 안전 경고가 필요한 항목은 없다(소프트웨어 점검 위주). 단, 장치 관리자 드라이버 삭제·시스템 복원은 되돌리기 번거로우므로 순서 뒤쪽에 둔다.
- 독자 흐름은 "출력 장치 → 음소거 → 기본 장치 → 향상 끄기 → 문제 해결사 → 재부팅 → 드라이버 → 서비스" 순으로 쓴다. 각 단계마다 "여기서 소리가 나면 멈춘다"는 문장을 넣는다.
- 제조사 AS 안내는 "여기까지 해봤는데 안 되면 제조사 고객지원"으로 쓴다. Microsoft 문서를 AS 기준의 근거로 인용하지 않는다.
