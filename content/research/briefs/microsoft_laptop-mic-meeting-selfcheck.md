# 화상회의 마이크 점검 — 조사 전문 (2026-11-03)

article: laptop-mic-meeting-selfcheck / 코너: repair / 분야: 디지털·IT

## 조사 방법
- 0단계: facts/*.json 중 마이크 관련 파일 확인. 재사용 1건(usb-mic-test-input-verification), 거부 3건, 신고 2건.
- 웹 검색 3회 + 원문 조회(WebFetch) 5회. 검색 결과 요약만 보고 쓰지 않고 주요 공식 페이지를 직접 열어 절차를 대조했다.

## 핵심 출처 (열어 본 것만)
1. [공식] Microsoft 지원 — Fix microphone problems (Windows 11 절차 포함)
   https://support.microsoft.com/en-us/windows/fix-microphone-problems-5f230348-106d-bfa4-1db5-336f35576011
   - 설정 > 개인 정보 보호 및 보안 > 마이크: 마이크 액세스, 앱 액세스, 데스크톱 앱 액세스 토글
   - 설정 > 시스템 > 소리 > 입력: 장치 선택, 시작 테스트 → 녹음된 샘플 재생, 입력 볼륨
   - 장치 관리자: 오디오 장치 제거(드라이버 삭제 체크) → 재시작 → 하드웨어 변경 사항 검색
   - Levels·Microphone Boost·Enhancements는 Windows 11 섹션에서 확인되지 않음(Levels·부스트는 Windows 10 섹션)
2. [공식] Microsoft 지원 — My microphone isn't working in Microsoft Teams
   https://support.microsoft.com/en-us/office/my-microphone-isn-t-working-in-microsoft-teams-666d1123-9dd0-4a31-ad2e-a758b204f33a
   - 음소거 확인 → 개인정보 권한 → Teams 장치 설정(마이크 드롭다운) → 테스트 통화(영어 전용, 웹 미지원) → 회의 중 장치 재선택 → 소리 설정 녹음 탭 Enable → 재시작
   - 웹 버전은 브라우저 사이트 권한(Chrome·Edge·Safari) 확인
3. [공식] Zoom 고객지원 — Troubleshooting speaker or microphone issues in the desktop app
   https://support.zoom.com/hc/en/article?id=zm_kb&sysparm_article=KB0060836
   - 프로필 사진 > 설정 > 오디오 > 마이크 드롭다운·테스트, 입력 볼륨
   - Windows 권한 경로: 개인정보 > 앱 권한 > 마이크, 데스크톱 앱 허용 토글
   - 고급 설정의 'Signal processing by Windows audio device drivers' 끄기 옵션은 Zoom 문서에 있으나 기본값은 문서에 명시 안 됨 → 팩트에서 제외(확인실패 취급)
   - 'Automatically adjust microphone volume'은 이 문서에 없어 팩트에서 제외

## 힌트와 달랐던 점
- 힌트의 "Levels/부스트"는 Windows 11 절차가 아니었다. Windows 11은 '입력 볼륨' 슬라이더 경로다.
- 기존 usb-mic 팩트 중 Enhancements 항목은 인용 문서에서 확인되지 않아 신고(disputes)했다.
- Zoom 문서 경로는 Windows 10식 '개인정보 > 앱 권한'이다. Windows 11 명칭과 대응시켜 caution에 적었다.

## 확인 못 한 것 (지어내지 않음)
- 마이크 하드웨어 고장 판정 기준·보증 접수 경로: 이번 조사에서 공식 문서로 확인하지 못해 팩트에 넣지 않았다. 글에서는 "여기까지 해보고 안 되면 제조사 서비스센터"로 착지만 한다.
- Zoom 자동 음량 조정 옵션: Zoom Workplace 설정 문서 검색 결과에만 있고 원문을 열지 않아 제외.
- Zoom 관련 출처 도메인(zoom.com)은 magazine-srcaudit 허용목록에 없음(사안은 result 참조).
