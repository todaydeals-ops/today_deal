# 핫딜 사이트 디자인 시스템

> **방향: 소프트 뉴트럴 (Soft Neutral)**
> 크림빛 배경 · 따뜻한 큐레이션 톤 · 가격 신뢰감
> 핫딜의 "떨이판" 인상을 지우고, 큐레이션된 살림 정보처럼 보이게 한다.

---

## 1. 디자인 원칙 (Design Principles)

1. **신뢰가 곧 전환이다** — 핫딜 사이트의 핵심은 "이 가격이 진짜 싼가"에 대한 믿음. 시각적 절제로 신뢰를 만든다.
2. **가격이 주인공** — 화면에서 가장 강한 시각 요소는 항상 가격. 나머지는 배경으로 물러난다.
3. **빠른 스캔** — 사용자는 카드를 0.5초씩 훑는다. 정보 위계가 명확해야 한다.
4. **따뜻하되 가볍지 않게** — 크림 톤은 친근함을 주지만, 싸구려로 보이면 실패. 여백과 정렬로 품격을 잡는다.
5. **색을 비운다** — 경쟁사들이 색을 남발해 정신없는 것과 정반대로 간다. 포인트 컬러는 가격과 할인율에만.

---

## 2. 컬러 팔레트 (Color Tokens)

### 기본 배경 (Backgrounds)
| 토큰 | HEX | 용도 |
|---|---|---|
| `--bg-canvas` | `#FBFAF7` | 페이지 전체 배경 (크림빛) |
| `--bg-surface` | `#FFFFFF` | 카드 배경 (순백) |
| `--bg-muted` | `#F1EEE8` | 이미지 placeholder, 비활성 영역 |
| `--bg-sunken` | `#F4F1EA` | 섹션 구분 배경 |

### 텍스트 (Text)
| 토큰 | HEX | 용도 |
|---|---|---|
| `--text-strong` | `#2C2A26` | 가격, 상품명 강조 (따뜻한 먹색) |
| `--text-body` | `#6B6760` | 본문, 상품 설명 |
| `--text-muted` | `#A39C8E` | 보조 정보 (단위, 캡션) |

### 포인트 컬러 (Accents) — 절제해서 사용
| 토큰 | HEX | 용도 |
|---|---|---|
| `--accent-deal` | `#D85A30` | **할인율** (테라코타 — 따뜻한 주황) |
| `--accent-timer` | `#1D9E75` | **타이머 뱃지** (그린 — 신뢰·진행) |
| `--accent-soldout` | `#A39C8E` | 품절/마감 상태 (회색 처리) |

### 보더 (Borders)
| 토큰 | HEX | 용도 |
|---|---|---|
| `--border-soft` | `#ECE8E0` | 카드 기본 보더 |
| `--border-strong` | `#D9D3C8` | 버튼·강조 보더 |

