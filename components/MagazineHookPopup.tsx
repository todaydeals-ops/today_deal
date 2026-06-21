"use client";

// 딜 사이트 → 매거진 후킹 토스트. 호기심 질문 1개를 비침투적으로 띄워 매거진으로 유도.
// 세션당 1회, 6초 후 등장, /magazine·/admin 에선 숨김.
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type Hook = { slug: string; corner: string; hook: string };
const SEEN_KEY = "mz_hook_seen_v1";

export default function MagazineHookPopup() {
  const pathname = usePathname();
  const [item, setItem] = useState<Hook | null>(null);
  const [visible, setVisible] = useState(false);

  const hidden = !!pathname && (pathname.startsWith("/magazine") || pathname.startsWith("/admin"));

  useEffect(() => {
    if (hidden || typeof window === "undefined") return;
    try {
      if (sessionStorage.getItem(SEEN_KEY)) return;
    } catch {
      /* ignore */
    }
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    (async () => {
      try {
        const r = await fetch("/api/magazine/hooks");
        if (!r.ok) return;
        const { items } = (await r.json()) as { items: Hook[] };
        if (cancelled || !items?.length) return;
        setItem(items[Math.floor(Math.random() * items.length)]);
        timer = setTimeout(() => {
          setVisible(true);
          try {
            sessionStorage.setItem(SEEN_KEY, "1"); // 세션당 1회
          } catch {
            /* ignore */
          }
        }, 6000);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [hidden]);

  if (hidden || !item) return null;

  return (
    <div
      aria-hidden={!visible}
      style={{
        position: "fixed",
        zIndex: 60,
        right: 20,
        bottom: 20,
        transform: visible ? "translateY(0)" : "translateY(140%)",
        opacity: visible ? 1 : 0,
        transition: "transform .45s cubic-bezier(.22,1,.36,1), opacity .35s ease",
        pointerEvents: visible ? "auto" : "none",
      }}
    >
      <div
        style={{
          width: 320,
          maxWidth: "calc(100vw - 24px)",
          background: "#fff",
          border: "1px solid #ece8e0",
          borderRadius: 16,
          boxShadow: "0 12px 36px rgba(40,30,15,0.16)",
          padding: "16px 18px 17px",
          position: "relative",
        }}
      >
        <button
          onClick={() => setVisible(false)}
          aria-label="닫기"
          style={{ position: "absolute", top: 8, right: 9, width: 28, height: 28, border: "none", background: "transparent", color: "#a39c8e", cursor: "pointer", fontSize: 16, lineHeight: 1 }}
        >
          ✕
        </button>
        <Link href={`/magazine/${item.slug}`} onClick={() => setVisible(false)} style={{ display: "block", textDecoration: "none" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 700, letterSpacing: ".3px", color: "#d85a30" }}>
            <span style={{ width: 6, height: 6, borderRadius: 9999, background: "#d85a30" }} />
            오늘의딜 매거진
          </div>
          <div style={{ fontSize: 15.5, fontWeight: 700, lineHeight: 1.5, color: "#2c2a26", margin: "9px 0 0", paddingRight: 16 }}>{item.hook}</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#d85a30", marginTop: 12, display: "inline-flex", alignItems: "center", gap: 6 }}>
            궁금하면 클릭 <span aria-hidden>→</span>
          </div>
        </Link>
      </div>
    </div>
  );
}
