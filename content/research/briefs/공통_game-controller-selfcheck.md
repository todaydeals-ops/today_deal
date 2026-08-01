# 게임 컨트롤러(엑스박스·듀얼센스·닌텐도) PC 연결·진단·안전 조사

**조사일**: 2026-07-21  
**범위**: PC(Windows) 환경에서의 게임 컨트롤러 자가점검

---

## 1단계: 기존 자료 재검토

### 1.1 재사용 대상 팩트
- **드리프트 관련**: PS5 파일의 `ps5-dualsense-drift-causes-cleaning`, `ps5-dualsense-deep-clean-alcohol` — 범용 원리(압축공기, 알코올 청소)는 모든 아날로그 스틱에 적용됨
- **보정 방법**: 닌텐도 스위치 파일의 `joycon-drift-calibration-official-method` — 조이스틱 보정은 기종별로 유사
- **배터리**: PS5 파일의 `ps5-dualsense-battery-low-disconnection` — 배터리 부족으로 인한 연결 끊김은 범용
- **리셋 버튼**: PS5 파일의 `ps5-dualsense-reset-button-5sec` — 범용 리셋 개념(페어링 초기화)
- **무선 기술**: 무선 키보드·마우스 파일의 `usb-rf-dongle-vs-bluetooth-technology` — USB RF 동글과 블루투스 기술은 게임 컨트롤러에도 동일 적용

### 1.2 거부 사항
- **PS5 특화 진단**: `ps5-dualsense-stick-drift-diagnosis` — "설정 > 액세서리 > 입력 기기 테스트"는 PS5 콘솔에만 있으므로 PC 자가점검 가이드에 부적합

---

## 2단계: 웹 조사 내용 정리

### 2.1 엑스박스 컨트롤러 PC 연결 ([Xbox Support](https://support.xbox.com/ko-KR/help/hardware-network/controller/connect-xbox-wireless-controller-to-pc))

**연결 방식 3가지:**

1. **엑스박스 무선 어댑터** (구형, 권장)
   - 별도 구매 필요
   - USB 포트에 꽂고, 컨트롤러의 Pair 버튼 + 어댑터 Pair 버튼 누름
   - 구형 Xbox One 컨트롤러(2013-2015)만 가능
   - USB 3.0 포트는 2.4GHz RF 간섭이 발생하므로 USB 2.0 포트 권장 (무선 입력기기 파일 참고)

2. **블루투스 직접 연결** (최신형, 간편)
   - Xbox Series X/S 컨트롤러 및 2016년 이후 Xbox One 컨트롤러 지원
   - Windows 설정 > 블루투스 및 기타 장치 > 추가 > Bluetooth 선택
   - 페어링 모드: 컨트롤러 뒷면의 작은 Pair 버튼 누름
   - 가장 간단한 방식

3. **USB 유선** (추가 정보)
   - 어댑터 없이 USB Type-C 케이블로 직접 연결 가능
   - 배터리 소모 없음

**중요 주의**: 엑스박스 원 구형(2013년 배치)은 블루투스 미지원 → 무선 어댑터 필수

---

### 2.2 DualSense 컨트롤러 PC 연결 ([PlayStation Support](https://www.playstation.com/en-us/support/hardware/pair-dualsense-controller-bluetooth/))

**연결 방식 2가지:**

1. **USB Type-C 케이블** (가장 안정적)
   - Windows 10(64비트) 이상에서 자동 인식
   - 별도 드라이버 설치 불필요
   - 유선 연결이므로 배터리 소모 없음
   - 최대 효과: 진동(햅틱 피드백)이 가장 정확하게 작동

2. **블루투스 페어링** (편리함)
   - Create 버튼 + PS 버튼 동시 누르기 약 3초 → 라이트 바 깜빡임
   - Windows 설정 > 블루투스 및 기타 장치 > 추가 > "DualSense Wireless Controller" 선택
   - 라이트 바가 플레이어 색깔(P1: 흰색, P2: 빨강 등)로 변하면 완전 연결
   - 첫 연결 후 1~2초 지연 가능 (정상)

