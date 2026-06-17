/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // 외부 쇼핑몰 이미지 도메인 (실데이터 연동 시 추가)
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
  },
};

export default nextConfig;
