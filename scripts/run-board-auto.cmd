@echo off
REM 경로를 박지 않는다 — %~dp0 는 이 파일이 있는 scripts 폴더, 그 상위가 프로젝트 루트다.
cd /d "%~dp0.."
"C:\Program Files\nodejs\node.exe" scripts/board-auto.mjs >> scripts/board-auto.log 2>&1
