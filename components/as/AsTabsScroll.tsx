"use client";

import { useEffect, useRef, type ReactNode } from "react";

// AS 셀프체크 목록의 분류 탭 줄 — 데스크톱에서 폭이 모자라 가로로 스크롤될 때, 지금 고른 탭이 화면 가운데 오게 맞춘다.
// (탭은 전부 서버가 그리는 <a> 링크다. 이 컴포넌트는 스크롤 위치만 만진다.)
// scrollIntoView 는 쓰지 않는다 — 세로 스크롤까지 움직여 페이지가 튄다. 이 줄의 scrollLeft 만 직접 바꾼다.
export default function AsTabsScroll({ className, label, children }: { className?: string; label: string; children: ReactNode }) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const row = ref.current;
    if (!row || row.scrollWidth <= row.clientWidth) return;
    const on = row.querySelector<HTMLElement>('[aria-current="page"]');
    if (!on) return;
    const offset = on.getBoundingClientRect().left - row.getBoundingClientRect().left + row.scrollLeft;
    row.scrollLeft = Math.max(0, offset - (row.clientWidth - on.offsetWidth) / 2);
  }, []);

  return <nav ref={ref} className={className} aria-label={label}>{children}</nav>;
}
