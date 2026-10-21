import type { Metadata } from "next";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import { GoogleAnalytics } from "@next/third-parties/google";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.todaydeals.co.kr"),
  // ★2026-10-21 개편: 오늘의딜은 딜 모음이 아니라 정보성 콘텐츠 채널이다(타임딜·추천딜·핫딜글 폐지).
  title: "오늘의딜 — 사기 전에, 고치기 전에 찾아보는 생활 정보",
  description:
    "가전·리빙·디지털 고르는 법부터 수면·영양제·뷰티 성분 근거, 고장 났을 때 기사님 부르기 전 셀프체크, 세일 일정과 영상 속 그 제품까지. 출처를 붙여 정리한 생활 정보 매거진과 생활백과입니다.",
  keywords: [
    "오늘의딜",
    "생활백과",
    "가전 고르는 법",
    "에러코드",
    "AS 셀프체크",
    "영양제 성분",
    "수면 습관",
    "화장품 성분",
    "세일 일정",
    "영상 속 제품",
  ],
  alternates: {
    types: { "application/rss+xml": "https://www.todaydeals.co.kr/magazine-rss.xml" },
  },
  openGraph: {
    title: "오늘의딜 — 사기 전에, 고치기 전에 찾아보는 생활 정보",
    description: "고르는 법·성분 근거·고장 셀프체크·세일 일정·영상 속 그 제품까지, 출처를 붙여 정리한 생활 정보 채널.",
    url: "https://www.todaydeals.co.kr",
    siteName: "오늘의딜",
    locale: "ko_KR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "오늘의딜 — 사기 전에, 고치기 전에 찾아보는 생활 정보",
    description: "고르는 법·성분 근거·고장 셀프체크·세일 일정, 출처를 붙여 정리한 생활 정보 채널.",
  },
  verification: {
    google: ["8nNNGFPJ1NN0YqLNP9w26zFe9l9LpTCUh8Hsd5uMA1o", "qUzhTm_1fKMVc5xBmE1gTeWexMgJqq_joWBlCY-v0_c"],
    // 네이버 서치어드바이저 소유확인
    other: { "naver-site-verification": "2b2a15f8d8c623b658382ebdced2a6c6855ffbc5" },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <head>
        {/* 폰트·아이콘 CDN 연결 미리 열기 (LCP 단축) */}
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://cdn.jsdelivr.net" />
        <link
          rel="stylesheet"
          as="style"
          crossOrigin="anonymous"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css"
        />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@3.2.0/dist/tabler-icons.min.css"
        />
      </head>
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "WebSite",
                  name: "오늘의딜",
                  alternateName: "todaydeals",
                  url: "https://www.todaydeals.co.kr",
                  inLanguage: "ko-KR",
                  description:
                    "사기 전에, 고치기 전에 찾아보는 생활 정보 채널. 매거진(가전·리빙·디지털·수면·영양제·뷰티 성분·AS 셀프체크·방송 협찬)과 생활백과를 출처와 함께 냅니다.",
                },
                {
                  "@type": "Organization",
                  name: "오늘의딜",
                  url: "https://www.todaydeals.co.kr",
                  logo: "https://www.todaydeals.co.kr/apple-icon.png",
                  email: "hello@todaydeals.co.kr",
                },
              ],
            }),
          }}
        />
        {children}
        {/* 브랜드 교차유도 팝업(MagazineHookPopup)은 10-21 개편으로 뺐다 — 연구소가 오늘의딜 분야로 흡수돼 서로 홍보할 별도 브랜드가 없다 */}
        <Analytics />
        <GoogleAnalytics gaId="G-0D58JNRETR" />
      </body>
    </html>
  );
}
