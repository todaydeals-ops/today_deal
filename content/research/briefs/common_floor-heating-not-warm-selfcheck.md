# 바닥 난방이 일부만 따뜻하거나 안 따뜻할 때 점검 — 조사 원본

- 슬러그: floor-heating-not-warm-selfcheck
- 코너 / 분야: repair / 가전
- 조사일: 2026-11-03
- 팩트 파일: content/research/facts/common_floor-heating-not-warm-selfcheck.json

## 1. 저장소 확인 (0단계)

- `facts/*.json` 을 Grep 으로 훑어 보일러 계열을 찾았다. 가장 관련 높은 기존 팩트:
  - common_boiler-pressure-drop-selfcheck.json (압력 강하, 2026-11-03 조사)
  - common_boiler-no-hot-water-selfcheck.json (온수 미출수, 동파 — 이번 주제와 직접 겹치지 않음)
  - kiturami_kiturami-boiler-error.json (귀뚜라미 에러코드표)
- 공통 안전 기준선(공통_as-safety-baseline.json)은 배터리·초기화·냉매·점프스타트 중심이라 이번 주제에 직접 쓸 항목은 없었다.
- 재사용: kiturami-code-heating-leak-E492, kiturami-manual-download-by-model, boiler-warranty-standard
- 거부: rinnai-recommended-pressure-range (린나이 전용 수치를 공통 글에 옮기지 않음), kyungdong-normal-pressure-not-officially-confirmed (확인실패 수치)

## 2. 웹 검색 (6회 이내, 실제 사용 5회 + 공식 페이지 WebFetch)

| 순서 | 질의 목적 | 결과 |
|---|---|---|
| 1 | 바닥난방 일부 방 분배기·공기빼기 제조사 자가점검 | 블로그·뉴스만. 제조사 공식 절차 없음 |
| 2 | 귀뚜라미 분배기 공기빼기 공식 | 공식 매뉴얼 링크 없음. 블로그 |
| 3 | 경동나비엔 분배기 고객지원 사용설명서 | 공식 문서 미발견. 블로그·유튜브 |
| 4 | 한국가스안전공사 바닥 온도 불균일 안내 | 공사 일반 겨울철 안전 안내만. 불균일 직접 안내 없음 |
| 5 | 온수온돌 분배기 설명서 pdf | 제조사 PDF 미발견 |

## 3. 공식 원문 확인 (WebFetch)

- krb.co.kr/self/26612 (귀뚜라미 거꾸로 ECO 콘덴싱 L20 자가진단매뉴얼)
  - E492: "난방배관에 누수가 발생하는 상태입니다." / "난방배관부위 누수로 분배기 또는 난방배관에서 누수는 없는지 확인하세요." / 전원코드를 뺐다가 재기동 / 지속 시 1588-9000 서비스.
  - E212: "난방분배기 밸브가 모두 잠겨있는지 확인하세요.(난방만 해당)" — 이 매뉴얼 기준. 같은 귀뚜라미 NEW P10 표에서는 E212 뜻이 다르다(기존 팩트 kiturami-code-condensate-E622-E212-논쟁 참조).
- www.kgs.or.kr/kgs/abae/view.do (한국가스안전공사 국민행동요령)
  - "이상 상태를 발견했을 때는 … 시공자 또는 제조회사에 A/S를 요청하고 반드시 수리후 사용"
  - "시공하기 전에 시공자의 자격보유 여부를 반드시 확인하고"
  - 과열·소음·진동·이상한 냄새 시 즉시 끄고 가스밸브를 잠근 뒤 전문가 점검.
  - 주의: 자동 추출 발췌다. 집필 전 원문 대조 권장.

## 4. 후기·언론 (evidence: 후기)

- 픽데일리 idxno=5408 (발행 2026-10-31): 분배기 위치, 가까운 방부터 먼 방, 반 바퀴 천천히, 물줄기 끊김 없으면 잠금, 뜨거울 때 작업 금지, 압력 확인·보충(과하게 넣지 않음), 10~20분 후 재확인.
- 픽데일리 idxno=6017 (발행 2026-11-03): 한쪽 방만 차가울 때 먼저 공기 의심, 한 방씩 밸브, 작업 전 밸브 방향 사진, 끝나면 밸브 모두 다시 열기, 그래도 차가우면 배관 막힘·펌프 → 서비스센터, 지역난방은 관리사무소.
- 위키트리 1100173 (발행 2025-12-05): 난방을 5~10분 돌려 순환 후 작업, 분배기 위치(신발장 옆·베란다·싱크대 하부), 공기가 다시 찬 경우 재작업.
- 블로그 gongquiz (경동나비엔 기름보일러 자가진단 설명): 방바닥 미온 시 배관 공기 빼기 해볼 것. 절차 원문은 확인하지 못함(확인실패 팩트로 기록).

