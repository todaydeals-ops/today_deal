@echo off
chcp 65001 >nul
REM 가격비교 자동 갱신 — 작업 스케줄러가 2시간마다 실행. .env.local은 스크립트가 자체 로드.
REM 경로를 박지 않는다 — %~dp0 는 scripts 폴더, 그 상위가 프로젝트 루트다.
cd /d "%~dp0.."
"C:\Program Files\nodejs\node.exe" scripts\price-compare.mjs run >> ".work\price-compare.log" 2>&1
