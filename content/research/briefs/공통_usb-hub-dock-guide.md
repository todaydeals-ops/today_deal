# USB-C 허브·독, 어떻게 고르나? 스마트가이드 — 조사 전문

## 용어 정의: 허브 vs 독

USB-C 허브와 독은 기능적으로는 같지만 호칭에서만 구분된다. [아트뮤](https://artmu.co.kr/product/c%ED%8F%AC%ED%8A%B8-%ED%95%98%EB%82%98%EB%A1%9C-usb-pd-dp-alt-mode-%EC%A7%80%EC%9B%90/) 및 [CalDigit](https://www.caldigit.com/usb-c-soho-dock/)에 따르면:
- **허브**: 휴대용, 포트 추가용, 임시성 강조
- **독**: 책상 고정용, 영구 설치용, 데스크톱 워크스테이션 지향

실제 구매 시에는 크기·무게·포트 구성으로 선택하면 되고, 호칭은 판매 전략일 뿐이다.

## 핵심 기술 1: DP Alt Mode (DisplayPort Alternate Mode)

[BenQ 공식 설명](https://www.benq.com/en-us/knowledge-center/knowledge/usb-c-introduction-what-is-dp-alt-mode.html), [Plugable 기술 문서](https://kb.plugable.com/docking-stations-and-video/can-i-use-an-alt-mode-video-adapter-with-my-mac), [WFYEAR](https://wfyear.net/ko/news/details/619.html)를 종합하면:

**모든 USB-C 포트가 디스플레이를 지원하는 건 아니다.** DP Alt Mode를 지원하는 포트만 외부 모니터 연결이 가능하다.

### 4K 60Hz는 DP Alt Mode 필수

- **DP Alt Mode 지원** (DisplayPort 1.3+): 4K 60Hz 가능 ✓
- **HDMI Alt Mode만 지원** (HDMI 1.4b): **4K 30Hz 최대** ✗
- DP Alt Mode 미지원: 모니터 연결 불가능 ✗

[ITWorld](https://www.itworld.co.kr/news/225144)에서 실측한 바로는, USB-C to HDMI 허브로 4K 60Hz 출력 시 최대 32.4Gbps 대역폭이 필요하다.

**핵심**: 4K 60Hz 모니터가 필요하면, 먼저 자신의 노트북이 DP Alt Mode를 지원하는지 확인하는 것이 가장 중요하다. 지원하지 않으면 아무 허브도 도움이 안 된다.

## 핵심 기술 2: PD 패스스루 (Power Delivery Passthrough)

[TI 공식 USB-C 가이드](https://www.ti.com/lit/eb/koky061/koky061.pdf)와 [ITWorld](https://www.itworld.co.kr/article/3562360)에 따르면:

**PD 패스스루**는 USB-C 허브를 통해 노트북 충전 + 데이터 전송을 동시에 수행하는 기능이다. 허브에 전원 어댑터를 연결하고 노트북을 USB-C로 연결하면 둘이 동시에 가능하다.

### 전력 공급 용량 필수 확인

USB-C PD는 최대 **240W까지 지원** 가능하지만, 실제 필요량은 장치마다 다르다.

| 기기 | 필요 와트 |
|---|---|
| MacBook Air | 45~60W |
| MacBook Pro 14인치 | 96W |
| MacBook Pro 16인치 | 140W |
| Samsung Galaxy Book | 65W |
| 일반 울트라북 | 45W |
| 일반 표준 노트북 | 60W |
| 고성능 노트북 | 100W |

[Apple 공식 충전 사양](https://tidytipshub.com/%EB%A7%A5%EB%B6%81-%EC%B6%A9%EC%A0%84%EA%B8%B0-%EC%A2%85%EB%A5%98%EB%B3%84-%EC%B0%A8%EC%9D%B4%EC%A0%90-%EB%B9%84%EA%B5%90/) 및 [산업 기준](https://it.rushmac.net/1626)을 참고하면, 충전기를 구매할 때는 필요 전력의 120% 정도 여유를 갖추는 것이 좋다.

## 대역폭 공유 문제: 포트 많다고 좋은 게 아니다

[MakeUseOf](https://www.makeuseof.com/usb-hubs-have-a-big-limitation-shared-bandwidth/), [HowToGeek](https://www.howtogeek.com/your-usb-dongles-are-secretly-slowing-down-your-pc/), [Lention](https://www.lention.com/blogs/news/usb-c-hub-slowdown-fix) 등의 기술 분석을 보면:

**허브의 모든 포트는 호스트(노트북) USB-C 포트의 대역폭을 공유한다.**

### 실제 사례: 대역폭 경합

노트북의 USB 3.1 Gen 2 포트(10Gbps)에 허브를 연결하고, 다음을 동시에 사용하면:
- 외장 NVMe SSD (이론상 2,200MB/s)
- 4K 모니터 (DP Alt Mode 신호)
- USB 오디오 인터페이스 (약 1,200MB/s)

이들 셋이 10Gbps를 두고 경합하므로 **SSD 속도가 급격히 떨어진다**. 단순히 "포트가 8개"라는 이유로 구매했다가 "인식은 되는데 느리다"는 불평으로 이어진다.

### 해결책

1. **포트 수를 줄인다**: 필요한 것만 고른다
2. **프리미엄 제품을 선택한다**: CalDigit, Plugable, Anker 등 브랜드 제품은 칩셋 품질이 높아 단순히 많은 포트를 나열한 저가 허브보다 성능이 낫다
3. **Thunderbolt 3/4 독을 고려한다**: 고대역폭 작업(영상 편집, 음악 제작)이 필요하면 더 비싸지만 성능이 확실하다

## 발열은 정상이지만 관리가 필요하다

[Plugable 공식 기술 지원](https://kb.plugable.com/usb-hubs-cables-switches/my-usb-c-hub-is-getting-warm-hot,-is-this-normal), [SLR클럽](https://www.slrclub.com/bbs/vx2.php?id=nikon_d1_forum&no=3674801), [뽐뿌 커뮤니티](https://m.ppomppu.co.kr/new/bbs_view.php?id=macintosh&no=8416) 등의 보고를 종합하면:

- 허브가 따뜻해지는 것 → 정상
- 허브가 뜨거워지는 것 → 정상 범위 상한
- **특히 DP to HDMI 컨버터 칩** → 발열 주범

### 발열 관리 팁

- **메탈(알루미늄) 하우징 제품**: 플라스틱보다 열 분산이 우수
- **장시간 사용 시 주의**: 30분 이상 사용 후 간헐적 연결 끊김 보고됨
- **통풍이 좋은 환경**: 노트북 스탠드 사용, 허브를 열린 공간에 배치

## MacBook 사용자 필수 확인사항

[Apple Support 공식](https://support.apple.com/en-us/109523)과 [Plugable 호환성 문서](https://kb.plugable.com/docking-stations-and-video/can-i-use-an-alt-mode-video-adapter-with-my-mac)에 따르면:

### MacBook의 DP Alt Mode 지원 현황

- **M1, M2, M3 MacBook Air**: DP Alt Mode 지원 ✓
- **MacBook Pro 13인치 (M1/M2/M3)**: DP Alt Mode 지원, 외부 모니터 1개만 가능 ✓
- **MacBook Pro 14인치 (M3/M3 Pro/Max)**: DP Alt Mode 지원, 다중 모니터 가능 ✓
- **MacBook Pro 16인치**: 동일 ✓

### 주의사항

"일반 USB-C 허브와 Thunderbolt 독은 다르다"는 말이 있는데, [클리앙 커뮤니티](https://www.clien.net/service/board/cm_mac/16123470)에서는 "MacBook 사용자는 Apple 정품을 사는 게 가장 무난하다"는 의견이 많다. 그 이유는 호환성 보장이 가장 확실하기 때문이다.

다만 서드파티 제품도 DP Alt Mode를 지원하는 USB-C 허브라면 문제없이 작동한다.

## Galaxy Book 및 일반 노트북 사용자

[Samsung 공식 사양](https://it.rushmac.net/1626)에 따르면:
- **Galaxy Book**: 65W USB-C PD 지원

모든 최신 Windows 노트북(ASUS, LG Gram, MSI 등)은 USB-C를 탑재하고 있으므로, 구매 전 다음을 확인한다:
1. 자신의 노트북이 **DP Alt Mode를 지원하는가?** (사양서에서 "Thunderbolt", "USB 4", "DisplayPort Alt Mode" 키워드 확인)
2. **필요한 충전 전력은?** (일반적으로 45W~100W)
3. **USB 3 속도 규격은?** (이상적으로 USB 3.1 Gen 2 이상)

## 실무 추천 체크리스트

1. **모니터 연결 계획이 있다면**: 노트북의 DP Alt Mode 지원 확인 필수
2. **4K 60Hz 모니터**: DP Alt Mode + 허브의 DP 1.3 이상 지원 필수
3. **노트북 충전**: 필요 전력의 120% 여유 있는 PD 어댑터 구매
4. **포트 선택**: "많다"보다 "필요한 것"을 우선
5. **브랜드**: CalDigit, Plugable, Anker, Elgato 등 검증된 제조사 선택
6. **발열**: 메탈 하우징 선택, 장시간 사용 시 통풍 관리
7. **고대역폭 작업**: 영상 편집·음악 제작이면 Thunderbolt 독 고려

## 참고 자료

### 공식 문서
- [Apple Support - Mac의 포트 확인](https://support.apple.com/en-us/109523)
- [BenQ - DP Alt Mode 설명](https://www.benq.com/en-us/knowledge-center/knowledge/usb-c-introduction-what-is-dp-alt-mode.html)
- [CalDigit SOHO Dock](https://www.caldigit.com/usb-c-soho-dock/)
- [Plugable 기술 지원 문서](https://kb.plugable.com/docking-stations-and-video/can-i-use-an-alt-mode-video-adapter-with-my-mac)

### 기술 분석
- [ITWorld - USB-C 허브와 모니터](https://www.itworld.co.kr/news/225144)
- [MakeUseOf - USB 허브 대역폭 공유](https://www.makeuseof.com/usb-hubs-have-a-big-limitation-shared-bandwidth/)
- [HowToGeek - USB 동글 성능 저하](https://www.howtogeek.com/your-usb-dongles-are-secretly-slowing-down-your-pc/)
- [Lention - USB-C 허브 속도 개선](https://www.lention.com/blogs/news/usb-c-hub-slowdown-fix)

### 커뮤니티 실측
- [클리앙 - MacBook 허브 선택](https://www.clien.net/service/board/cm_mac/16123470)
- [SLR클럽 - USB-C 허브 발열](https://www.slrclub.com/bbs/vx2.php?id=nikon_d1_forum&no=3674801)
