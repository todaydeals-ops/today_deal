"use client";

// 상호연결 토스트 — 메인(오늘의딜) ↔ 잠자리연구소 교차 유도.
// goodsleep에선 오늘의딜을, 그 외에선 잠자리연구소를 비침투적으로 안내. 세션당 1회, 6초 후, /magazine·/admin 숨김.
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

const SEEN_KEY = "xpromo_seen_v1";
type Promo = { label: string; hook: string; href: string; color: string };

export default function MagazineHookPopup() {
  const pathname = usePathname();
  const [promo, setPromo] = useState<Promo | null>(null);
  const [visible, setVisible] = useState(false);

  const hidden = !!pathname && (pathname.startsWith("/magazine") || pathname.startsWith("/admin"));

  useEffect(() => {
    if (hidden || typeof window === "undefined") return;
    try {
      if (sessionStorage.getItem(SEEN_KEY)) return;
    } catch {
      /* ignore */
    }
    const host = window.location.hostname.toLowerCase();
    const onSleep = host.startsWith("goodsleep") || window.location.pathname.startsWith("/goodsleep");
    setPromo(
      onSleep
        ? { label: "오늘의딜", hook: "가전·리빙·디지털, 살 때 뭘 봐야 할까. 광고 없는 구매 기준.", href: "https://www.todaydeals.co.kr", color: "#d85a30" }
        : { label: "잠자리연구소", hook: "잠 못 자는 진짜 이유, 논문 근거로 확인해보세요.", href: "https://goodsleep.todaydeals.co.kr", color: "#3f5a54" }
    );
    const timer = setTimeout(() => {
      setVisible(true);
      try {
        sessionStorage.setItem(SEEN_KEY, "1");
      } catch {
        /* ignore */
      }
    }, 6000);
    return () => clearTimeout(timer);
  }, [hidden]);

  if (hidden || !promo) return null;

  return (
    <div
      aria-hidden={!visible}
      style={{
        position: "fixed", zIndex: 60, right: 20, bottom: 20,
        transform: visible ? "translateY(0)" : "translateY(140%)",
        opacity: visible ? 1 : 0,
        transition: "transform .45s cubic-bezier(.22,1,.36,1), opacity .35s ease",
        pointerEvents: visible ? "auto" : "none",
      }}
    >
      <div style={{ width: 320, maxWidth: "calc(100vw - 24px)", background: "#fff", border: "1px solid #ece8e0", borderRadius: 16, boxShadow: "0 12px 36px rgba(40,30,15,0.16)", padding: "16px 18px 17px", position: "relative" }}>
        <button
          onClick={() => setVisible(false)}
          aria-label="닫기"
          style={{ position: "absolute", top: 8, right: 9, width: 28, height: 28, border: "none", background: "transparent", color: "#a39c8e", cursor: "pointer", fontSize: 16, lineHeight: 1 }}
        >
          ✕
        </button>
        <a href={promo.href} onClick={() => setVisible(false)} style={{ display: "block", textDecoration: "none" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 700, letterSpacing: ".3px", color: promo.color }}>
            <span style={{ width: 6, height: 6, borderRadius: 9999, background: promo.color }} />
            {promo.label}
          </div>
          <div style={{ fontSize: 15.5, fontWeight: 700, lineHeight: 1.5, color: "#2c2a26", margin: "9px 0 0", paddingRight: 16 }}>{promo.hook}</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: promo.color, marginTop: 12, display: "inline-flex", alignItems: "center", gap: 6 }}>
            보러 가기 <span aria-hidden>→</span>
          </div>
        </a>
      </div>
    </div>
  );
}
