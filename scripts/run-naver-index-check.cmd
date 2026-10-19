@echo off
chcp 65001 >nul
REM 네이버 색인 재측정 — 2.0 0단계 효과 확인(docs/오늘의딜2.0-기획.md 부록). 작업 스케줄러가 1회 실행.
REM 기준선 10-17: 앞머리 30위 안 4/567 · 통째 1/80 · 사이트 색인 13건(우리 문서 10)
REM 경로를 박지 않는다 — %~dp0 는 scripts 폴더, 그 상위가 프로젝트 루트다.
cd /d "%~dp0.."
echo ===== %date% %time% >> ".work\naver-index-check.log"
"C:\Program Files\nodejs\node.exe" scripts\naver-index-check.mjs >> ".work\naver-index-check.log" 2>&1
