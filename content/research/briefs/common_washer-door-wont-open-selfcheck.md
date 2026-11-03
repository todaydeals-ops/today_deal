# 조사 브리프: 세탁기 문이 안 열릴 때, 억지로 열기 전에 확인할 것

- article: washer-door-wont-open-selfcheck
- 코너 / 분야: repair / 가전
- 조사일: 2026-11-03
- 팩트 파일: content/research/facts/common_washer-door-wont-open-selfcheck.json (15건)

## 0단계 저장소 확인

- content/research/facts/ 에서 세탁기 도어 관련 기존 팩트를 Grep 으로 찾았다. 세탁기 문 잠김 팩트는 없었다.
- 삼성 dC 도어 센서 팩트(samsung-washer-dc-layer-conflict)는 에러코드 주제라 거부했다(declined_facts).
- 공통_as-safety-baseline.json 은 안전 기준선만 있고 세탁기 문 내용은 없다. 재사용 0건.

## 원리 (공식 근거 기준)

- 세탁기는 안전을 위해 드럼이 돌거나, 물이 남아 있거나, 세탁통이 뜨거우면 문을 잠근다.
- 드럼 잠금은 세탁이 끝나고 잔수가 빠지고 온도가 내려간 뒤에 풀린다.
- 삼성 KR 페이지 기준 온도 수치: 건조 후 약 65℃ 이하, 세탁 후 약 55℃ 이하에서 풀린다는 안내(모델별 상이 가능).

## 원인별 점검 순서 (공식 근거)

1. 온도 확인: 문이 뜨거우면 식을 때까지 기다린다. LG는 2~3분 안내.
2. 잔수 확인: 잔수가 남아 있으면 배수한다. 삼성은 잔수 제거 호스 마개를 열어 물을 빼는 절차, LG는 전면 하단 커버의 잔수 호스 마개를 여는 절차.
3. 배수 막힘: 배수필터 청소(삼성은 주 1회 이상 안내).
4. 어린이 보호·스마트싱스 원격제어 유지 확인(삼성).
5. 정전·전원 차단 후 잠금 유지(LG 시그니처): 전원을 다시 연결하고 잠금이 풀릴 때까지 기다린다.
6. LG 손잡이 요령: 플러그를 뽑고 1~2분 뒤 손잡이를 안쪽으로 밀었다가 당긴다.
7. 세탁 도중이면 일시정지로 잠금을 풀 수 있다(삼성 전자동, 헹굼 중 급수 중에는 불가).

## 억지로 열면 안 되는 경우

- 드럼이 돌거나 뜨거울 때: 뜨거운 물·증기 화상, 드럼 회전 중 부상 위험(LG·삼성 공식 경고).
- 강제로 당기면 손잡이·잠금 부품이 깨질 수 있다(삼성 41564, LG 20155379398036).
- 잔수가 있는 상태에서 힘으로 열면 물이 쏟아질 수 있다.

## AS 기준 (공식 근거)

- 삼성: 사용·설치 문제(비결함)는 보증 기간 안이어도 출장비. 출장서비스 예약 또는 1588-3366 (samsungsvc 40239).
- LG: 보증 기간 경과 시 점검 비용 청구 가능. 정상 종료 후에도 열리지 않으면 내부 잠금장치 고장 가능성, 출장 서비스 또는 상담 예약 (LG 20155379398036).
- 정상 종료 후에도 문이 안 열리면 도어 연결 부품 점검 필요(삼성 41564, 게시일 2020-12-10이라 최신 모델 적용은 제한적).

## 출처 목록 (실제로 연 페이지)

| 출처 | URL | 확인 결과 |
|---|---|---|
| 삼성전자서비스 세탁기 문 안 열림 | https://www.samsungsvc.co.kr/solution/40239 | 열람 완료. 2026-11-03 게시 |
| 삼성전자서비스 정상 동작 후 도어 안 열림 | https://www.samsungsvc.co.kr/solution/41564 | 열람 완료. 2020-12-10 게시 |
| 삼성전자서비스 전자동 동작 중 도어 안 열림 | https://www.samsungsvc.co.kr/solution/41560 | 열람 완료 |
| LG전자 스스로해결 드럼세탁기 도어 안 열림 | https://www.lge.co.kr/support/solutions-20155379398036 | 열람 완료 |
| LG전자 스스로해결 시그니처 도어 안 열림 | https://www.lge.co.kr/support/solutions-20150512772492 | 열람 완료 |
| LG US Why won't my LG front-load washer door open? | https://www.lg.com/us/support/help-library/why-wont-my-lg-frontload-washer-door-open--20155379379322 | 열람 완료 |
| Samsung US washing machine will not start or fill with water | https://www.samsung.com/us/support/troubleshoot/TSG10007105/ | 열람 완료 |

## 막힌 점과 힌트와 달랐던 점

- 힌트 "삼성 공식 안내 기준 비상 개방"은 국내 삼성 공식 페이지에서 비상 해제 케이블·레버 절차를 찾지 못했다. 대신 잔수 제거 호스 배수가 공식 경로였다. 비상 해제 장치는 확인실패로 남기고(samsung-emergency-release-cable-unverified), 블로그에 있는 강제 개방 방법은 쓰지 않는다.
- 기존 공통 팩트 factory-reset-data-loss 의 source_url(samsung.com/us ANS10002030)은 갤럭시 폰 초기화 페이지로 확인됐다. 이 주제와는 무관하고 수정은 하지 않았다.
- 검색 결과 중 블로그·커뮤니티 자료는 출처로 쓰지 않았다. 공식 페이지에서 확인된 내용만 팩트로 남겼다.
- 웹 검색은 4회 사용했다(한도 6회 이내).
- 삼성 KR 게시일이 2020년인 페이지(41564, 41560)는 연식 한계를 scope와 caution에 명시했다.
