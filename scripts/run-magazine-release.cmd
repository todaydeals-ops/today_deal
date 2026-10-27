@echo off
chcp 65001 >nul
REM ★ 발행은 Vercel 크론(/api/cron/magazine-release, 매일 07:14 KST)이 전담한다.
REM    여기서 magazine-release.mjs --balanced 를 같이 돌렸더니 크론의 요일 규칙을
REM    무시하고 매 회차 repair 를 먼저 뽑아, PC 가 켜져 있는 날마다 AS 가 과대
REM    발행됐다(30일 누적 AS 15편 vs 매거진 8편). 2026-08-31 발행 단계를 제거했다.
REM
REM    이 작업이 남아 있는 이유는 이미지 수집 때문이다. 크론은 이미지를 다루지
REM    않으므로, 대표 이미지가 없는 글을 채우는 건 여기가 유일한 경로다.
REM    (이미 이미지가 있는 글은 건너뛴다. 발행글 이미지는 고정이 원칙)
cd /d "%~dp0.."
"C:\Program Files\nodejs\node.exe" scripts\magazine-images.mjs >> ".work\magazine-images.log" 2>&1

REM    2026-10-27 코덱스 연동: 위 스톡 수집 다음에, 대표 이미지가 아직 코덱스 제작본이 아닌 글(비축 초안 포함)에
REM    코덱스(gpt-5.6-sol)로 정물사진풍 대표 이미지를 만들어 붙인다. 한 번에 12편까지, 실패하면 DB 를 건드리지 않고 다음 날 다시 시도.
REM    결과 로그 .work\magazine-ai-images.log, 눈으로 훑을 썸네일 .work\ai-images-review\
"C:\Program Files\nodejs\node.exe" scripts\magazine-ai-images.mjs --limit=12 >> ".work\magazine-ai-images.log" 2>&1
