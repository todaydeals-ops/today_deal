# 오늘의딜 외부 크롤러

타임딜 **URL만** 모아 오늘의딜 서버(`/api/deals/ingest`)로 보내는 독립 스크립트입니다.
앱(Next.js)과 분리돼 있어 **여기서 따로 실행**합니다 (PC, 사내 서버, 별도 호스트 등).
제목·이미지·가격(OG)·제휴링크 변환·DB 저장은 **서버가 자동으로** 처리합니다.

## 준비
- Node.js **18 이상** (내장 `fetch` 사용 — 별도 설치 패키지 없음)
- 서버에 `CRON_SECRET` 설정돼 있어야 함 (Vercel 환경변수)

## 설정
```bash
cp crawler/.env.example crawler/.env
# crawler/.env 열어서 INGEST_SECRET= 에 서버 CRON_SECRET 값 입력
```

## 실행 (2가지 모드)

### 1) 정적 모드 — `collect.mjs` (설치 불필요)
```bash
node crawler/collect.mjs
```
- **`crawler/urls.txt`** 의 URL을 읽어 전송. **가장 안정적.** (외부에서 모은 딜 링크 붙여넣기)
- `collect.mjs`의 `LISTING` 배열로 정적 HTML 스크래핑도 가능(JS 렌더 페이지엔 무력).

### 2) 헤드리스 모드 — `collect-headless.mjs` (Playwright, 진짜 자동수집)
```bash
cd crawler
npm install
npx playwright install chromium   # 최초 1회 (브라우저 다운로드)
npm run collect:headless          # = node collect-headless.mjs
```
- 실제 크롬으로 딜 목록 페이지를 **렌더한 뒤** 상품 링크 추출 → ingest 전송.
- `collect-headless.mjs`의 `LISTINGS` 에 **지마켓 슈퍼딜**이 시드돼 있고, 11번가·알리는
  주석 푼 뒤 실제 딜 섹션 URL·링크 패턴만 채우면 동일하게 동작합니다.
- 사이트 구조가 바뀌면 `linkRe`(상품 링크 정규식)만 갱신하면 됩니다.

## 한계 & 업그레이드
- 지마켓/11번가/알리 **딜 목록 페이지는 대부분 JS 렌더**라, 정적 `fetch`로는 상품 링크가
  안 잡힐 수 있습니다. 그 경우:
  - **단기:** `urls.txt`에 수동으로(또는 다른 소스에서 모아) URL을 넣어 운영
  - **자동화:** `LISTING` 스크래핑을 **Playwright** 등 헤드리스 브라우저로 교체
    (페이지를 실제 렌더한 뒤 상품 링크 추출). 이 폴더에서 `npm i playwright` 후 별도 구현.
- 서버 ingest는 **상품명+가격이 자동 수집된 것만** 게시하고, 못 긁은 URL은 `skipped`로 알려줍니다.
  그런 항목은 `/admin/timedeal`에서 사람이 가격만 보정해 등록하세요.

## 자동 주기 실행 (선택)
- 리눅스/맥: `crontab`에 `node /경로/crawler/collect.mjs` 등록
- 윈도우: 작업 스케줄러
- 또는 GitHub Actions 스케줄 등
