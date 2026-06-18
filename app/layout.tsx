import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://todaydeals.co.kr"),
  title: "오늘의딜 — 지마켓·11번가·쿠팡 실시간 타임딜·오늘의 특가·최저가 모음",
  description:
    "지마켓 슈퍼딜(오픈런 타임딜), 11번가 쇼킹딜·타임딜, 쿠팡 골드박스를 한곳에 모았습니다. 매일·실시간 갱신되는 오늘의 특가·핫딜·최저가를 할인율과 마감시간으로 한눈에 비교하세요. 무료배송·반값 할인 정보까지.",
  keywords: [
    "오늘의딜",
    "타임딜",
    "오늘의 특가",
    "핫딜",
    "최저가",
    "특가 모음",
    "할인 정보",
    "오늘 뭐 사지",
    "지마켓 슈퍼딜",
    "지마켓 오픈런 타임딜",
    "11번가 쇼킹딜",
    "11번가 타임딜",
    "11번가 오늘의딜",
    "쿠팡 골드박스",
    "쿠팡 특가",
    "무료배송 특가",
    "반값 할인",
    "오늘의 쇼핑 특가",
  ],
  openGraph: {
    title: "오늘의딜 — 실시간 타임딜·오늘의 특가·최저가 모음",
    description: "지마켓·11번가·쿠팡의 실시간 타임딜과 골드박스를 한곳에. 매일 갱신되는 오늘의 특가를 할인율·마감시간으로 비교하세요.",
    url: "https://todaydeals.co.kr",
    siteName: "오늘의딜",
    locale: "ko_KR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "오늘의딜 — 실시간 타임딜·오늘의 특가 모음",
    description: "지마켓·11번가·쿠팡 실시간 타임딜과 골드박스를 한곳에. 매일 갱신.",
  },
  verification: {
    google: "8nNNGFPJ1NN0YqLNP9w26zFe9l9LpTCUh8Hsd5uMA1o",
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
                  url: "https://todaydeals.co.kr",
                  inLanguage: "ko-KR",
                  description:
                    "지마켓·11번가·쿠팡의 실시간 타임딜과 골드박스를 모은 오늘의 특가·최저가 큐레이션 사이트.",
                },
                {
                  "@type": "Organization",
                  name: "오늘의딜",
                  url: "https://todaydeals.co.kr",
                  logo: "https://todaydeals.co.kr/apple-icon.png",
                  email: "hello@todaydeals.co.kr",
                },
              ],
            }),
          }}
        />
        {children}
      </body>
    </html>
  );
}
