@echo off
chcp 65001 >nul
REM 매거진 비축 초안을 5코너 골고루 매일 1편 자동 공개. 작업 스케줄러가 하루 1회 실행.
cd /d "C:\Users\user\Desktop\today_deal"
"C:\Program Files\nodejs\node.exe" scripts\magazine-release.mjs --balanced 1 >> ".work\magazine-release.log" 2>&1
