# 조사 전문: 윈도우 컴퓨터가 갑자기 느려졌을 때 점검 순서

- 슬러그: windows-slow-selfcheck / 코너: repair / 분야: 디지털·IT
- 조사일: 2026-11-03
- 팩트 파일: content/research/facts/microsoft_windows-slow-selfcheck.json (신규 14건, 재사용 3건)

## 1. 조사 범위와 힌트의 차이

총괄 힌트는 "작업 관리자·시작 프로그램·저장공간·업데이트·바이러스 검사, 데이터 백업 먼저"였다.
Microsoft 공식 원문 기준으로 확인한 차이는 다음과 같다.

- 공식 "Tips to improve PC performance in Windows" 페이지에는 **백업을 먼저 하라는 문장이 없다.** 이 페이지는 저장공간·앱 제거·시작 프로그램·업데이트·Defender 빠른 검사·재시작 순서로 안내한다.
- "백업 먼저"는 Microsoft 업데이트 문제 해결 문서(기존 팩트 win-update-backup-before-steps, 재사용)에서 확인되는 원칙이다. 이 문서를 근거로 "문제 해결 조치 전에 개인 파일을 먼저 백업"을 점검 맨 앞에 두었다.
- Microsoft 원문에 "느려짐 = 악성코드"라는 단정은 없다. 원문은 "악성코드는 CPU와 디스크 자원을 쓸 수 있어 성능을 떨어뜨릴 수 있다"고만 한다.
- 제3자 가이드에 나오는 "여유 공간 20% 유지"는 공식에서 확인하지 못해 쓰지 않았다(확인실패로 기록).
- Microsoft 페이지는 Windows 10 지원이 2025년 10월 14일에 끝났다고 명시한다. 점검 전에 OS 지원 상태를 확인하도록 팩트에 넣었다.

## 2. 권장 점검 순서 (집필 뼈대)

1. **데이터 백업 먼저** — OneDrive(Windows 백업)로 바탕 화면·문서·사진·비디오·음악 폴더를 동기화. 무료 계정 5GB, 회사·학교 계정은 불가 (팩트 slow-pc-backup-windows-backup-onedrive, 공식)
2. **OS 지원 상태 확인** — Windows 10이면 2025-10-14 지원 종료 (slow-pc-windows10-support-ended, 공식)
3. **작업 관리자 열기** — Ctrl + Shift + Esc (slow-pc-task-manager-open-startup-disable, 공식)
4. **시작 프로그램 정리** — 필요 없는 앱 우클릭 > 사용 안 함 (같은 팩트, 공식)
5. **성능·시작 프로그램 탭 확인, 프로세스 탭에서 안 쓰는 앱 종료** (slow-pc-review-performance-and-startup-tabs, 공식)
6. **저장공간 정리** — 설정 > 시스템 > 저장공간 > 저장공간 센스 켜기, "지금 정리" / 임시 파일 / 디스크 정리 (slow-pc-storage-sense-run-path, slow-pc-temp-files-and-disk-cleanup-path, 공식)
   - 휴지통·다운로드 자동 삭제는 기본 설정과 되돌릴 수 없음을 함께 안내 (slow-pc-storage-sense-recycle-downloads-default)
   - 용량 기준은 %가 아니라 저장공간 막대 색으로 판단 (slow-pc-low-space-no-percent-threshold, 확인실패)
   - 여유 공간 10~15%는 권장 기준으로만 (재사용 win-update-drive-free-space-10-15-percent)
7. **안 쓰는 앱 제거** — 설정 > 앱 > 설치된 앱 (slow-pc-uninstall-unused-apps-path, 공식)
8. **업데이트 확인** — Windows Update 설치, 선택적 드라이버 업데이트 (slow-pc-windows-update-optional-drivers, 공식). 문제가 생기면 문제 해결사 경로 (재사용 win-update-troubleshooter-path)
9. **악성코드 검사** — Windows 보안 > 바이러스 및 위협 방지 > 빠른 검사 (slow-pc-defender-quick-scan-path, 공식). 의심이 남으면 오프라인 검사 (slow-pc-defender-offline-scan-restart-warning, 공식: 재시작되므로 파일 저장 먼저)
10. **재시작** — 개선이 없으면 재시작, 열린 앱·탭을 줄인다 (slow-pc-restart-if-no-improvement, 공식)
11. **그래도 안 되면** — Microsoft는 노후 하드웨어는 이 단계로 큰 개선이 없을 수 있고 장기적으로는 업그레이드가 최선일 수 있다고 안내 (slow-pc-hardware-age-upgrade-criterion, 공식). 연식 숫자 기준은 공식에 없음.

## 3. 안전 경고

- 앱 제거·임시 파일·휴지통 정리는 데이터가 같이 지워질 수 있다. 정리 전 백업을 먼저 권한다.
- 오프라인 검사는 재시작을 동반한다. 작업 중 파일을 저장하고 실행한다.
- "사용 안 함"은 자동 실행만 끈다. 보안·드라이버처럼 이름을 모르는 항목은 끄기 전에 확인한다(조사자 운영 판단, 공식 인용 아님).

## 4. 재사용·거부 내역

- 재사용: win-update-troubleshooter-path, win-update-backup-before-steps, win-update-drive-free-space-10-15-percent
- 거부: win-update-disk-space-upgrade-16-20gb (업그레이드 기준 수치라 느려짐 점검 scope와 맞지 않음)

## 5. 실패·보류 내역

- 커뮤니티 근거였던 "시작 프로그램에서 끈 앱은 삭제되지 않는다" 항목은 출처 도메인(elevenforum.com)이 허용목록 밖이라 팩트에서 제외했다. 내용은 Microsoft 공식 원문에 없고 제3자 가이드에서만 확인되었다.
- Microsoft 공식 페이지 3건(Defender 최신 페이지 일부, Windows 백업 상세 페이지 일부)은 주소를 추측해 열었을 때 404가 떠 사용하지 않았다. 실제로 열린 페이지만 출처로 썼다.

## 6. 출처 목록 (실제 열어 확인)

- https://support.microsoft.com/en-us/windows/experience/performance-optimization/tips-to-improve-pc-performance-in-windows (공식, 본문 확인)
- https://support.microsoft.com/en-us/windows/manage-drive-space-with-storage-sense-654f6ada-7bfc-45e5-966b-e24aded96ad5 (공식, 본문 확인)
- https://support.microsoft.com/en-us/windows/security/threat-malware-protection/virus-and-threat-protection-in-the-windows-security-app (공식, 본문 확인)
- https://support.microsoft.com/en-us/windows/experience/backup-recovery/back-up-and-restore-with-windows-backup (공식, 본문 확인)
- https://support.microsoft.com/en-US/Windows/Experience/Performance-Optimization/troubleshooting-windows-unexpected-restarts-and-stop-code-errors (재사용 팩트 원 출처)
- https://support.microsoft.com/en-us/windows/deployment/updates-lifecycle/troubleshoot-problems-updating-windows (재사용 팩트 원 출처)

## 7. 감사 결과

`node scripts/magazine-srcaudit.mjs --scope=microsoft_windows-slow-selfcheck`: 배제 대상 0건, 미확인 도메인 0건.
