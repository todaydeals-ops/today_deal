@echo off
chcp 65001 >nul
REM 매거진 비축 초안을 5코너 골고루 매일 1편 자동 공개. 작업 스케줄러가 하루 1회 실행.
cd /d "C:\Users\user\Desktop\today_deal"
"C:\Program Files\nodejs\node.exe" scripts\magazine-release.mjs --balanced 2 >> ".work\magazine-release.log" 2>&1
REM 공개/초안 중 대표 이미지 없는 글만 자동 수집(이미 있으면 스킵). Pexels 우선.
"C:\Program Files\nodejs\node.exe" scripts\magazine-images.mjs >> ".work\magazine-images.log" 2>&1
