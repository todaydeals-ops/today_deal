@echo off
chcp 65001 >nul
REM 가격비교 자동 갱신 — 작업 스케줄러가 2시간마다 실행. .env.local은 스크립트가 자체 로드.
cd /d "C:\Users\user\Desktop\today_deal"
"C:\Program Files\nodejs\node.exe" scripts\price-compare.mjs run >> ".work\price-compare.log" 2>&1
