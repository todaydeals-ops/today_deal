/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // 외부 쇼핑몰 이미지 도메인 (실데이터 연동 시 추가)
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
  },
  // 서브도메인 라우팅: goodsleep.todaydeals.co.kr 루트 → /goodsleep(잠자리연구소)
  async rewrites() {
    return [
      {
        source: "/",
        has: [{ type: "host", value: "goodsleep.todaydeals.co.kr" }],
        destination: "/goodsleep",
      },
    ];
  },
};

export default nextConfig;