**소프트웨어**: PlayStation Accessories 앱으로 PC에서도 컨트롤러 펌웨어 업데이트 가능

**주의**: 여러 DualSense를 동시 사용하려면 USB 연결만 가능(블루투스는 1개만 페어링 가능한 경우 많음)

---

### 2.3 Steam Input 설정 ([Steam Documentation](https://partner.steamgames.com/doc/features/steam_controller/getting_started_for_players?l=koreana))

**지원 컨트롤러**: Xbox, DualSense, Nintendo Pro, 일반 게임패드 모두 포함

**커스터마이징 항목**:
- 버튼 매핑 (예: A 버튼을 X로 재할당)
- 아날로그 스틱 감도 조정
- 데드존(Dead Zone) 조정 — 미세한 입력 무시
- 트리거 민감도 조정
- 진동(럼블) on/off

**게임별 프로필 저장** 가능 → 게임마다 다른 설정 적용

---

### 2.4 게임 컨트롤러 진동 설정 ([Xbox Support](https://support.xbox.com/ko-KR/help/hardware-network/accessories/change-controller-vibration-xbox-one-windows-10))

**진동 끄는 방법**:
1. Xbox Accessories 앱 실행
2. 컨트롤러 선택
3. "진동" 비활성화

**게임 내 설정**도 확인 (게임이 자체 진동 on/off 옵션 제공)

**해결책**: 진동이 켜져 있어도 작동 안 할 때는 게임 내에서 진동 off → on 토글하면 대부분 해결됨

---

### 2.5 온라인 게임패드 테스트 도구

