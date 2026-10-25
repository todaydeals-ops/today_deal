"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Logo from "./Logo";
import { NAV } from "@/lib/nav";
import styles from "./Header.module.css";

// 대메뉴 4개(lib/nav.ts) — 생활백과 · AS 셀프체크 · 건강·뷰티▾ · 매거진▾. 2026-10-26 재편.
// (10-21 개편으로 딜 메뉴·로그인(AuthMenu)은 폐지했다 — 핫딜 글쓰기·딜 포인트·나눔 응모가 모두 없어졌다.)
export default function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false); // 모바일 메뉴
  const [drop, setDrop] = useState<string | null>(null); // 펼친 드롭다운(데스크탑)
  const navRef = useRef<HTMLElement>(null);
  const close = () => { setOpen(false); setDrop(null); };
  const isActive = (match: string[]) => match.some((m) => pathname.startsWith(m));

  // 드롭다운 바깥 클릭 시 닫기(데스크탑)
  useEffect(() => {
    if (!drop) return;
    const onDoc = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) setDrop(null);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [drop]);

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

        <nav ref={navRef} className={`${styles.nav} ${open ? styles.navOpen : ""}`}>
          {NAV.map((g) =>
            g.href ? (
              <Link key={g.key} href={g.href} onClick={close} className={isActive(g.match) ? styles.active : ""}>
                {g.label}
                <span className={styles.dot}>.</span>
              </Link>
            ) : (
              <div key={g.key} className={styles.dropdown}>
                <button
                  className={`${styles.dropBtn} ${isActive(g.match) ? styles.active : ""}`}
                  aria-expanded={drop === g.key}
                  aria-haspopup="menu"
                  onClick={() => setDrop((v) => (v === g.key ? null : g.key))}
                >
                  {g.label} <i className="ti ti-chevron-down" style={{ fontSize: 15 }} />
                </button>
                <div className={`${styles.dropMenu} ${drop === g.key ? styles.dropOpen : ""}`} role="menu">
                  {g.items!.map((d) => (
                    <Link key={d.href} href={d.href} onClick={close} role="menuitem">
                      {d.label}
                    </Link>
                  ))}
                </div>
              </div>
            ),
          )}
        </nav>
      </div>
    </header>
  );
}
