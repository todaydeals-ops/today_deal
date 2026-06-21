"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Logo from "./Logo";
import AuthMenu from "./AuthMenu";
import styles from "./Header.module.css";

const NAV = [
  { label: "오늘의 타임딜", href: "/" },
  { label: "오늘의 핫딜글", href: "/board" },
  { label: "오늘의 추천딜", href: "/recommended" },
  { label: "오늘의 나눔딜", href: "/giveaway" },
  { label: "오늘의 매거진", href: "/magazine" },
];

export default function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className={styles.header}>
      <div className={`wrap ${styles.inner}`}>
        <Link href="/" className={styles.logo} aria-label="오늘의딜 홈" onClick={() => setOpen(false)}>
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
          {NAV.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.label}
                href={item.href}
                className={active ? styles.active : undefined}
                onClick={() => setOpen(false)}
              >
                {item.label}
                <span className={styles.dot}>.</span>
              </Link>
            );
          })}
          <AuthMenu />
        </nav>
      </div>
    </header>
  );
}
