# 조사 브리프: 윈도우 업데이트 실패·무한 대기 해결 순서

- 슬러그: windows-update-failure-selfcheck
- 코너: repair / 분야: 디지털·IT
- 조사일: 2026-11-03
- 팩트 파일: content/research/facts/microsoft_windows-update-failure-selfcheck.json

## 1. 열어서 확인한 공식 문서 (모두 2026-11-03 열람, 살아 있음)

1. Microsoft Support - Troubleshoot problems updating Windows
   https://support.microsoft.com/en-us/windows/deployment/updates-lifecycle/troubleshoot-problems-updating-windows
   - 개인 파일 백업 안내(Important 상자), OneDrive 백업 언급
   - 문제 해결사 메뉴 경로(Windows 11·10)
   - 업데이트 캐시 초기화 GUI 단계, 명령 프롬프트 폴더 이름 변경 명령
   - Windows 11·10 오류 코드 해석표
   - 디스크 여유 공간 수치(16GB·20GB)는 "upgrade OS" 기준 문구

2. Microsoft Support - Recovery options in Windows
   https://support.microsoft.com/en-US/Windows/Experience/Backup-Recovery/recovery-options-in-windows
   - 버전 업그레이드 되돌리기: "available for 10 days after upgrading"
   - WinRE 경로: Troubleshoot > Advanced options > Uninstall updates
   - "Some updates can't be uninstalled"

3. Microsoft Support - Troubleshooting Windows unexpected restarts and stop code errors
   https://support.microsoft.com/en-US/Windows/Experience/Performance-Optimization/troubleshooting-windows-unexpected-restarts-and-stop-code-errors
   - "it's a good idea to have 10% to 15% of free space available" (the hard drive)
   - 하드웨어 추가 후 "shut down your PC, remove the hardware, and try restarting"

## 2. 검색만 하고 열지 않은 것 (참고용, 팩트로 쓰지 않음)

- Microsoft Q&A(learn.microsoft.com/answers) 다수: 커뮤니티 답변이라 공식 근거로 쓰지 않았다. "51~99%에서 멈춤" 같은 단계는 공식 확인이 안 돼 제외했다.
- 0x80070070 해설(learn.microsoft.com/troubleshoot/windows-server/...)은 Windows Server 대상이라 소비자 Windows 글에 쓰지 않았다.

## 3. 힌트와 달랐던 점

- 조사 범위 힌트에 있던 "디스크 공간"은 공식 문서에 16GB·20GB 수치가 있으나 **버전 업그레이드 기준**이다. 일반 누적 업데이트 기준이 아니다. 팩트에 범위를 명시했다.
- "10일 이내 이전 빌드 복원"은 **버전 업그레이드 후** 기준이다. 일반 누적 업데이트 제거는 WinRE의 "업데이트 제거" 메뉴로 따로 다룬다.
- 기존 공통_windows-boot-selfcheck.json의 "디스크 10~15% 필수" 문구는 공식 원문("좋다")과 달라 disputes로 신고했다. 새 팩트 win-update-drive-free-space-10-15-percent로 바로잡았다.
- 같은 파일의 boot-device-not-found-bios-check는 출처 라벨과 URL이 맞지 않아 신고했다.

## 4. 재사용·거부 요약

- 재사용 3건: 공통_windows-boot-selfcheck.json의 windows-update-boot-failure-rollback, recent-hardware-addition-removal-test / 공통_as-safety-baseline.json의 factory-reset-data-loss
- 거부 3건: disk-space-15-percent-boot-requirement(원문과 불일치), boot-device-not-found-bios-check(출처 불일치), boot-sequence-uefi-vs-bios-distinction(근거 URL 확인 실패)
- 신규 9건 (확실 9 / 공식 9)

## 5. 확인하지 못한 것 (글에서 지어내지 말 것)

- AS(서비스센터) 접수 기준·보증 조건: 이번 조사에서 공식 출처를 확인하지 못했다. 글에서는 "여기까지 해보고 안 되면 전문가"로 마무리하고, 접수 기준은 쓰지 않는다.
- 업데이트 진행률이 멈춘 구간별 대처: 공식 문서에서 확인하지 못했다.
- Windows 10 지원 종료 이후의 업데이트 경로: 조사 범위 밖이며 확인하지 않았다.
