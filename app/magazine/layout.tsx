// 매거진 섹션 레이아웃 — 단일 폰트(Noto Sans KR) + 스타일 로드.
import "./magazine.css";

export default function MagazineLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link
        href="https://fonts.googleapis.com/css2?family=Inter:wght@200;400;500;600;700;800&family=Noto+Sans+KR:wght@400;500;700;800;900&family=Noto+Serif+KR:wght@400;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
        rel="stylesheet"
      />
      {children}
    </>
  );
}
