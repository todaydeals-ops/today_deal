import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "오늘의딜 — 매일매일 새로운 타임딜을 한눈에",
  description:
    "지마켓·11번가·알리익스프레스의 타임딜을 한 곳에 모아 보여주는 핫딜 큐레이션 플랫폼",
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
