"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import styles from "@/app/magazine/[slug]/article.module.css";
import { useChecklist } from "./ChecklistProvider";

// 모바일(≤760px) 하단 고정 CTA — 시안 M3. 데스크톱에서는 CSS 가 숨긴다.
//  - 체크리스트가 있는 글: [셀프체크 이어하기 2/5](안 한 첫 단계로 스크롤) + [목차]
//  - 없는 글: [목차] 버튼만
// 목차는 바텀시트로 연다(Esc·바깥 터치·닫기 버튼으로 닫힘, 열려 있는 동안 뒤 화면 스크롤 잠금, 닫으면 포커스 복귀).
export interface MobileTocItem {
  id: string;
  no: string;
  label: string;
}

export default function MobileArticleBar({ toc, firstCheckId }: { toc: MobileTocItem[]; firstCheckId: string | null }) {
  const ck = useChecklist();
  const [open, setOpen] = useState(false);
  const opener = useRef<HTMLButtonElement>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);

  const close = useCallback(() => {
    setOpen(false);
    opener.current?.focus();
  }, []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeBtn.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, close]);

  const goCheck = () => {
    if (!ck) return;
    // 안 한 첫 단계로. 다 했으면 첫 체크리스트 머리로.
    const target = ck.nextIndex >= 0 ? document.getElementById(`ck-${ck.nextIndex}`) : firstCheckId ? document.getElementById(firstCheckId) : null;
    target?.scrollIntoView({ behavior: "smooth", block: ck.nextIndex >= 0 ? "center" : "start" });
  };

  return (
    <>
      <div className={styles.mbar}>
        {ck && ck.total > 0 && (
          <button type="button" className={styles.mbarMain} onClick={goCheck}>
            {ck.nextIndex < 0 ? "셀프체크 다시 보기" : "셀프체크 이어하기"}
            <span>{ck.count}/{ck.total}</span>
          </button>
        )}
        <button
          ref={opener}
          type="button"
          className={ck && ck.total > 0 ? styles.mbarToc : styles.mbarTocWide}
          aria-haspopup="dialog"
          aria-expanded={open}
          onClick={() => setOpen(true)}
        >
          목차
        </button>
      </div>

      {open && (
        <div className={styles.sheetWrap} role="dialog" aria-modal="true" aria-label="목차">
          <button type="button" className={styles.sheetBackdrop} aria-label="목차 닫기" tabIndex={-1} onClick={close} />
          <div className={styles.sheet}>
            <div className={styles.sheetGrip} aria-hidden="true" />
            <div className={styles.sheetBar}>
              <strong>이 글의 순서</strong>
              <button ref={closeBtn} type="button" className={styles.sheetClose} aria-label="목차 닫기" onClick={close}>×</button>
            </div>
            <nav className={styles.sheetList} aria-label="이 글의 순서">
              {toc.map((t) => (
                <a key={t.id} href={`#${t.id}`} onClick={() => setOpen(false)}>
                  <span className={styles.tocNo}>{t.no}</span>
                  <span>{t.label}</span>
                </a>
              ))}
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
