"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Logo from "./Logo";
import { NAV, type NavGroup, type NavItem } from "@/lib/nav";
import styles from "./Header.module.css";

// 2026-10-27 홈페이지 리뉴얼 — 헤더(데스크톱 64px sticky) + 모바일 56px 헤더·전체화면 메뉴(M2).
// 대메뉴 4개(lib/nav.ts)는 그대로, 겉모양만 시안에 맞춘다: 링크형 내비 + 마우스를 올리면 소메뉴 패널.
// (10-21 개편으로 딜 메뉴·로그인(AuthMenu)은 폐지 — 핫딜 글쓰기·딜 포인트·나눔 응모가 없어졌다.)

// 대메뉴 라벨을 눌렀을 때 가는 곳 — 묶음 홈이 없는 메뉴는 첫 소메뉴/홈의 최신 가이드로
const topHref = (g: NavGroup): string => g.href ?? (g.key === "magazine" ? "/#guides" : g.items[0]?.href ?? "/");
// 모바일 전체 메뉴 칩 — 3단계(AS)는 9개 분류를 전부 펼친다
const flat = (g: NavGroup): NavItem[] => g.items.flatMap((it) => (it.children ? it.children : [it]));

export default function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false); // 모바일 전체 메뉴
  const [drop, setDrop] = useState<string | null>(null); // 데스크톱 소메뉴(터치·키보드용 토글)
  const navRef = useRef<HTMLElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const close = () => { setOpen(false); setDrop(null); };
  const isActive = (match: string[]) => match.some((m) => pathname.startsWith(m));

  // 데스크톱 소메뉴 바깥 클릭 시 닫기
  useEffect(() => {
    if (!drop) return;
    const onDoc = (e: MouseEvent) => { if (navRef.current && !navRef.current.contains(e.target as Node)) setDrop(null); };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [drop]);

  // 모바일 메뉴가 열리면 뒤 화면 스크롤을 막고, Esc 로 닫는다
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = prev; document.removeEventListener("keydown", onKey); };
  }, [open]);

  return (
    <>
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link href="/" className={styles.logo} aria-label="오늘의딜 홈" onClick={close}>
          <Logo />
        </Link>

        {/* 데스크톱 내비 — 라벨은 링크, 마우스를 올리거나 키보드로 들어가면 소메뉴 */}
        <nav ref={navRef} className={styles.nav} aria-label="주요 메뉴">
          {NAV.map((g) => (
            <div key={g.key} className={`${styles.dropdown} ${drop === g.key ? styles.dropOpenWrap : ""}`}>
              <Link
                href={topHref(g)}
                className={`${styles.navLink} ${isActive(g.match) ? styles.active : ""}`}
                aria-haspopup="menu"
                aria-expanded={drop === g.key}
                onClick={() => setDrop(null)}
                onKeyDown={(e) => { if (e.key === "ArrowDown") { e.preventDefault(); setDrop(g.key); } }}
              >
                {g.label}
              </Link>
              <div className={styles.dropMenu} role="menu">
                {(g.href || g.extras) && (
                  <div className={styles.dropTop}>
                    {g.href && <Link href={g.href} onClick={close} role="menuitem">{g.label} 전체 보기</Link>}
                    {g.extras?.map((e) => <Link key={e.href} href={e.href!} onClick={close} role="menuitem">{e.label}</Link>)}
                  </div>
                )}
                {g.items.some((d) => d.children) ? (
                  // 3단계(AS): 묶음 머리 + 분류 3개씩, 세 줄로 나란히
                  <div className={styles.cols}>
                    {g.items.map((col) => (
                      <div key={col.label} className={styles.col}>
                        <span className={styles.colHead}>{col.label}</span>
                        {col.children!.map((d) => (
                          <Link key={d.href} href={d.href!} onClick={close} role="menuitem">{d.label}</Link>
                        ))}
                      </div>
                    ))}
                  </div>
                ) : (
                  g.items.map((d) => <Link key={d.href} href={d.href!} onClick={close} role="menuitem">{d.label}</Link>)
                )}
              </div>
            </div>
          ))}
        </nav>

        <Link href="/partnership" className={styles.partner} onClick={close}>제휴문의</Link>

        {/* 모바일: 검색 · 메뉴 (터치 영역 44px) */}
        <div className={styles.mobileActions}>
          <button className={styles.iconBtn} aria-label="검색" onClick={() => { setOpen(true); setTimeout(() => searchRef.current?.focus(), 60); }}>
            <span className={styles.icoSearch} />
          </button>
          <button className={styles.iconBtn} aria-label="메뉴 열기" aria-expanded={open} onClick={() => setOpen(true)}>
            <span className={styles.icoBars}><i /><i /><i /></span>
          </button>
        </div>
      </div>
    </header>

      {/* M2 전체 메뉴 — 헤더(backdrop-filter)의 자식이면 position:fixed 가 뷰포트가 아니라 헤더 기준이 돼 쪼그라든다. 그래서 헤더 바깥 형제로 둔다 */}
      {open && (
        <div className={styles.sheet} role="dialog" aria-modal="true" aria-label="전체 메뉴">
          <div className={styles.sheetBar}>
            <Link href="/" className={styles.logo} aria-label="오늘의딜 홈" onClick={close}><Logo /></Link>
            <button className={styles.closeBtn} aria-label="메뉴 닫기" onClick={close}>×</button>
          </div>
          <form className={styles.sheetSearch} action="/search" method="get" role="search">
            <span className={styles.icoSearchSm} />
            <input ref={searchRef} name="q" type="search" placeholder="증상, 제품, 성분으로 찾기" aria-label="검색어" />
          </form>
          <div className={styles.sheetBody}>
            {NAV.map((g) => (
              <section key={g.key} className={styles.sheetGroup}>
                <div className={styles.sheetHead}>
                  <Link href={topHref(g)} onClick={close}>{g.label}</Link>
                  <span>{g.en}</span>
                </div>
                <div className={styles.sheetChips}>
                  {flat(g).map((d) => <Link key={d.href} href={d.href!} onClick={close}>{d.label}</Link>)}
                </div>
              </section>
            ))}
            <div className={styles.sheetFoot}>
              <Link href="/partnership" onClick={close}>제휴문의</Link>
              <Link href="/terms" onClick={close}>이용약관</Link>
              <Link href="/privacy" onClick={close}>개인정보처리방침</Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
