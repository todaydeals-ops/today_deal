import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://todaydeals.co.kr"),
  title: "오늘의딜 — 매일매일 새로운 타임딜을 한눈에",
  description:
    "지마켓·11번가·알리익스프레스 타임딜 + 쿠팡 추천딜 + 나눔이벤트를 한 곳에",
  openGraph: {
    title: "오늘의딜 — 매일매일 새로운 타임딜을 한눈에",
    description: "지마켓·11번가·알리익스프레스 타임딜 + 쿠팡 추천딜 + 나눔이벤트를 한 곳에",
    url: "https://todaydeals.co.kr",
    siteName: "오늘의딜",
    locale: "ko_KR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "오늘의딜 — 매일매일 새로운 타임딜을 한눈에",
    description: "지마켓·11번가·알리익스프레스 타임딜 + 쿠팡 추천딜 + 나눔이벤트를 한 곳에",
  },
  verification: {
    google: "8nNNGFPJ1NN0YqLNP9w26zFe9l9LpTCUh8Hsd5uMA1o",
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
      <body>{children}</body>
    </html>
  );
}