## 5. 힌트와 달랐던 점

- 힌트는 "분배기 밸브·공기 빼기·배관 막힘·압력" 네 가지였다. 공식 근거로 확인된 것은 귀뚜라미 매뉴얼의 분배기 밸브 잠금(E212)과 배관 누수(E492), 공사의 전문가 수리 원칙까지다.
- 공기 빼기의 구체 절차는 제조사 공식 문서에서 찾지 못했다. 경동나비엔·귀뚜라미·대성 모두 공식 절차 미확인. 절차 팩트는 전부 후기(뉴스·블로그)로 표기했다.
- 압력 정상 수치는 공통으로 쓸 수 있는 공식 근거가 없어 숫자를 넣지 않았다(기기별 설명서 기준으로 안내).
- 업체 호출 기준의 공식 근거는 가스안전공사 원칙(전문가 수리·명판 시공자/제조사 A/S)까지이며, 구체 전화번호·접수 경로는 넣지 않았다.

## 6. 감사 결과

- `node scripts/magazine-srcaudit.mjs --scope=common_floor-heating-not-warm-selfcheck` 실행: 배제 대상 0건 (출처 세탁 0, 허용목록 위반 0 — 허용목록은 건강 버티컬 전용이라 기기 주제에는 적용되지 않음).
- "미확인 도메인 12건"은 사람이 판단할 항목으로 표시됐다: pickdailynews.com 7건, kgs.or.kr 2건, krb.co.kr 1건, blog.gongquiz.com 1건, wikitree.co.kr 1건. 공식 도메인(kgs.or.kr, krb.co.kr)은 실제로 열어 확인했고, 나머지는 뉴스·블로그이며 evidence를 "후기"로 표기했다.

## 7. 팩트 목록 요약

| id | tier | evidence | 성격 |
|---|---|---|---|
| kiturami-manifold-valves-all-closed-check | 확실 | 공식 | 분배기 밸브 잠금 확인 (E212, ECO L20) |
| kgs-repair-by-qualified-only | 확실 | 공식 | 전문가 수리·이상 시 가스밸브 잠금 |
| kgs-as-request-to-installer-or-maker | 확실 | 공식 | 명판 시공자·제조사에 A/S |
| kyungdong-manifold-bleed-procedure-not-confirmed | 확인실패 | 공식 | 경동 공식 절차 미확인 |
| manifold-location-common-spots | 확실 | 후기 | 분배기 위치 |
| bleed-order-near-boiler-first | 확실 | 후기 | 가까운 방부터 |
| bleed-one-loop-at-a-time-others-closed | 논쟁 | 후기 | 한 번에 한 배관 |
| bleed-hot-water-burn-cool-first | 확실 | 후기 | 뜨거울 때 작업 금지 (안전) |
| bleed-open-all-valves-after | 확실 | 후기 | 끝나면 밸브 모두 열기 |
| bleed-pressure-check-refill-gently | 확실 | 후기 | 압력 확인·과보충 금지 (수치 없음) |
| bleed-recheck-after-10to20min-and-repeat | 확실 | 후기 | 10~20분 재확인, 재공기 |
| still-cold-after-bleed-service-call | 확실 | 후기 | 서비스 호출 기준 |
| reused: kiturami-code-heating-leak-E492 | 확실 | 공식 | 배관 누수 (E492) |
| reused: kiturami-manual-download-by-model | 확실 | 공식 | 설명서 다운로드 |
| reused: boiler-warranty-standard | 확실 | 공식 | 품질보증 2년·부품보유 8년 |

## 8. 집필 시 주의

- 공기 빼기 절차는 "후기 자료에서 반복되는 방법"으로만 쓰고, 제조사 공식처럼 쓰지 않는다.
- 뜨거운 상태에서 밸브를 열지 않는다는 안전 경고는 단정형으로 유지한다.
- 압력 수치를 쓰지 않는다. 기기 설명서 표기 기준으로 안내한다.
- 막히는 지점은 "여기까지 해보고 안 되면 서비스 호출" 착지점으로 끝낸다.
