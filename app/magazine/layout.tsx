// 매거진 섹션 레이아웃 — 단일 폰트(Noto Sans KR) + 스타일 로드.
import "./magazine.css";

export default function MagazineLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css" />
      <link
        href="https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap"
        rel="stylesheet"
      />
      {children}
    </>
  );
}