> ⚠️ **핵심 규칙**: 빨강(#FF0000 계열)을 쓰지 않는다. 기존 핫딜 사이트의 빨강은 자극적이고 싸구려 인상을 준다. 우리는 **테라코타(#D85A30)**로 할인을 표현해 따뜻하면서도 눈에 띄게 한다.

---

## 3. 타이포그래피 (Typography)

### 폰트 패밀리
- **기본 (Body/UI)**: `Pretendard` — 한글 가독성 최고, 모던
- **숫자 강조 (Price)**: `Pretendard` SemiBold — 가격은 같은 폰트의 굵기로 강조 (별도 폰트 X, 통일성 유지)

```css
font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, sans-serif;
```

### 타입 스케일
| 역할 | 크기 | 굵기 | 비고 |
|---|---|---|---|
| 페이지 타이틀 | 22px | 600 | 섹션 헤더 |
| 가격 | 18px | 600 | 카드 핵심 |
| 할인율 | 13px | 600 | 가격 옆 |
| 상품명 | 13px | 400 | 2줄까지, 말줄임 |
| 플랫폼 라벨 | 11px | 500 | letter-spacing 0.3px |
| 보조 정보 | 11px | 400 | 타이머·캡션 |

> **굵기는 400(기본)과 600(강조) 두 가지만 사용.** 위계를 단순하게 유지한다.

---

## 4. 레이아웃 & 간격 (Layout & Spacing)

### 간격 시스템 (4px 베이스)
```
4px  · 8px · 12px · 16px · 24px · 32px · 48px
```

### 카드 그리드
- **타임딜 페이지**: 3열 세로 (지마켓 / 11번가 / 알리), 각 열에 카드 세로 스택
- **쿠팡 큐레이션**: 반응형 그리드 `repeat(auto-fit, minmax(180px, 1fr))`
- **카드 간격**: 12px (gap)

### 코너 반경 (Border Radius)
| 요소 | 값 |
|---|---|
| 카드 | 14px |
| 이미지 | 8px |
| 버튼 | 7px |
| 뱃지 | 5px |

---

## 5. 컴포넌트 — 타임딜 카드 (Deal Card)

### 구조 (6 슬롯)
```
┌─────────────────────┐
│ ① 플랫폼 라벨   타이머 │  ← 헤더
│ ┌─────────────────┐ │
│ │                 │ │
│ │   ② 상품 이미지   │ │  ← aspect-ratio 1.1
│ │                 │ │
│ └─────────────────┘ │
│ ③ 상품명 (2줄)       │
│ ④ 30% 14,980원      │  ← 할인율 + 가격
│ ┌─────────────────┐ │
│ │  ⑤ 최저가 비교   │ │  ← 버튼
│ └─────────────────┘ │
└─────────────────────┘
```

### 스펙
```css
.deal-card {
  background: var(--bg-surface);        /* #FFFFFF */
  border: 1px solid var(--border-soft); /* #ECE8E0 */
  border-radius: 14px;
  padding: 10px;
}

.deal-card__platform {
  font-size: 11px; font-weight: 500;
  color: var(--text-body);
  letter-spacing: 0.3px;
}

.deal-card__timer {
  font-size: 10px; color: #fff;
  background: var(--accent-timer);      /* #1D9E75 */
  padding: 2px 6px; border-radius: 5px;
}

.deal-card__image {
  width: 100%; aspect-ratio: 1.1;
  background: var(--bg-muted);          /* #F1EEE8 */
  border-radius: 8px;
}

.deal-card__name {
  font-size: 13px; color: var(--text-body);
  line-height: 1.4;
  display: -webkit-box; -webkit-line-clamp: 2;
  -webkit-box-orient: vertical; overflow: hidden;
}

.deal-card__discount {
  font-size: 13px; font-weight: 600;
  color: var(--accent-deal);            /* #D85A30 */
}

.deal-card__price {
  font-size: 18px; font-weight: 600;
  color: var(--text-strong);            /* #2C2A26 */
}

.deal-card__compare-btn {
  width: 100%; padding: 7px;
  font-size: 11px; font-weight: 500;
  background: #fff;
  border: 1px solid var(--border-strong); /* #D9D3C8 */
  border-radius: 7px;
  color: var(--text-strong);
}
```

### 품절/마감 상태
```css
.deal-card--soldout {
  opacity: 0.55;
}
.deal-card--soldout .deal-card__timer {
  background: var(--accent-soldout);    /* #A39C8E */
}
/* "품절" 또는 "마감" 뱃지를 이미지 위에 오버레이 */
```

---

## 6. 플랫폼 라벨 처리

> 기존 시안에서는 플랫폼마다 시그니처 색(초록/빨강/주황)을 썼으나,
> **소프트 뉴트럴 방향에서는 색을 빼고 텍스트로만 구분.**
> 브랜드 통일성 우선. 플랫폼 라벨은 모두 `--text-body` 색상으로.

```
지마켓 슈퍼딜   ·   11번가 쇼킹타임   ·   알리 타임딜
(모두 동일 스타일, 색 구분 없음)
```

---

## 7. 버튼 (Buttons)

| 종류 | 스타일 |
|---|---|
| 최저가 비교 (기본) | 흰 배경 + `--border-strong` 보더 + `--text-strong` 텍스트 |
| 최저가 비교 (hover) | 배경 `--bg-sunken`으로 전환 |
| 비활성 (품절) | opacity 0.4, 클릭 불가 |

> CTA를 과하게 강조하지 않는다. "구매 유도"가 아니라 "정보 제공" 톤을 유지해야 신뢰가 산다.

---

## 8. 푸터 — 제휴 고지 (필수)

```
이 사이트는 쿠팡 파트너스 활동의 일환으로,
이에 따른 일정액의 수수료를 제공받습니다.
```
- 위치: 푸터 상시 + 최저가 비교 결과 화면
- 스타일: `--text-muted`, 11px, `--bg-sunken` 배경 박스

---

## 9. 디자인 금지 사항 (Don'ts)

- ❌ 빨강 계열(#FF0000) 사용 금지 — 싸구려 인상
- ❌ 그라데이션·그림자 과용 금지 — 플랫하게
- ❌ 폰트 굵기 3종 이상 금지 — 400/600만
- ❌ 색을 3개 이상 포인트로 쓰지 않기 — 할인(테라코타)·타이머(그린)만
- ❌ 상품명 3줄 이상 금지 — 2줄 말줄임
- ❌ 카드에 정보 욱여넣지 않기 — 판매량·진행률 등 제거 (실시간 아님)

---

## 10. 시그니처 요소 (Signature)

이 사이트를 기억하게 만드는 한 가지:
> **"크림빛 캔버스 위, 테라코타 가격."**
> 모든 핫딜 사이트가 빨강·노랑으로 소리지를 때,
> 우리만 따뜻한 베이지 위에서 차분하게 가격을 말한다.
> 이 대비가 곧 브랜드다.
