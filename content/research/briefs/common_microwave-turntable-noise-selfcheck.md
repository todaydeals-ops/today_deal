# 조사 브리프: 전자레인지에서 큰 소음이 나거나 접시(턴테이블)가 안 돌 때 자가 점검

- 슬러그: microwave-turntable-noise-selfcheck
- 코너: repair / 분야: 리빙·주방
- 조사일: 2026-11-03
- 팩트 파일: content/research/facts/common_microwave-turntable-noise-selfcheck.json

## 1. 저장소 확인 (0단계)

- content/research/facts/ 에서 전자레인지 관련 기존 팩트를 먼저 읽었다.
  - 공통_microwave-not-heating-selfcheck.json
  - common_microwave-spark-selfcheck.json
  - 공통_microwave-container-factcheck.json, 공통_microwave-safety-factcheck.json (파일명만 확인)
- 재사용: `microwave-turntable-rotation-check` (삼성 국내 공식 solution/24832 를 직접 열어 확인함).
- 거부: `microwave-turntable-not-rotating-bearing-damage` — 출처로 든 삼성 24832 페이지에 베어링·운모판·커플러 문구가 없었다.
- 신고(disputes): `microwave-turntable-not-rotating-bearing-damage`, `microwave-never-disassemble-warning` — 두 팩트가 든 출처 페이지에 해당 문구가 없었다.
- 공통 안전 기준선(공통_as-safety-baseline.json)은 이 주제에 직접 쓸 항목이 없어 재사용하지 않았다(냉매·배터리·초기화·점프스타트는 무관).

## 2. 공식 문서 확인 (직접 열어 읽은 것)

| 기관 | 문서 | URL | 확인 내용 |
|---|---|---|---|
| 삼성전자서비스(국내) | 음식이 익지 않고 가열이 약해요 (레인지) | https://www.samsungsvc.co.kr/solution/24832 | 회전판 이물질·회전 받침과 회전축 장착 확인, 가장자리 배치, 해결 안 되면 출장서비스 예약. 분해 금지·롤러·베어링 문구 없음 |
| 삼성전자서비스(국내) | 작동 중 내부에서 스파크(불꽃)가 발생합니다 | https://www.samsungsvc.co.kr/solution/41149 | 즉시 전원 차단, 고객센터 1588-3366, 전문 엔지니어 방문 점검. 분해·턴테이블 문구 없음 |
| 삼성전자 NZ(영문) | Microwave Oven's 'Turntable' is not spinning | https://www.samsung.com/nz/support/home-appliances/microwave-oven-turntable-is-not-spinning/ | 롤러 링·베이스 휠 청소(따뜻한 물), 바닥·롤러 트랙 청소, 완전 건조 후 조립, 커플러 위치 확인(잘못되면 회전 안 되고 큰 소음), 연속 그라인딩 소음 |
| LG전자(국내) | 평소와 달리 큰 소음이 나요 | https://www.lge.co.kr/support/solutions-20150332195464 | 회전 접시·받침 정위치, 회전축·회전 바퀴 이물질 제거, 설치 수평 확인, 45~50dB 발진음은 정상, 갑자기 매우 큰 굉음은 서비스 점검 |
| LG전자(미국, 영문) | Troubleshooting noises (microwave) | https://www.lg.com/us/support/help-library/lg-microwave-troubleshooting-noises--20152329269153 | 턴테이블·받침 위치, 음식물 찌꺼기(물컵 2~3분 가열 후 닦기), 금 장식 식기 금지, 점검 후에도 소음이면 서비스 점검 |
| LG전자(미국, 영문) | turntable stuck not rotating | https://www.lg.com/us/support/help-library/turntable-stuck-not-rotating--20154848462353 | 회전링·턴테이블 축 주변 이물질 확인·제거, 다시 제자리에 장착, 유리판 덜컹거림 시 유리판 이물질 확인 |

**확인하지 못한 것:** 국내 삼성 페이지의 턴테이블 소음 전용 문서, 롤러 링 마모 기준, 커플러 교체 절차, 분해 금지 문구(공식 페이지 3건 모두 확인 안 됨).

## 3. 후기·커뮤니티·수리업체 자료 (evidence "후기"로 취급, 팩트에는 넣지 않음)

- 수리업체 블로그(fredsappliance, paradiseapplianceservice, easybear-appliancerepair 등)는 롤러 링 위치 불량 → 덜컹거리는 소리, 커플러·모터 고장을 주된 원인으로 꼽는다.
- appliancepartspros.com 은 HTTP 403 으로 열지 못해 팩트로 쓰지 않았다.
- 모터 저항값·부품 번호 등 구체 수치는 공식 자료에서 확인하지 못해 쓰지 않았다.

## 4. 힌트와 달랐던 점

- 총괄 힌트의 "롤러 링·받침 이물·회전축" 중 롤러 링과 받침 이물은 공식 페이지에서 확인된다. 다만 국내 LG는 "롤러"를 쓰지 않고 "회전 바퀴"로 표기한다.
- "사용자 전원 차단 후 점검"은 삼성 스파크 페이지(41149)의 즉시 전원 차단 문구로만 확인했다. 턴테이블 소음 점검 자체에서 전원을 끄라는 문구는 확인된 공식 페이지가 없다. 안전 상식이지만 출처는 스파크 페이지다. 본문에서는 "전원을 끈 뒤 점검"을 쓰되 스파크 문서를 근거로 달지 않는다.
- "분해 금지"는 공식 원문에서 확인하지 못했다. 기존 팩트 `microwave-never-disassemble-warning` 의 출처도 맞지 않아 신고했다. 본문에서는 단정 경고 대신 "턴테이블 판·받침까지만 빼서 보고, 모터·커플러 교체는 서비스 접수"로 쓴다.
- 삼성 NZ 페이지는 뉴질랜드 제품 기준이라 국내 적용은 "국내 동일 문구 미확인"으로 표기한다.

## 5. 집필 시 권장 구조 (참고, 집필은 하지 않음)

1. 소음 종류부터 구분: 작동 중 웅웅거림(정상, 45~50dB) vs 덜컹거림·긁는 소리(점검 대상) vs 갑작스러운 큰 굉음(서비스).
2. 전원 끄고 유리 접시·받침·롤러 링 분리 → 이물질 제거 → 따뜻한 물로 씻고 완전 건조 → 정위치 장착.
3. 설치 바닥 수평과 싱크대 위 설치 여부 확인.
4. 돌아가지 않거나 소음이 계속되면 삼성·LG 고객센터 또는 출장서비스 접수(비용 단정 금지).
