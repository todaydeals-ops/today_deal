# 코웨이 정수기 물 안 나옴·에러 표시 자가점검 — 조사 전문

- 주제: 코웨이 정수기(공기청정기 제외) 출수 불량·에러·누수·냉온수 문제, 공식 안내 기준 사용자 점검, 누수·감전 안전, 방문 관리 연결
- 슬러그: coway-water-purifier-error / 코너: repair / 분야: 가전
- 조사일: 2026-11-03
- 팩트 파일: content/research/facts/coway_coway-water-purifier-error.json

## 1. 기존 팩트 점검 (0단계)

- `content/research/facts/` 에서 Grep 한 결과 코웨이 정수기 관련 기존 파일은 `coway_purifier-selfcheck.json`(정수기 자가점검)과 `coway_bidet-selfcheck.json`(비데)이다.
- `coway_purifier-selfcheck.json` 의 팩트 9건을 원문 대조했다.
  - 출처가 404 또는 403인 것: product-repair.com 3건(404), coway-m.com FAQ 3건(403). 재사용하지 않았다.
  - 출처 원문과 수치가 다른 것: `coway-hot-water-heating-time`(5분 미지근). 원문은 저수조형 30분만 말한다. disputes 로 신고했다.
  - 출처 원문과 claim 범위가 다른 것: `coway-customer-center-1588-5200`. 원문에서 확인된 것은 번호·유료·운영시간뿐이다. 재작성했다.
- 재사용 팩트는 0건이다. 기존 팩트는 출처 소실 또는 범위 불일치로 전부 재조사 대상이 됐다.
- 공통 안전 기준선(`공통_as-safety-baseline.json`)에는 누수·감전 항목이 없다. 냉매·배터리·공장초기화·점프스타트 4건뿐이라 이번 주제에 재사용할 것이 없었다.

## 2. 공식 원문 확인 결과

### 확인됨 — 코웨이 공식 홈페이지 정수기 서비스 안내 (www.coway.com/cowayservice/water_care)
- 대표전화 1588-5200 (유료). 통신요금이 부과된다는 문구가 있다.
- 긴급상담 365일 24시간. 일반 상담은 평일 09:00~18:00, 점심 12~13시 제외.
- "자가교체 불가시 유상 필터교체 서비스 신청 1588-5200" 문구가 있다.
- 물 안 나옴·에러 코드·누수·자가점검 항목은 **없다**. A/S 접수 절차도 페이지에 없다.

### 확인 실패
- coway.com 메인 페이지(www.coway.com): 리디렉션 후 A/S 접수 절차·에러 코드 없음.
- coway.co.kr/Service/HeartService/Product: 301로 coway.com 으로 이동. 내용 없음.
- coway-m.com/faq: 2회 모두 403. 기존 팩트가 이 페이지를 근거로 했으나 재확인 불가.
- 검색(코웨이 정수기 에러코드·E01·물 안 나옴): 코웨이 정수기 에러코드 의미표를 찾지 못했다. 나온 결과는 다른 제조사(베코, 샤프, 삼성, LG) 자료였다.
- 한국소비자원 정수기 누수·감전 자료: 검색에서 찾지 못했다.
- 삼성 정수기 FAQ(samsung.com/sec/home-appliances/faq-water-purifier): 누수·감전·출수 항목이 없다. 전원 관련 문구는 전자레인지 항목이었다. 코웨이에 적용하지 않았다.
- OSHA PDF(osha.gov OSHA4283.pdf): 본문 텍스트를 추출하지 못했다. 젖은 전기기기 문구를 확인할 수 없어 사용하지 않았다.

### 후기로 확보한 자료
- theking.ggudol.com/235 (코웨이 정수기 온수 문제 해결 방법): 브랜드가 코웨이이며 원문을 직접 열었다.
  - 저수조형 정수기는 온수를 켠 뒤 약 30분 기다려 온수 여부를 확인한다. 이 문장만 원문에 있다.
  - 전원 리셋은 플러그를 뽑고 약 2~5분(본문은 5분) 대기한다. 같은 글 안에서 수치가 섞여 있어 tier를 논쟁으로 두었다.

## 3. 팩트 목록 (신규 8건)

| id | 내용 | tier | evidence |
|---|---|---|---|
| coway-service-center-1588-5200 | 대표전화 1588-5200, 유료 | 확실 | 공식 |
| coway-consultation-hours | 일반 평일 9~18시, 긴급 24시간 | 확실 | 공식 |
| coway-filter-paid-replacement-hotline | 자가교체 불가 시 유상 필터교체 신청 | 확실 | 공식 |
| coway-hot-water-warmup-30min-storage | 저수조형 온수 30분 대기 후 점검 | 확실 | 후기 |
| coway-power-reset-2to5min-conflict | 전원 리셋 2~5분 (원문 내부 불일치) | 논쟁 | 후기 |
| coway-error-code-table-not-found | 에러 코드 의미표 공식 확인 실패 | 확인실패 | 공식 |
| coway-e01-meaning-unverified | E01 누수 의미 공식 확인 실패 | 확인실패 | 공식 |
| coway-leak-electrical-no-official-guide | 누수·감전 자가 분해 공식 절차 확인 실패 | 확인실패 | 공식 |

## 4. 집필 시 권고

- 독자가 "해보고 안 되면 다음"으로 갈 수 있도록 순서를 잡는다.
  1. 증상 분류(물이 전혀 안 나옴 / 냉수·온수만 안 나옴 / 에러 표시 / 물이 샘).
  2. 누수·감전이 보이면 먼저 콘센트를 뽑고 물기를 닦는다. 분해하지 않는다.
  3. 온수는 저수조형 기준 30분 대기 후 여전히 무반응이면 다음 단계로 넘어간다.
  4. 전원 리셋은 한 번만, 5분 이상 대기 후 재연결한다(수치는 논쟁 tier임을 밝힌다).
  5. 에러 코드는 디스플레이 코드와 사용설명서 항목을 대조하게 하고, 의미는 단정하지 않는다.
  6. 막다른 곳에 두지 않는다. 착지점은 고객센터 1588-5200(유료, 긴급은 24시간)이다. 자가교체 불가 필터는 유상 교체 신청으로 안내한다.
- 에러 코드 의미표·E01 의미·방문 관리 상세 항목은 확인실패로 두었다. 글에서 단정하지 않는다.
- 전화 번호와 운영 시간은 공식 원문 기준이다. 본문에 인용할 때 "코웨이 공식 홈페이지 기준"이라고 표기한다.

## 5. 검증

- `node scripts/magazine-srcaudit.mjs --scope=coway_coway-water-purifier-error` 실행 결과
  - 배제 대상(출처 세탁): 0건
  - 허용목록 위반: 0건
  - 미확인 도메인: 8건. 6건은 coway.com(제조사 공식 도메인, 원문 직접 확인), 2건은 theking.ggudol.com(후기로 표기).
- JSON 파싱 정상.
- 빌드·DB·git은 실행하지 않았다.
