"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./MobileTabBar.module.css";

// 모바일(≤760px) 하단 탭바 — 시안 M1·M4. 78px 고정, 활성 = 초록.
// 시안의 "MY" 탭은 뺐다: 이 사이트엔 로그인·마이페이지가 없다(10-21 개편으로 폐지). 그 자리에 4번째 축인 건강·뷰티를 둔다.
// 아티클 상세(M3)는 하단 고정 CTA 가 대신하므로 탭바를 숨기고, 관리자·리포트 인쇄 화면도 숨긴다.
const TABS = [
  { label: "홈", href: "/", icon: "ti-home-2", on: (p: string) => p === "/" },
  { label: "생활백과", href: "/wiki", icon: "ti-book-2", on: (p: string) => p.startsWith("/wiki") },
  { label: "셀프체크", href: "/b4as", icon: "ti-checklist", on: (p: string) => p.startsWith("/b4as") },
  { label: "건강·뷰티", href: "/goodsleep", icon: "ti-heart", on: (p: string) => p.startsWith("/goodsleep") || p.startsWith("/pill") || p.startsWith("/beauty") },
  { label: "매거진", href: "/#guides", icon: "ti-news", on: (p: string) => p.startsWith("/magazine") },
];

export default function MobileTabBar() {
  const pathname = usePathname() || "/";
  // /magazine/<slug> (아티클) · 관리자 · 구독 xml 에서는 표시하지 않는다. /magazine 자체와 리포트 목록은 표시.
  const hidden = pathname.startsWith("/admin") || /^\/magazine\/[^/]+/.test(pathname);
  if (hidden) return null;
  return (
    <>
      <div className={styles.spacer} aria-hidden="true" />
      <nav className={styles.bar} aria-label="하단 메뉴">
        {TABS.map((t) => {
          const active = t.on(pathname);
          return (
            <Link key={t.label} href={t.href} className={`${styles.tab} ${active ? styles.active : ""}`} aria-current={active ? "page" : undefined}>
              <i className={`ti ${t.icon}`} aria-hidden="true" />
              {t.label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
