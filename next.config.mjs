/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // 외부 쇼핑몰 이미지 도메인 (실데이터 연동 시 추가)
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
  },
  // ★서브도메인 rewrite(goodsleep→/goodsleep 등)는 2026-10-17 중앙 집중 때 지웠다.
  // 연구소 홈은 이제 www/goodsleep·/pill·/beauty·/b4as·/sponsor 가 정본이고,
  // 옛 서브도메인 요청은 proxy.ts 가 rewrite 단계보다 먼저 www 로 301 한다.
};

export default nextConfig;
