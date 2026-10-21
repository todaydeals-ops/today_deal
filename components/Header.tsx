"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Logo from "./Logo";
import { BRANDS } from "@/lib/brands";
import styles from "./Header.module.css";

// 매거진 코너 = 메인 메뉴. ★2026-10-21 개편: 오늘의딜은 정보성 콘텐츠 채널 — 딜 메뉴는 폐지했다.
const CORNERS = [
  { label: "팩트체크", corner: "factcheck" },
  { label: "스마트가이드", corner: "smartguide" },
  { label: "트렌드랩", corner: "trendlab" },
];
// 분야 = 드롭다운(옛 연구소 5곳을 흡수한 분야). 예전 이 자리는 "오늘의 딜"(타임딜·AI추천딜·핫딜글) — 10-21 폐지.
const SECTIONS = BRANDS.filter((b) => b.key !== "deal").map((b) => ({ label: b.name, href: new URL(b.url).pathname }));

export default function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false); // 모바일 메뉴
  const [dealOpen, setDealOpen] = useState(false); // 분야 드롭다운
  const dropRef = useRef<HTMLDivElement>(null);
  const close = () => { setOpen(false); setDealOpen(false); };
  const dealActive = SECTIONS.some((x) => pathname.startsWith(x.href));

  // 드롭다운 바깥 클릭 시 닫기(데스크탑)
  useEffect(() => {
    if (!dealOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) setDealOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [dealOpen]);

  return (
    <header className={styles.header}>
      <div className={`wrap ${styles.inner}`}>
        <Link href="/" className={styles.logo} aria-label="오늘의딜 홈" onClick={close}>
          <Logo />
        </Link>

        <button
          className={styles.hamburger}
          aria-label="메뉴 열기"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <i className={open ? "ti ti-x" : "ti ti-menu-2"} />
        </button>

        <nav className={`${styles.nav} ${open ? styles.navOpen : ""}`}>
          {CORNERS.map((c) => (
            <Link key={c.corner} href={`/?corner=${c.corner}`} onClick={close}>
              {c.label}
              <span className={styles.dot}>.</span>
            </Link>
          ))}
          {/* 2.0 생활백과 — 읽는 글이 아니라 찾아보는 정본(content/wiki) */}
          <Link href="/wiki" onClick={close} className={pathname.startsWith("/wiki") ? styles.active : ""}>
            생활백과
            <span className={styles.dot}>.</span>
          </Link>

          <div className={styles.dropdown} ref={dropRef}>
            <button
              className={`${styles.dropBtn} ${dealActive ? styles.active : ""}`}
              aria-expanded={dealOpen}
              aria-haspopup="menu"
              onClick={() => setDealOpen((v) => !v)}
            >
              분야 <i className="ti ti-chevron-down" style={{ fontSize: 15 }} />
            </button>
            <div className={`${styles.dropMenu} ${dealOpen ? styles.dropOpen : ""}`} role="menu">
              {SECTIONS.map((d) => (
                <Link key={d.href} href={d.href} onClick={close} role="menuitem">
                  {d.label}
                </Link>
              ))}
            </div>
          </div>
          {/* 로그인(AuthMenu)은 10-21 개편으로 뺐다 — 핫딜 글쓰기·딜 포인트·나눔 응모가 모두 폐지돼 쓸 곳이 없다 */}
        </nav>
      </div>
    </header>
  );
}
