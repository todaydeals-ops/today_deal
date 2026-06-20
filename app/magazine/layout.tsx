// 매거진 섹션 레이아웃 — 단일 폰트(Noto Sans KR) + 스타일 로드.
import "./magazine.css";

export default function MagazineLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link
        href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700;800;900&display=swap"
        rel="stylesheet"
      />
      {children}
    </>
  );
}
