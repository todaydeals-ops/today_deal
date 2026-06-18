@echo off
REM 오늘의딜 크롤러 실행 (Windows 작업 스케줄러용)
REM 이 파일 위치(crawler 폴더)로 이동 후 헤드리스 크롤러 실행. 로그는 crawl.log.
cd /d "%~dp0"
"C:\Program Files\nodejs\node.exe" collect-headless.mjs >> crawl.log 2>&1
