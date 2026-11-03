# 조사 전문: 휴대폰 핫스팟이 연결되지 않을 때 점검 순서

- 슬러그: hotspot-not-connecting-selfcheck / 코너: repair / 분야: 디지털·IT
- 조사일: 2026-11-03
- 팩트 파일: content/research/facts/common_hotspot-not-connecting-selfcheck.json

## 1. 조사 범위와 힌트 대비

총괄 힌트는 "요금제 제한·절전·밴드·암호·기기 한도, 삼성·Apple 공식 점검 순서"였다.
공식 원문을 열어 보니 힌트와 다른 점이 있었다.

- **삼성 공식 점검 순서는 요금제·절전을 말하지 않는다.** 삼성 미국 지원 페이지(TSG10004569)의 실제 순서는 재시작 → 모바일 데이터·VPN·보안(WPA2)·숨겨진 네트워크·대역(5GHz/2.4GHz) → 소프트웨어 업데이트(50% 이상 충전) → 안전 모드 → 공장 초기화다. 절전 모드·데이터 세이버·네트워크 초기화는 이 페이지에 없다.
- **절전 모드·데이터 세이버 점검은 후기 자료에서만 확인했다.** 제3자 블로그(Guiding Tech, 2023-09 갱신)가 근거이며 tier는 확인실패, evidence는 후기로 기록했다.
- **삼성 한국 FAQ(39465)는 요금제 점검을 통신사 확인으로 넘긴다.** 테더링 데이터 소진 여부를 가입 통신사에 확인하라는 문장이 공식이다. 요금제 수치는 공식 문서에서 찾지 못해 쓰지 않았다.
- **Apple 공식 문서(HT204023)가 요금제·기기 한도·암호·최대 호환성을 가장 구체적으로 다룬다.** 최대 호환성 옵션의 세부 동작(2.4GHz 고정 등)은 Apple 원문에 없어 단정하지 않았다.
- **Apple 문서를 찾는 과정에서 엉뚱한 페이지를 두 번 열었다.** 104994는 iPhone 12 SAR 문서, 104957은 배경 보안 개선 문서였다. 둘 다 핫스팟 내용이 없어 인용하지 않았다.

## 2. 핵심 출처 (실제로 열어 확인한 것)

| 출처 | URL | 확인 내용 |
|---|---|---|
| 삼성 미국 지원 — Mobile hotspot issues with a Samsung phone | https://www.samsung.com/us/support/troubleshoot/TSG10004569/ | 재시작, 보안 WPA2·숨겨진 네트워크 끄기·대역 변경, 업데이트(50% 충전), 안전 모드, 공장 초기화 |
| 삼성 미국 지원 — Troubleshoot Mobile Hotspot and Tethering issues | https://www.samsung.com/us/support/troubleshoot/TSG10013009/ | 유심을 정상 유심으로 바꿔 확인, 테더링 데이터 잔여량 확인 |
| 삼성전자서비스 — 모바일 핫스팟 설정 FAQ | https://www.samsungsvc.co.kr/solution/39465 | 모바일 데이터 확인, 테더링 데이터 소진 시 통신사(114) 확인 |
| 삼성전자서비스 — 핫스팟이 Wi-Fi 목록에 안 보여요 | https://www.samsungsvc.co.kr/solution/23353 | 내 디바이스 숨기기 해제, 숨겨진 네트워크 OFF, 전문상담 안내 |
| Apple 지원 — Connect to the Personal Hotspot of an iPhone or iPad | https://support.apple.com/en-us/HT204023 | 요금제 지원·추가 요금·기기 수 제한, 다른 사용자 허용, 암호 8자 이상 ASCII, 최대 호환성, 근접·Wi-Fi·블루투스 |
| Guiding Tech 블로그 (후기) | https://www.guidingtech.com/ways-to-fix-mobile-hotspot-not-working-on-samsung-galaxy-phones/ | 비행기 모드 재시도, 데이터 세이버·절전 끄기, 네트워크 초기화 (제3자, 공식 아님) |

## 3. 재사용 팩트

- `battery-swelling-stop-immediately` (공통): 배터리 부풂·과열·타는 냄새 시 즉시 중단. 핫스팟 발열 안내의 안전 문장으로 사용.
- `factory-reset-data-loss` (공통): 공장 초기화는 데이터를 전부 지운다. 삼성 단계의 맨 마지막 단계와 연결.
- `safe-mode-entry-method` (삼성 충전 글): 안전 모드 진입법. 점검 단계 안전 모드 항목에서 참조.
- `galaxy-overheat-cause-hotspot-weak-signal` (삼성 발열 글): 핫스팟 제공 중·신호 약할 때 발열 증가. 주의: 한국 삼성 페이지(618161)에는 없고 글로벌 안내에 따른 것이므로 "글로벌 공식 안내 기준"으로 표기.
- `iphone-reset-network-settings-last-resort`, `iphone-reset-network-erases-list` (Apple 111786): 아이폰 네트워크 설정 재설정은 최후 수단이며 Wi-Fi 목록·암호·셀룰러·VPN·APN 설정을 지운다.
- `iphone-wifi-no-internet-contact-isp-or-apple` (Apple 111786): Wi-Fi에는 붙는데 인터넷이 안 되면 인터넷 제공사, 어떤 Wi-Fi에도 안 붙으면 Apple에 문의.

## 4. 거부한 팩트

- `ios-update-hotspot-conflict` (아이폰 업데이트 글): 컴퓨터가 업데이트 중 핫스팟에 묶이는 상황이라 주제 범위가 다르다.
- `google-hotspot-test-unofficial` (스마트 스피커 글): Google 제품 문서로 제조사·제품군이 다르다.

