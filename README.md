# 오늘의딜 (Oneuldeal) — 프론트엔드

데모 시안(`oneuldeal_demo_v2.html`)을 **Next.js(App Router) + TypeScript + CSS Modules** 구조로 정리한 프로젝트입니다.
디자인·기획 근거는 [`오늘의딜_기획안.md`](오늘의딜_기획안.md), [`DESIGN_SYSTEM.md`](DESIGN_SYSTEM.md) 참조.

## 실행

```bash
npm install
npm run dev      # 개발 서버 (http://localhost:3000)
npm run build    # 프로덕션 빌드 + 타입체크
```

## 구조

```
app/
├── layout.tsx          # 루트 레이아웃 (Pretendard·Tabler 아이콘 CDN, 메타)
├── globals.css         # 디자인 토큰 (:root CSS 변수) + 공통 .wrap
├── page.tsx            # 타임딜 메인 (3열)
├── page.module.css
├── recommended/        # 추천딜 (링크인바이오식: 프로필 + 검색/필터 카드)
│   └── page.tsx
├── giveaway/           # 나눔딜 (무료나눔, 회원 DB 확보)
│   ├── page.tsx
│   └── page.module.css
├── admin/recommended/  # 추천딜 관리자 (링크 붙이면 섬네일 자동 + 수동 보정)
│   ├── page.tsx
│   └── page.module.css
└── api/og/             # 쿠팡 링크 OG 스크래핑 (SSRF 가드, 추후 파트너스 API로 교체)
    └── route.ts

components/              # 기획안 8.5 컴포넌트 구조
├── Logo.tsx            # 로고 SVG
├── Header.tsx          # 로고 + 네비 + 로그인 ("use client", 경로별 활성 표시)
├── Banner.tsx          # 배너 영역 (이미지 자율 크기)
├── Countdown.tsx       # 카운트다운 타이머 ("use client", 1초 갱신)
├── CompareButton.tsx   # 최저가 비교 (품절 시 "비슷한 상품 찾기"로 전환)
├── DealCard.tsx        # 타임딜 카드 (품절 상태 포함)
├── DealColumn.tsx      # 플랫폼별 세로 열
├── CuratedCard.tsx     # 추천딜 카드 (한줄평 노출)
├── GiveawayCard.tsx    # 나눔딜 카드 ("use client", 예정/진행/마감 상태)
└── Footer.tsx          # 제휴 고지(법적 의무) + 링크

lib/
└── types.ts            # Deal·CuratedDeal·Giveaway 타입 (DB 스키마 기반)

data/                   # 데모 mock → 추후 Supabase fetch로 교체
├── mockDeals.ts
├── mockCurated.ts
└── mockGiveaways.ts
```

## 추천딜 관리자 (`/admin/recommended`)

쿠팡 상품 링크를 붙이고 **[불러오기]** 하면 서버(`/api/og`)가 OG 메타를 긁어 섬네일·제목·가격을
자동으로 채웁니다. 쿠팡이 차단(403)하면 자동 실패 → 직접 입력으로 보정하는 하이브리드 방식.
등록분은 localStorage(`oneuldeal_curated_v1`)에 저장되어 공개 `/recommended`에 합류합니다.

> ⚠️ 쿠팡은 서버 스크래핑을 자주 막으므로, 안정적 자동화는 **쿠팡 파트너스 API** 발급 후
> `/api/og`를 교체하는 게 정답입니다 (route.ts의 TODO 참조).
> 관리자 페이지는 데모용이라 **인증이 없습니다** — 실서비스 전 로그인/권한 필수.

## 다음 단계 (구조화 범위 외)

- 추천딜: localStorage → Supabase `curated_deals` 테이블로 교체
- `/api/og` → 쿠팡 파트너스 API 연동 (키 발급 후)
- 크롤러 3종, 소셜 로그인, 나눔딜 응모/추첨 (기획안 §8 참조)

## 비고

- 카운트다운은 SSR/CSR 불일치 방지를 위해 마운트 후 클라이언트에서만 갱신합니다.
- 디자인 토큰은 `globals.css` 한 곳에서 관리하며, 빨강 금지·포인트 컬러 2개(테라코타/그린) 원칙을 따릅니다.
```