**주요 도구들**:
- [ControllerTest.io](https://controllertest.io/) — 가장 상세한 테스트 (드리프트, 폴링 레이트, 진동 분석 등)
- [AVTestr.com](https://www.avtestr.com/ko/GamepadTest.html)
- [Gamepad Tester](https://www.codertools.net/tools/gamepad-tester.php)

**테스트 항목**:
- 아날로그 스틱 드리프트 감지
- 버튼 입력 응답 시간
- 트리거 아날로그 감도 (반누름도 감지)
- 진동 모터 테스트
- D-Pad 고스팅 문제

**주의**: WebAPI 기반이므로 Chrome, Edge, Firefox에서만 작동

---

### 2.6 드리프트 해결 순서

1. **온라인 테스트 도구로 진단** → 실제 드리프트 범위 파악
2. **데드존 조정** (Steam Input 또는 게임 내)
   - 1~5% 증가 시도 → 미세 신호 무시
   - 10% 이상은 정상 입력도 반응 안 함
3. **압축공기 청소** (스틱 외부 먼지)
4. **알코올 청소** (스틱 내부, 90% 이상 이소프로필 알코올) — 공식 미권장이나 사용자 보고 있음
5. **스틱 보정** (Nintendo 스위치 스타일, 일부 컨트롤러만)
6. **스틱 부품 교체** 또는 **공식 수리**

**중요**: 청소 후 완전히 건조될 때까지 사용 금지

---

### 2.7 리튬 배터리 안전 ([NY Department of Homeland Security](https://www.dhses.ny.gov/system/files/documents/2023/11/li_batteryconsumersafetyguide-ko.pdf))

**배터리 팽창의 경고 신호**:
- 본체 외부가 부풀어 오름
- 뜨거워짐
- 시큼한 냄새 (전해액 누출)
- 흔들리면 딸깍 소리

**즉시 조치**:
- 전원 끄기
- 화기·열원에서 멀리하기
- 사용 중단
- 인증된 전자제품 폐기 프로그램에 제출 (일반 쓰레기 금지)

**충전 안전**:
- 정품 충전기·케이블만 사용
- 서드파티 충전기는 과전류 손상 위험
- USB-C 호환성이 있어도 정품 권장

---

### 2.8 연결 끊김 진단 순서

1. **배터리 확인** (부족하면 즉시 충전)
2. **거리 확인** (컨트롤러와 수신기 10m 이내)
3. **간섭 제거** (다른 블루투스/2.4GHz 기기 차단)
   - 무선 헤드폰
   - Wi-Fi 라우터 (특히 2.4GHz 대역)
   - 무선 마우스/키보드
   - 전자레인지 (2.4GHz 사용)

4. **페어링 초기화** (리셋 버튼)
5. **펌웨어 업데이트** (제조사 앱에서)

---

### 2.9 충전 포트 트러블슈팅

**충전 안 됨 증상**:
1. USB 포트 육안 검사 (포트 손상, 이물질)
2. 먼지 제거 (면봉, 핀셋 — 강한 힘 금지)
3. 케이블 교체 (정품 케이블 시도)
4. 포트가 구부러졌으면 공식 수리 필요

---

## 3단계: 재사용 vs 신규 정책 결정

### 재사용하지 않은 이유들
- **기종 특화 내용**: PS5 콘솔의 "설정 메뉴"는 다른 플랫폼에 없음
- **연식별 차이**: Xbox One 구형(2013) vs Series X(2020)은 블루투스 지원이 다름
  - 구형 = 무선 어댑터 필수
  - 신형 = 블루투스 가능

### 이번 조사의 범용성
- PC(Windows) 환경에 집중 → 콘솔별 차이 최소화
- 블루투스, USB 동글, USB 케이블 — 모든 기종이 지원하는 표준 연결
- Steam Input — 범용 설정 도구 (거의 모든 게임 패드 지원)
- 온라인 테스트 도구 — 모든 인증된 게임패드 지원

---

## 4단계: 최종 팩트 구성

**총 13개 팩트**:
1. Xbox 무선 어댑터 (정품 필요, USB 3.0 간섭 주의)
2. Xbox 블루투스 (Series X/S 이후만)
3. DualSense USB 연결 (가장 안정적)
4. DualSense 블루투스 페어링 (Create+PS 버튼)
5. Steam Input 커스터마이징 (모든 컨트롤러)
6. Windows 진동 설정 (Xbox Accessories 앱)
7. 온라인 테스트 도구 (드리프트·버튼·트리거·진동)
8. 버튼 입력 테스트 절차 (온라인 도구 사용법)
9. 스틱 드리프트 데드존 조정 (Steam Input)
10. 배터리 팽창 경고 신호 (리튬 배터리 안전)
11. 충전 안전 (정품 충전기만)
12. 연결 끊김 진단 4단계 (배터리 → 거리 → 간섭 → 페어링)
13. 충전 포트 불량 확인 (포트 청소, 케이블 교체)

**팩트 분류**:
- 확실 (공식): 9개
- 확실 (후기/실측): 3개
- 확인실패: 0개
- tier 논쟁: 0개

---

## 5단계: 향후 보완할 수 있는 항목

(현재 조사에 포함 안 함, 다음 기회에)
- 기종별 리셋 버튼 정확한 위치 (구글 이미지 맵핑 필요)
- Nintendo Pro Controller PC 연결 상세 (닌텐도 공식 정보 재확인 필요)
- PS Remote Play (원격 플레이) PC 연결 (PlayStation 특화)
- Steam Deck과의 호환성 (Steam Deck 특화)

---

## 참고 문헌

[공식]
- Xbox Support: https://support.xbox.com/ko-KR/
- PlayStation Support: https://www.playstation.com/en-us/support/
- Steam: https://partner.steamgames.com/doc/features/steam_controller/
- NY Department of Homeland Security (Li-ion Battery Safety): https://www.dhses.ny.gov/

[기술]
- ControllerTest.io: https://controllertest.io/
- AVTestr.com: https://www.avtestr.com/ko/GamepadTest.html

[관련 자료]
- 기존 PS5 팩트: `sony_ps5-selfcheck.json`
- 기존 스위치 팩트: `nintendo_switch-selfcheck.json`
- 기존 무선 입력기기 팩트: `공통_wireless-keyboard-mouse-selfcheck.json`