## 5. 새로 확보한 팩트 (15건)

| id | tier | evidence | 요약 |
|---|---|---|---|
| hotspot-no-internet-check-cellular-and-tether-data | 확실 | 공식 | 인터넷 안 됨: 모바일 데이터와 테더링 잔여량 확인 |
| apple-hotspot-carrier-support-and-fees | 확실 | 공식 | 아이폰 핫스팟은 지원 회선 필요, 추가 요금, 기기 수는 통신사·기종별 |
| apple-hotspot-allow-others-and-password | 확실 | 공식 | 다른 사용자 허용 켜기, 암호 8자 이상 ASCII |
| apple-hotspot-maximize-compatibility-try | 확실 | 공식 | 최대 호환성 옵션 시도(세부 동작은 미확인) |
| apple-hotspot-wifi-bluetooth-nearby | 확실 | 공식 | 근접, Wi-Fi·블루투스 켜기 |
| samsung-hotspot-restart-first | 확실 | 공식 | 삼성 1단계는 재시작 |
| samsung-hotspot-check-availability-and-band | 확실 | 공식 | 보안 WPA2, 숨겨진 네트워크 끄기, 대역 변경, 모바일 데이터·VPN 확인 |
| samsung-hotspot-hidden-device-off | 확실 | 공식 | 목록에 안 보임: 내 디바이스 숨기기 해제 (한국 경로) |
| samsung-hotspot-airplane-mode-toggle-blog | 확인실패 | 후기 | 비행기 모드 재시도 (공식 아님) |
| samsung-hotspot-data-saver-power-saving-blog | 확인실패 | 후기 | 데이터 세이버·절전 모드 끄기 (공식 아님) |
| samsung-hotspot-update-at-50-percent | 확실 | 공식 | 업데이트는 50% 이상 충전 상태에서 |
| samsung-hotspot-safe-mode-isolate-app | 확실 | 공식 | 안전 모드에서 되면 최근 내려받은 앱을 하나씩 삭제 |
| samsung-hotspot-sim-swap-test | 확실 | 공식 | 정상 유심으로 교체해 원인 가르기 |
| samsung-hotspot-service-center-criteria | 확실 | 공식 | 단계 모두 실패 시 전문상담 |
| samsung-hotspot-network-reset-blog-only | 확인실패 | 후기 | 네트워크 설정 초기화는 후기 방법 (삼성 공식 아님) |

## 6. scope와 기종 차이

- 삼성 대역·보안 메뉴는 기종·One UI 버전마다 위치가 다르다. 메뉴 이름을 단정하지 않았다.
- 한국 경로(설정 → 연결 → 모바일 핫스팟 및 테더링 → 모바일 핫스팟 → 설정 → 고급 → 숨겨진 네트워크 OFF → 저장)는 한국 FAQ 기준이다. 미국 페이지 메뉴와 다를 수 있다.
- 아이폰 항목은 Apple 공식 원문 기준이며 기종별 차이는 문서에서 확인되지 않았다.
- 요금제 제공량, 통신사별 테더링 속도 제한 수치는 공식 자료에서 찾지 못해 넣지 않았다. 2016~2011년 기사와 블로그만 있었으므로 쓰지 않았다.

## 7. 확인 못 한 것 (확인실패로 남김)

- 갤럭시 절전 모드·데이터 세이버가 핫스팟을 막는다는 공식 확인: 없음 (후기만).
- 갤럭시 네트워크 설정 초기화가 저장 Wi-Fi를 지우는 범위: 공식 확인 못 함.
- 통신사별 테더링 제한 수치와 약관: 공식 확인 못 함. 현재 약관은 통신사 고객센터에서 확인하도록 안내.
- 삼성 커뮤니티 "핫스팟 연결 안 됨" 스레드: 접근이 리디렉션에서 막혀 열지 못함. 본문에 인용하지 않음.

## 8. 검증

- `node scripts/magazine-srcaudit.mjs --scope=common_hotspot-not-connecting-selfcheck`: 배제 대상 0건. 미확인 도메인 3건(guidingtech.com, 후기 근거 팩트 3건). 출처 세탁 0, 허용목록 위반 0.
- 기관명 귀속 확인: 모든 `source` 기관명은 해당 `source_url`을 실제로 연 문서다. 제3자 블로그는 "블로그"로 표기하고 공식이라 적지 않았다.
- `scripts/research-index.mjs`는 실행하지 않았다(지시에 따라 INDEX.md 덮어쓰기 방지).
- 빌드·서버·git·DB 접근 없음.

## 9. 집필 지침 (상담가 톤 적용)

- 순서는 "기기 확인 → 재시작 → 통신사·데이터 확인 → 설정(보안·대역·숨기기) → 업데이트 → 안전 모드 → 초기화 전 백업" 순으로 쓴다.
- 요금제 제한은 "통신사에 테더링 잔여량을 확인하라"로 안내하고 수치를 단정하지 않는다.
- 절전·데이터 세이버는 "공식 점검 항목은 아니지만 손해 볼 것 없으니 끄고 해본다"로 수준을 밝혀 쓴다.
- 암호·기기 한도는 아이폰 기준으로 쓰고, 갤럭시는 한국 FAQ 기준을 따로 쓴다.
- 착지점은 "여기까지 해봤는데 안 되면 삼성전자서비스 전문상담 또는 통신사 문의"다. 초기화 전에는 반드시 백업을 먼저 안내한다.
