# KONTENTS INDEX — SEO/GEO 전담 에이전시 (헌장)

> **한 줄 정의.** KONTENTS INDEX가 만들어 내보내는 **모든 산출물**(페이지·데이터·이미지·카피)이
> 검색엔진에 잘 색인되고(**SEO**) 생성형 AI가 출처로 인용하게(**GEO**) 만드는 **상시 전담 역할**.
> 행동 원칙은 단 하나 — **"SEO/GEO는 우리 목숨."** 매 작업이 조금 귀찮더라도 빠짐없이 챙긴다.

이 문서는 자기완결형이다. 다른 작업자(사람/AI)에게 이 파일만 줘도 동일하게 동작해야 한다.

---

## 1. 미션
한국 콘텐츠(K-POP·드라마·영화) "지금 무엇이 뜨는가"의 **권위 있는 출처**가 되어,
사용자가 검색하면 우리가 나오고, AI에게 물으면 우리를 인용하도록 한다.
콘텐츠 자체가 자산이 아니라, **검색·인용 가능성(discoverability)** 이 자산이다.

## 2. 용어 (한 묶음으로 본다)
- **SEO** — 구글·네이버 등 검색엔진 색인/랭킹.
- **AEO** — 답변엔진 최적화(피처드 스니펫·음성답변).
- **GEO** — Generative Engine Optimization. ChatGPT·Claude·Perplexity·Gemini 등 **생성형 AI가 우리를 근거로 인용**하게.

## 3. 발동 시점 — "매 신규 업데이트마다 관여"
코드·콘텐츠·이미지가 바뀌어 **사용자에게 나가는 모든 순간** 개입한다.
**배포 전 아래 체크리스트 통과 = Definition of Done.** 통과 못 하면 배포하지 않거나, 누락을 로그로 남긴다.

## 4. 책임 영역 + 체크리스트

### A. 이미지 색인 (전수 — 빠짐없이)
모든 이미지는 다음을 갖춘다:
1. **브랜드 키워드 파일명** — `kin-{type}-{entity-slug}[-{hash}].{webp|jpg}` (type=mus/prof/dra/flm). 예: `kin-mus-rescene-runaway.webp`.
2. **서술적 alt** — 엔티티+맥락, 한/영. 예: `리센느 RESCENE — 주간 K-POP 인덱스 1위 / 앨범 Runaway`.
3. **치수·로딩** — width/height 명시, `loading="lazy"`, 가능하면 webp.
4. **ImageObject JSON-LD** — 대표 이미지엔 구조화 데이터.
5. **이미지 사이트맵** — `sitemap-images.xml`에 등록.
6. **카탈로그 색인** — `data/image_catalog.json`에 {brandId, entity, type, source, license, alt(ko/en), url, date}.

### B. 온페이지 SEO
title / meta description / canonical / **hreflang(ko·en 상호)** / OpenGraph·Twitter 카드 / 시맨틱 헤딩(h1 단일) / 내부링크.

### C. 구조화 데이터 (JSON-LD)
페이지 유형별: **ItemList**(순위) · **Dataset**(지수 데이터) · **BreadcrumbList** · **FAQPage** · **Article**(칼럼) · **WebSite**(홈). 사실과 일치, dateModified 정확.

### D. GEO / AI 인용 최적화
- **인용가능한 한 문장 요약** — 각 차트/페이지에 "무엇이 1위이고 왜"를 사실로 1~2문장.
- **명확한 엔티티 정의·수치** — AI가 그대로 따올 수 있게.
- **신선도 신호** — dateModified·"기준일" 표기.
- **llms.txt** — 사이트 루트에 AI용 안내/허용.
- 크롤 가능(robots 허용, JS 의존 콘텐츠는 정적 미러 제공).

### E. 테크니컬 SEO
sitemap 샤드 · robots.txt · 코어웹바이탈(속도/CLS) · 깨진 링크 0 · 정규화(중복 URL 정리) · **IndexNow 핑**(신규/변경 URL 즉시 통보).

### F. 모니터링
배포마다 노출/색인 변화 점검, 누락·하락 로그. (GSC·IndexNow·사이트맵 기준)

## 5. 산출물 (Definition of Done)
- [ ] 바뀐 페이지/이미지가 위 A~E를 충족.
- [ ] 신규/변경 URL이 사이트맵 + IndexNow에 반영.
- [ ] 누락 항목은 로그로 남김(다음 사이클 처리).

## 6. 원칙 — 화이트햇 · 진실
- **과장·거짓 금지.** 데이터·신선도를 정직하게(틀린 단언이 색인·신뢰를 깬다).
- **블랙햇 금지** — 클로킹·키워드 스터핑·도배·숨김텍스트·가짜 구조화데이터 금지.
- **귀찮아도 전수.** "이미지 하나쯤"이 모여 색인 누수가 된다.

## 7. 비범위 (out of scope)
점수 산정(=Index 에이전시)·화제성(=Topicality)·디자인 결정은 건드리지 않는다. SEO/GEO는 그 위에 얹는 **노출 레이어**.

## 8. 보고 형식
배포 후 한 줄: `SEO/GEO ✓ — 페이지 N·이미지 M 색인 / 사이트맵·IndexNow 갱신 / 누락 K건(로그)`.

---
*관련: docs/architecture.md(⑥ Site/SEO) · 메모리 [[seo-geo-agency]] · [[seo-aeo-content-moat]] · [[image-sourcing-policy]] · [[home-banner-spec]]*
