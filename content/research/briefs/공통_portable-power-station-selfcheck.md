# 포터블 파워스테이션 충전 안 됨·출력 안 됨·발열 자가점검

## 조사 범위
- **주제**: 대용량 파워뱅크·포터블 파워스테이션 고장 원인 및 자가진단
- **대상**: 충전 불량, 출력 차단, 배터리 팽창, 발열 문제
- **특화 기술**: LiFePO4 vs 리튬이온, 패스스루 충전, BMS 보호 회로, 보관 기준

---

## 1단계: 충전이 안 될 때

### 어댑터·케이블 점검
**공식 출처**: VoltX, Jackery, PowerStationLab 공식 가이드

1. **육안 검사**: 케이블과 어댑터에서 **구부러진 핀, 절단, 느슨한 연결, 과열 흔적, 냄새** 여부 확인
   - 손상이 보이면 교체 필수
   - 원본 충전기나 제조사 승인 제품만 사용
   
2. **전압·전류 매칭**: 잘못된 충전기 사용 시 파워스테이션이 올바른 전압/전류를 받지 못함
   - 충전기 스펙(예: 65W PD, 45W QC 등)이 기기 입력 사양과 맞는지 확인
   - 멀티탭 과부하도 전압 강하 유발 → 벽 콘센트 직접 연결 권장

### 포트·콘센트 점검
**공식 출처**: VoltX, Exspenditure, PowerStationLab

1. **포트 청소**: 입력 포트 내부의 **먼지, 흙, 습기** 제거
   - 시각적 검사로 이물질 확인
   - 케이블이 완전히 결합되어 있는지 재확인 (부분 연결 시 충전 인식 안 됨)
   - 청소 시 포트 내부에 물이 들어가지 않도록 주의

2. **벽 콘센트 확인**: 다른 기기(예: 스탠드)를 같은 콘센트에 연결하여 정상 작동 확인
   - 멀티탭 과부하 확인
   - 느슨한 플러그 재조임

### 내부 고장 (드문 경우)
내부 퓨즈나 파워 브릭 고장은 상대적으로 드물며, 위의 점검으로도 해결 안 되면 서비스센터 문의 필요.

---

## 2단계: 출력이 안 될 때 — BMS 보호 회로 확인

### 오버로드 보호 (Overload Protection)
**공식 출처**: EcoFlow, PowerStationHQ

- **원인**: 연결한 기기의 총 전력이 **정격 지속 전력(Continuous Power)** 또는 **순간 최대 전력(Surge Capacity)**을 초과
- **증상**: "OVERLOAD" 에러 표시 또는 경보음, 출력 즉시 차단
- **해결**: 
  1. 연결 기기 제거
  2. 30초~1분 대기
  3. 전원 재연결

### 단락·과전압 보호 (Short Circuit / Over-voltage Protection)
**공식 출처**: PowerStationHQ

- **원인**: BMS가 과부하, 단락, 비정상 전압 스파이크 감지
- **상태**: 기기가 완전히 잠금 상태(latched lockout)로 진입
- **해결**:
  1. 전원 30초 이상 끄기
  2. 리셋 버튼 누르기(있는 경우)
  3. 실온에서 냉각 시간 기다리기
  4. 재시동

**주의**: 오버로드 상황이 반복되면 배터리와 BMS 수명이 단축된다.

---

## 3단계: 발열·배터리 팽창 문제

### 배터리 팽창의 실제 원인
**공식 출처**: PowerStationLab, VoltaCharger

**팽창은 무작위가 아니다** — 다음 중 하나 이상이 원인:
- 저가 배터리 셀 품질 부족
- 약한 보호 회로(BMS 성능 낮음)
- 부족한 열 관리

고온 환경에서의 장시간 노출은 **전해질 분해를 가속화**하여 배터리 열화와 팽창으로 직결된다.

### 예방 전략

#### 장기 보관 (수개월 이상)
**공식 출처**: PowerStationLab, Battery Skills

