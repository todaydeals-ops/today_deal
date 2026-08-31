@echo off
chcp 65001 >nul
REM 편성표 아카이버 — 협찬연구소 원자재 수집.
REM 편성표는 지나가면 사라진다. 파서는 나중에 고쳐 만들 수 있지만
REM 안 모은 날짜는 영영 복구가 안 되므로, 파싱 없이 매일 원문만 쌓는다.
REM 하루 두 번 도는 이유: 낮 편성이 오전에 바뀌는 경우가 있어 오전·저녁 각 1회.
cd /d "%~dp0.."
"C:\Program Files\nodejs\node.exe" scripts\epg-archive.mjs >> ".work\epg-archive.log" 2>&1
