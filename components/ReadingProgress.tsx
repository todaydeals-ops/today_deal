"use client";

import { useEffect, useRef } from "react";

// 아티클 읽기 진행 바 — 헤더 바로 아래 3px, 폭 = scrollTop / (scrollHeight - clientHeight). 시안 아티클 화면.
// 스크롤마다 React 상태를 바꾸지 않고 DOM 폭만 직접 갱신한다(리렌더 없음).
export default function ReadingProgress() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const d = document.documentElement;
      const max = d.scrollHeight - d.clientHeight;
      el.style.width = `${max > 0 ? Math.min(100, Math.max(0, (d.scrollTop / max) * 100)) : 0}%`;
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => { window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onScroll); if (raf) cancelAnimationFrame(raf); };
  }, []);
  return (
    <div aria-hidden="true" style={{ position: "fixed", top: "var(--rn-header-h, 64px)", left: 0, right: 0, height: 3, zIndex: 19, pointerEvents: "none" }}>
      <div ref={ref} style={{ height: "100%", width: "0%", background: "var(--rn-green)", transition: "width 0.08s linear" }} />
    </div>
  );
}
