"use client";
// 상호연결 토스트 — 패밀리 5개 미디어를 서로 안내한다.
// 지금 보고 있는 브랜드만 빼고 **랜덤으로 하나**를 뽑는다(예전엔 잠자리연구소로 고정이었다).
// 세션당 1회, 6초 후 노출, /magazine·/admin에서는 숨김.
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { BRANDS, brandKeyFromHost, type Brand } from "@/lib/brands";

const SEEN_KEY = "xpromo_seen_v1";

export default function MagazineHookPopup() {
  const pathname = usePathname();
  const [promo, setPromo] = useState<Brand | null>(null);
  const [visible, setVisible] = useState(false);

  const hidden = !!pathname && (pathname.startsWith("/magazine") || pathname.startsWith("/admin"));

  useEffect(() => {
    if (hidden || typeof window === "undefined") return;
    try {
      if (sessionStorage.getItem(SEEN_KEY)) return;
    } catch {
      /* ignore */
    }

    // 서브도메인이 안 붙은 경로 접근(www/pill 등)도 함께 본다.
    const path = window.location.pathname;
    const pathKey = path.startsWith("/goodsleep") ? "sleep" : path.startsWith("/pill") ? "pill" : path.startsWith("/beauty") ? "beauty" : path.startsWith("/b4as") ? "b4as" : null;
    const current = pathKey ?? brandKeyFromHost(window.location.hostname);

    const pool = BRANDS.filter((b) => b.key !== current);
    if (!pool.length) return;
    setPromo(pool[Math.floor(Math.random() * pool.length)]);

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
        <a href={promo.url} onClick={() => setVisible(false)} style={{ display: "block", textDecoration: "none" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 700, letterSpacing: ".3px", color: promo.color }}>
            <span style={{ width: 6, height: 6, borderRadius: 9999, background: promo.color }} />
            {promo.name}
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
