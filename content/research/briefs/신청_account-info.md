# 어카운트인포(계좌정보통합관리서비스) — 조사 전문 (웨이브 5, slug: account-info)

- 조사일: 2026-10-27
- 종류: type apply, 묶음: 숨은 돈·환급
- 팩트: `content/research/facts/신청_account-info.json` (새 팩트 8건: 확실 7 · 확인실패 1 / 공식 6 · 실측 2)
- 재사용: `dormant-accountinfo-start-2020`(어카운트인포 휴면예금 조회·지급 2020-11-10 개시), `dormant-accountinfo-role`(어카운트인포는 휴면예금 분류 기준이 아니라 조회·지급 창구 중 하나)
- 거부: `dormant-limit-1000-2020`(휴면예금 지급 한도, 서민금융진흥원 층위·연도 미상), `dormant-channels-2020`(휴면예금 찾아줌 채널, 다른 기관 서비스)

## 1. 현행 여부

- 금융결제원 통합포털 어카운트인포 소개 페이지와 계좌정보통합관리서비스 페이지(payinfo.or.kr)가 2026-10-27 열람 시 정상 표시됐다. 폐지·개편 신호는 없었다.
- 공식 서비스명은 「계좌정보통합관리서비스」이고 「어카운트인포」는 이용 브랜드명이다(payinfo 페이지 표기).

## 2. 열어 본 페이지

| URL | 결과 | 쓴 것 |
|---|---|---|
| https://openapi.kftc.or.kr/service/accountInfo | 열림 (금융결제원 통합포털) | 서비스 정의, 일반고객 이용 대상(만 19세 이상 내국인) |
| https://www.payinfo.or.kr/account.html | 열림 (http://www.accountinfo.or.kr/main/main.do 가 여기로 리디렉션) | 이용시간(계좌조회 매일 09~22시, 해지·잔고이전 영업일 09~17시), 고객센터 1577-5500, 환급금 찾기 바로가기 |
| https://www.fsc.go.kr/po010105/74600 | 열림 (금융위원회 보도자료 2020-11-09) | 2020-11-10부터 휴면예금 조회·지급 가능, 고객센터 1577-5500 평일 09~17시(2020 기준) |
| https://accountinfo.or.kr/gateAcct.html | 실패: ERR_CERT_COMMON_NAME_INVALID | 출처로 쓰지 않음. 실측 사실로만 기록 |
| https://www.accountinfo.or.kr/guide/introAcntcb.do?menu=1 | 실패: 같은 인증서 오류 | 출처로 쓰지 않음 |
| https://www.kftc.or.kr/kftc_html/footer/privacy/payinfo.html | 실패: ERR_CONNECTION_RESET | 쓰지 않음 |

## 3. 힌트 점검

- candidates.txt 근거 힌트 「금융결제원」: 맞음. 정정 없음.
- 표제 「어카운트인포 내 계좌 한번에 조회」는 맞지만, 공식 명칭이 「계좌정보통합관리서비스」다. 팩트에 명칭 관계를 따로 기록했다(`account-info-brand-vs-official-name`).

## 4. 확인 못 한 것

- 어카운트인포 안에서 지방세 환급금을 직접 조회·신청할 수 있는지: 바로가기로 「4대 사회보험료·공과금 환급금 찾기」(국세·지방세 과오납 환급 서비스로 이동)만 확인 → `account-info-local-refund-direct-unverified`(확인실패).
- 미성년자·외국인의 이용 가능 여부: 페이지에 없음. 대상 기준은 「만 19세 이상 내국인」만 확인.
- 2026 기준 고객센터 운영시간: 2020 보도자료에만 평일 09~17시로 있고, 2026 페이지에서는 확인하지 못했다.
- 휴면예금 조회 수치(지급액 등): 2020 보도자료의 연도별 수치는 이번 글 주제와 무관해 팩트화하지 않았다.

## 5. 검색 사용

- 웹 검색 1회(어카운트인포 계좌 통합 조회 + 금융결제원 한정). 결과 링크 중 openapi.kftc.or.kr과 payinfo 계열을 열어 확인했다.

## 6. 집필 시 주의

1. 출처 링크는 accountinfo.or.kr 대신 payinfo.or.kr 또는 openapi.kftc.or.kr을 쓴다. accountinfo.or.kr은 https 인증서 오류가 실측됐다.
2. 「계좌 조회」와 「환급금 찾기」는 다른 기능이다. 어카운트인포 한 곳에서 지방세 환급까지 확인된다고 쓰지 않는다.

- 출처 개수(공식 개별 문서): 3 (openapi.kftc.or.kr, payinfo.or.kr/account.html, fsc.go.kr 보도자료)
- 인덱스 경고: 확인 안 함(wave 규칙상 research-index.mjs 미실행)
