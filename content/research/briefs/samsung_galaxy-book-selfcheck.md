# 삼성 갤럭시북 노트북 안 켜짐·발열·배터리 자가점검 조사

**조사 날짜**: 2026-07-21  
**조사자**: 자료 조사팀  
**상태**: 팩트 21건 신규 수집  

## 조사 개요

LG 그램 노트북 자가점검 팩트와 대칭하는 삼성 갤럭시북 조사. 동일한 증상 영역(전원 문제·배터리·발열·터치패드·화면)을 다루지만, **제조사별 소프트웨어·단축키·절차가 크게 다르므로** LG 그램의 팩트를 직접 인용할 수 없고, 삼성 공식 문서에서 신규로 수집해야 한다.

## 주요 발견사항

### 1. 전원 켜지지 않음 — 모델별 절차 전혀 다름

**LG와의 가장 큰 차이점:**
- LG 그램: 10초 누르기 (한 가지 방식)
- 삼성 갤럭시북: **모델별로 완전히 다름**
  - 갤럭시북 6 (2026): 20~25초 + LED 신호 확인 (4~5회 깜빡임)
  - 갤럭시북 5, 4 (2024~2025): 10초 이상
  - 인텔 모델 (2023~2024): Fn + F1 + 오른쪽 화살표
  - 구형 모델 (2016~2022): Fn + F1 + 오른쪽 화살표

**출처**: 삼성전자서비스 공식 가이드(solution/88599) — 모델별 안내가 매우 상세하고 LED 점멸 신호도 명시.

### 2. 배터리 수명 연장 (85% 제한) — LG와 용어·경로·수치 모두 다름

**LG 그램 vs 삼성 갤럭시북**:
- LG: "Battery Life Extension" 기능, 80% 제한, 앱명 연식별 상이(My gram / LG Smart Assistant / LG Control Center)
- 삼성: "Protect battery mode" 기능, **85% 제한**, **"Samsung Settings"** 앱 통일

**설정 방법**: Windows Settings → Samsung Settings → Battery and Performance → Protect battery toggle ON
- 활성화 시 배터리 아이콘에 하트 기호 표시
- 갤럭시북 3 이후 모델부터 지원 (2023~)

**출처**: 삼성 공식 배터리 지원 페이지 + 인도 지원팀 문서에서 확인.

### 3. 발열 / 팬 소음 — 저소음 모드 개념은 동일, 설정 경로 다름

**공통점**: 둘 다 성능 모드와 냉각 모드 개념 사용

**차이점**:
- LG: Fn+F1, LG Smart Assistant/LG Control Center
- 삼성: Fn+F11 (또는 모델별 상이), **Samsung Settings** → 배터리 및 성능

**저소음 모드 주의점**: 팬을 약하게 동작시키므로 오히려 발열이 심해질 수 있음. 온도 관리 필요하면 권장 모드 이상 사용.

**물리적 해결책**: 최소 15cm 통풍 간격 유지, 침대/쿠션 위 사용 금지 (동일).

### 4. 터치패드 먹통 — 단축키와 Windows 설정 경로 동일하나, BIOS 확인 추가

**LG와의 차이**:
- LG: Fn+F5 (2024년 이전), Fn+F4 (2025년 이후)
- 삼성: **Fn+F5** (연식 무관)

**공통 진행 단계**:
1. Fn+F5 단축키 토글
2. Windows Settings 확인
3. 장치 관리자에서 I2C HID 기기 활성화
4. BIOS 진입(F2) → Touch Pad Mouse Enable 확인 ← **삼성이 추가로 요구**
5. Samsung Update에서 드라이버 재설치

**특수 케이스**: 갤럭시북 S(스냅드래곤) 모델은 키보드 커버 재장착 필요.

### 5. 화면 안 나옴 — 외부 모니터 테스트 + Fn 단축키

**LG와 동일한 진행**:
- 외부 모니터 HDMI 테스트 (디스플레이 부품 고장 판별)
- HDMI 케이블 교체 테스트

**삼성 추가 절차**:
- Fn+F4 (또는 Fn+모니터 전환 키) → 다중 디스플레이 [확장]/[복제] 설정
- 그래픽 드라이버 재설치 (Samsung Update 권장)

**주의**: 단축키는 모델별로 다를 수 있음.

## LG 그램과 구분되는 이유

