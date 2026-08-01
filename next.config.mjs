/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // 외부 쇼핑몰 이미지 도메인 (실데이터 연동 시 추가)
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
  },
  // 서브도메인 라우팅: goodsleep.todaydeals.co.kr 루트 → /goodsleep(잠자리연구소)
  // ★ beforeFiles 필수 — afterFiles면 "/"가 이미 app/page.tsx(메인)로 처리돼 rewrite가 안 먹음.
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: "/",
          has: [{ type: "host", value: "goodsleep.todaydeals.co.kr" }],
          destination: "/goodsleep",
        },
      ],
    };
  },
};

export default nextConfig;
