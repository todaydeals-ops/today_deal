"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Logo from "./Logo";
import AuthMenu from "./AuthMenu";
import styles from "./Header.module.css";

// 매거진 코너 = 메인 메뉴 (사이트 정체성: 쇼핑 가이드 미디어)
const CORNERS = [
  { label: "팩트체크", corner: "factcheck" },
  { label: "스마트가이드", corner: "smartguide" },
  { label: "끝장비교", corner: "compare" },
  { label: "롱런팁", corner: "longrun" },
  { label: "트렌드랩", corner: "trendlab" },
];
// 딜 = 서브(드롭다운)
const DEALS = [
  { label: "타임딜", href: "/deals" },
  { label: "AI추천딜", href: "/recommended" },
  { label: "핫딜글", href: "/board" },
];

export default function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false); // 모바일 메뉴
  const [dealOpen, setDealOpen] = useState(false); // 딜 드롭다운
  const dropRef = useRef<HTMLDivElement>(null);
  const close = () => { setOpen(false); setDealOpen(false); };
  const dealActive = ["/deals", "/recommended", "/board"].some((p) => pathname.startsWith(p));

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

          <div className={styles.dropdown} ref={dropRef}>
            <button
              className={`${styles.dropBtn} ${dealActive ? styles.active : ""}`}
              aria-expanded={dealOpen}
              aria-haspopup="menu"
              onClick={() => setDealOpen((v) => !v)}
            >
              오늘의 딜 <i className="ti ti-chevron-down" style={{ fontSize: 15 }} />
            </button>
            <div className={`${styles.dropMenu} ${dealOpen ? styles.dropOpen : ""}`} role="menu">
              {DEALS.map((d) => (
                <Link key={d.href} href={d.href} onClick={close} role="menuitem">
                  {d.label}
                </Link>
              ))}
            </div>
          </div>

          <AuthMenu />
        </nav>
      </div>
    </header>
  );
}
