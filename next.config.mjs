/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // 외부 쇼핑몰 이미지 도메인 (실데이터 연동 시 추가)
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
  },
  // 생활백과 항목(content/wiki/*.json)을 런타임에 읽는 경로(ISR 재생성)에 파일을 함께 싣는다.
  // 항목 페이지·허브·사이트맵은 빌드 때 구워져 필요 없지만, RSS 는 10분마다 다시 만든다.
  outputFileTracingIncludes: {
    "/magazine-rss.xml": ["./content/wiki/**/*"],
    // 홈(동적)의 생활백과 띠, 아티클(ISR)의 생활백과 역링크 — components/WikiLinks.tsx
    "/": ["./content/wiki/**/*"],
    "/magazine/[slug]": ["./content/wiki/**/*"],
  },
  // ★서브도메인 rewrite(goodsleep→/goodsleep 등)는 2026-10-17 중앙 집중 때 지웠다.
  // 연구소 홈은 이제 www/goodsleep·/pill·/beauty·/b4as·/sponsor 가 정본이고,
  // 옛 서브도메인 요청은 proxy.ts 가 rewrite 단계보다 먼저 www 로 301 한다.
};

export default nextConfig;