- **충전 상태**: 60~70% 유지
- **유지보수**: 3개월마다 한 번씩 30%로 방전 후 60%까지 재충전
- **온도**: 상온(15°C ~ 27°C, 또는 60°F ~ 80°F) 보관

#### 일상 사용
**공식 출처**: PowerStationLab

- **충전 범위**: 20~80%로 제한
- **이유**: 마지막 20% 충전은 추가 열과 화학 스트레스 유발
- **극단 피하기**: 0% 완전 방전, 100% 과충전 모두 피할 것

#### 온도 조건
**공식 출처**: PowerStationLab

| 상황 | 기준 | 원인 |
|---|---|---|
| 충전 금지 | 0°C 이하 (32°F) | 음극 손상 위험 |
| 사용·보관 | 상온(60°F~80°F) | 화학 반응 안정 |
| 고온 노출 | 100°F(37.8°C) 이상 장시간 | 전해질 분해 가속화, 영구 용량 손상 |

**주의**: 여름철 자동차 트렁크, 햇빛이 직사광선으로 드는 장소는 쉽게 100°F를 넘는다.

#### 부하 제한
**공식 출처**: PowerStationLab

- **80% Rule**: 정격 용량의 80% 이하로 지속 부하 제한
- **효과**: 과열 위험 완화, 배터리 수명 연장
- **순간 최대 전력**: 초 단위로만 사용 가능

---

## 4단계: 배터리 타입 이해하기 — LiFePO4 vs 리튬이온

### LiFePO4 (인산철 리튬)
**공식 출처**: Anker, LiTime, Renogy, Anern

**장점**:
- **과충전 내성 우수**: 100% 충전 후에도 위험도 낮음
- **열 안정성 우수**: 양극 재료가 300°C 이상에서도 분해 안 됨
- **장수명**: 3,000회 이상 사이클 가능
- **안전성**: 열폭주 위험 극히 낮음

**단점**:
- **느린 충전**: 1C 속도로 약 3시간 소요
- **낮은 에너지 밀도**: 같은 용량 대비 부피·무게 증가

**스펙**:
- 셀당 명목 전압: 3.2~3.3V
- 완전 충전 전압: 3.65V
- 충전 효율: 약 95%

### 리튬이온 (NCA/NCM 등)
**장점**:
- 빠른 충전 (1~2시간)
- 높은 에너지 밀도

**단점**:
- 과충전에 약함
- 열폭주 위험 높음

### 충전기 호환성 경고
**공식 출처**: Anker, Anern

- **절대 금지**: LiFePO4 배터리를 리튬이온용 충전기로 충전하거나 반대
- **이유**: LiFePO4는 더 엄격한 전압 범위(tighter tolerance) 요구, trickle/float charging 없음
- **결과**: 충전 오류, 배터리 손상, 안전 위험

---

## 5단계: 패스스루 충전(Pass-Through Charging) 이해

### 정의
**공식 출처**: EcoFlow, Bluetti

포터블 파워스테이션 자신의 배터리를 충전받으면서 **동시에** 외부 기기에 전력 공급.

### 안전성
**공식 출처**: EcoFlow, Bluetti

- **안전한 설계**: 발열 최소화, 안정적 전원 공급 → BMS 추가 스트레스 없음
- **보호 계층**:
  1. 지능형 전원 관리 IC: 단락·과전류·과전압·과열 보호
  2. 정교한 BMS: 모든 매개변수 지속 모니터링

### 주의
- 패스스루 충전 중 고부하 기기 동시 사용 시 배터리 충전 속도 저하
- 신뢰성 높은 브랜드 선택 권장 (저가 제품의 USB-C 포트는 접점 손상 위험)

### 배터리 타입별 차이
- **LiFePO4**: 프리미엄 모델, 3,000+ 사이클, 최고 안전성
- **NMC 리튬이온**: 빠른 충전, 사이클 수명 단축

---

## 6단계: 위험 신호 — 즉시 중단