| 항목 | LG 그램 | 삼성 갤럭시북 | 재사용 불가 이유 |
|---|---|---|---|
| **전원 리셋** | 10초 일괄 | 모델별 6초~25초 | 절차와 시간, LED 신호 완전 상이 |
| **배터리 수명 연장** | Battery Life Extension 80% | Protect battery 85% | 용어, 수치, 앱명 전혀 다름 |
| **배터리 설정 앱** | My gram / LG Smart Assistant / LG Control Center | Samsung Settings | 제조사 전용 소프트웨어 |
| **냉각 모드 단축키** | Fn+F1 | Fn+F11 | 단축키 체계 다름 |
| **터치패드 활성화** | Fn+F4 (2025) / Fn+F5 (2024 이전) | Fn+F5 (통일) | LG는 연식별, 삼성은 통일 |
| **진단 소프트웨어** | LG Smart Assistant 진단하기 | Samsung Settings (확인 필요) | 앱 자체가 다름 |
| **고객센터** | 1544-7777 | 1588-3366 | 기관 다름 |

## 팩트 신뢰도 분석

**확실(tier=확실): 18건**
- 삼성전자서비스 공식 가이드(samsungsvc.co.kr)
- Samsung 공식 지원 페이지
- 모델별 명시적 안내 있음

**논쟁(tier=논쟁): 1건**
- `samsung-galaxy-book-performance-mode-shortcut-key`: Fn+F11이 "일부 모델"에만 적용되고 모델별로 상이하다는 공식 안내

**확인실패(tier=확인실패): 2건**
- Samsung Settings의 시스템 진단 기능 상세 (LG Smart Assistant의 진단하기 기능처럼 구체적인 6가지 항목 검사 여부 미확인)
- Samsung Update 진단 기능 (있는지 없는지 공식 문서에 직접 명시 부재)

## 웹 검색 기록

**검색 횟수**: 6회 (상한선 내)

1. 삼성 갤럭시북 전원 안 켜짐 자가점검 → 모델별 RTC 리셋 절차 발견
2. Samsung Galaxy Book power battery reset 공식 → 배터리 보호 모드 정보
3. 배터리 수명 연장 & Samsung Settings 기능 → 85% 제한 및 설정 경로 확인
4. 발열 팬 소음 냉각 모드 → Fn+F11, Samsung Settings 경로 확인
5. 터치패드 먹통 → Fn+F5, BIOS, 드라이버 전 절차 확인
6. 화면 안 나옴 & 고객센터 → HDMI 테스트, Fn+F4, 1588-3366 확인

**차단된 검색**: 없음. 모든 출처가 생존 확인됨.

## declined_facts 8건 정리

| LG 팩트 ID | 사유 | 상태 |
|---|---|---|
| lg-gram-internal-battery-power-reset | 배터리 리셋 시간과 LED 신호 완전 상이 | ✓ 기각 |
| lg-gram-battery-life-extension-2025-model-setting | 앱명(My gram vs Samsung Settings) 및 설정 경로 완전 상이 | ✓ 기각 |
| lg-gram-battery-life-extension-2022-model-setting | 앱명(LG Smart Assistant vs Samsung Settings) 완전 상이 | ✓ 기각 |
| lg-gram-battery-life-extension-pre2022-model-setting | 앱명(LG Control Center vs Samsung Settings) 완전 상이 | ✓ 기각 |
| lg-gram-overheating-cooling-mode-setting | 단축키(Fn+F1 vs Fn+F11) 및 앱 완전 상이 | ✓ 기각 |
| lg-gram-touchpad-2025-model-enable | 단축키(Fn+F4 vs Fn+F5) 상이 | ✓ 기각 |
| lg-gram-touchpad-pre2024-model-enable | 설정 경로와 추가 절차(BIOS) 차이 | ✓ 기각 |
| lg-smart-assistant-availability | 전용 소프트웨어 완전 상이(LG Smart Assistant vs Samsung Settings) | ✓ 기각 |

모든 기각이 정당함. 외형상 유사하지만 도구·수치·절차가 다르므로 글에 혼용하면 독자가 엉뚱한 설정을 시도하게 됨.

## 추후 활용 방안

1. **갤럭시북 자가점검 글 집필 시**: 이 팩트 21건 중 필요한 것만 인용. 반드시 `scope` 필드로 모델·연식 명시.
2. **다른 삼성 노트북(Gram, Odyssey 등) 조사 시**: 갤럭시북 팩트의 일부(특히 전원 리셋, 배터리 설정) 재사용 가능성 검토. 모델별 차이 확인 필수.
3. **이 팩트의 오류 발견 시**: 신규 JSON의 `disputes[]`에 신고. 직접 수정 금지.

## 결론

삼성 갤럭시북 자가점검 팩트 기초 확보 완료. LG 그램과의 높은 대칭성에도 불구하고, 제조사별 전용 소프트웨어·단축키·절차의 차이로 인해 직접 재사용 불가. 다만 **물리적 해결책(통풍, 케이블 테스트, 외부 모니터)**은 공통이므로, 향후 "노트북 일반" 카테고리 글에는 양쪽 팩트를 함께 인용할 수 있음.
