# 오늘의딜 — SEO/GEO 전담 에이전시

> **한 줄 정의.** 오늘의딜이 만들어 내보내는 **모든 산출물**(페이지·딜·매거진 글·이미지·카피)이
> 검색엔진에 잘 색인되고(**SEO**) 생성형 AI가 근거로 인용하게(**GEO**) 만드는 **상설 노출 레이어**.
> 핵심 철학: **"좋은 디자인·좋은 콘텐츠도 '발견'돼야 가치가 된다."** 매 작업이 조금 귀찮더라도 빠짐없이 챙긴다.

이 문서는 자기완결형이다. 다른 작업자(사람/AI)에게 이 파일만 줘도 동일하게 동작해야 한다.

---

## 1. 미션
오늘의딜의 두 축을 **검색·인용 가능**하게 만든다.
- **딜 사이트**(`/`, `/deals`, `/deal/[slug]`, `/board`, `/recommended`): 실시간 타임딜·핫딜·추천딜.
- **매거진**(`/magazine`, `/magazine/[slug]`): 광고·제휴 없는 중립 쇼핑 가이드.

콘텐츠 자체가 자산이 아니라, **검색·인용 가능성(discoverability)** 이 자산이다.

## 2. 용어
- **SEO** — 구글·네이버 색인/랭킹.
- **AEO** — 답변엔진 최적화(피처드 스니펫·음성답변).
- **GEO** — Generative Engine Optimization. ChatGPT·Claude·Perplexity·Gemini 등 **생성형 AI가 우리를 근거로 인용**하게.

## 3. 발동 시점 — "매 배포마다"
페이지·콘텐츠·이미지가 바뀌어 사용자에게 나가는 모든 순간 가동한다.
**배포 전 체크리스트 통과 = Definition of Done.** 통과 못 하면 누락을 로그로 남긴다.

## 4. 점검 영역 + 체크리스트

### A. 온페이지 SEO (모든 페이지)
- `title` / `meta description` / `canonical`(절대 URL)
- OpenGraph · 전용 OG 이미지(라우트별) · alt
- 시맨틱 헤딩(h1 단일) · 내부링크 · 빵부스러기

### B. 구조화 데이터 (JSON-LD) — 페이지 유형별
- 홈/목록: **ItemList** (+ 딜은 Product/Offer)
- 매거진 메인: **ItemList**(글 목록)
- 매거진 상세: **Article** + **BreadcrumbList** (+ datePublished·dateModified·isAccessibleForFree)
- 공통: layout의 **WebSite·Organization**
- 원칙: **사실과 일치, 날조 금지**, dateModified 정확히.

### C. GEO / AI 인용 최적화 (특히 매거진)
- **인용 가능한 한 문장/3줄 요약** — 각 글에 "결론·기준"을 사실로(매거진 상세의 *3줄 요약* 레일이 이 역할).
- **명확한 수치·출처** — AI가 그대로 받아쓸 수 있게(레인지·"추정" 표기 유지).
- **정직성 신호** — "광고 0·제휴 0", 편집국 바이라인, dateModified.
- **llms.txt** — 사이트 루트에 AI용 안내(`public/llms.txt`, 매거진 포함).
- 크롤 가능: JS 의존 콘텐츠는 SSR(현재 `force-dynamic`로 서버 렌더).

### D. 이미지 (해당 시)
- AI 합성 이미지 금지(매거진은 데이터 컴포넌트·타이포 커버). 실제 제품 이미지는 방식별 중립 예시 + alt + 출처.
- width/height·`loading="lazy"`·webp, 의미 있는 파일명/alt.

### E. 테크니컬 SEO
- `app/sitemap.ts` 최신(신규 slug 자동 포함) · `app/robots.ts`(/, /admin·/api 차단, sitemap 명시)
- 코어웹바이탈(속도/CLS) · 깨진 링크 0 · 정규화(중복 URL 정리)
- (선택) **IndexNow** — 신규/변경 URL 즉시 통보.

### F. 모니터링
배포마다 노출/색인 변화 점검, 누락·하락 로그. (GSC·sitemap·IndexNow 기준)

## 5. 산출물 (Definition of Done)
- [ ] 바뀐 페이지/이미지가 위 A~E 충족.
- [ ] 신규/변경 URL이 sitemap(+ IndexNow) 반영.
- [ ] 누락 항목은 로그로 남김(다음 사이클 처리).

## 6. 원칙 — 화이트햇·정직
- **과장·거짓 금지.** 데이터·정직성을 유지(흐린 단언이 색인·신뢰를 깎는다).
- **블랙햇 금지** — 클로킹·키워드 스터핑·도배·숨김텍스트·가짜 구조화데이터 금지.
- **귀찮아도 챙긴다.** "이미지 alt 하나쯤"이 모여 색인 누수가 된다.

## 7. 범위 밖 (out of scope)
콘텐츠 품질(편집국 필체·자료조사)·디자인 결정은 건드리지 않는다. SEO/GEO는 그 위에 얹는 **노출 레이어**다.

## 8. 보고 형식
배포 후 한 줄: `SEO/GEO ✓ — 페이지 N·이미지 M 점검 / sitemap·IndexNow 갱신 / 누락 K건(로그)`.

---
*관련: [docs/editorial-voice.md](editorial-voice.md)(콘텐츠) · [docs/magazine-concept.md](magazine-concept.md) · `public/llms.txt` · `app/sitemap.ts` · `app/robots.ts`*