다음 증상이 보이면 **즉시 사용 중단하고 서비스센터에 문의**:

1. **배터리 팽창**: 기기 케이스가 부풀어 올라옴 → 폭발 위험
2. **과열**: 기기가 손으로 잡을 수 없을 정도로 뜨거움
3. **이상한 냄새**: 타는 냄새, 화학 냄새
4. **포트 손상**: 녹슬음, 부식, 갈라짐
5. **반복적 오버로드**: BMS 보호가 자주 작동하는 신호

---

## 정리: 자가점검 우선순위

### 충전 안 됨
1. ✓ 어댑터·케이블 손상 확인
2. ✓ 포트 먼지·습기 청소
3. ✓ 벽 콘센트 정상 확인
4. ✓ 다른 충전기 시도(가능하면)
→ 해결 안 되면 서비스센터

### 출력 안 됨
1. ✓ 연결 기기 부하 확인 (정격 초과인지?)
2. ✓ 기기 제거 후 30초 대기
3. ✓ 전원 완전히 끄기 (30초 이상)
4. ✓ 리셋 버튼 누르기 또는 냉각 기다리기
→ 해결 안 되면 서비스센터

### 발열·팽창 예방
1. 장기 보관: 60~70%, 상온(15~27°C), 3개월마다 유지보수
2. 일상 사용: 20~80% 충전 범위, 80% 부하 제한
3. 온도: 0°C 이하 충전 금지, 100°F 이상 환경 피하기

---

## 출처

### 공식 문서
- **VoltX** (호주): [Portable Power Station Not Charging? Here's How to Fix It](https://voltx.com.au/blogs/voltx-blogs/portable-power-station-not-charging-here-s-how-to-fix-it)
- **Jackery**: [Why Is My Jackery Not Charging? Common Causes and Fixes](https://www.jackery.com/blogs/buying-advice/why-is-my-jackery-not-charging-common-causes-and-fixes)
- **EcoFlow**: [Overload Power Station Ports: Fixes & Prevention Tips](https://www.ecoflow.com/us/blog/overload-power-station-ports-fixes-prevention)
- **Bluetti**: [What Is Pass-Through Charging in Portable Power Stations?](https://www.bluettipower.com/blogs/knowledge/what-is-pass-through-charging)

### 기술 가이드
- **PowerStationLab**: [Portable Power Station Troubleshooting (2026)](https://wildsmartgear.com/portable-power-station-troubleshooting/)
- **PowerStationLab**: [How to Charge Portable Power Station: Best Maintenance Tips](https://powerstationlab.com/how-to-charge-portable-power-station/)
- **PowerStationLab**: [5 Portable Power Station Mistakes That Ruin Batteries (2026)](https://powerstationlab.com/portable-power-station-mistakes/)
- **PowerStationHQ**: [Troubleshooting Common Portable Power Station Issues](https://powerstationhq.com/toolbox/power-guides/troubleshooting-common-portable-power-station-issues-a-practical-guide/)

### 배터리 타입 비교
- **Anker**: [LiFePO4 vs Lithium Ion Batteries](https://www.anker.com/blogs/others/lifepo4-vs-lithium-ion)
- **Renogy**: [LiFePO4 vs Lithium Ion Batteries: Which is Better?](https://www.renogy.com/blog/lifepo4-vs-lithium-ion-batteries)
- **Anern**: [LiFePO4 vs. Lithium Ion: Charging Safety Comparison](https://www.anernstore.com/blogs/diy-solar-guides/lifepo4-vs-li-ion-charging-safety)

---

## 팩트 통계
- **새로 확보한 팩트**: 17건
- **재사용한 팩트**: 6건 (배터리 충전·온도·고속충전 관련)
- **발견한 안전 경고**: 3건 (배터리 팽창, 극저온 충전, 고온 환경)
- **tier 분포**: 확실 17건 (100%)
- **evidence 분포**: 공식 16건, 후기 1건
