"use client";

import { useEffect, useState } from "react";
import {
  getUser,
  loginMock,
  setConsent,
  logoutMock,
  AUTH_EVENT,
  type MockUser,
} from "@/lib/giveawayStore";
import styles from "./AuthMenu.module.css";

const PROVIDER_LABEL = { kakao: "카카오", naver: "네이버" } as const;

interface Display {
  loggedIn: boolean;
  label: string;
}

// 헤더 로그인 — 커스텀 카카오 OAuth(/api/auth/*, Supabase 미경유).
//  - 카카오: 실제 OAuth (이메일 없이 닉네임·프로필만 → KOE 에러 없음)
//  - 네이버: 아직 미연동 → mock (추후 동일 방식으로 추가)
export default function AuthMenu() {
  const [display, setDisplay] = useState<Display>({ loggedIn: false, label: "로그인" });
  const [deal, setDeal] = useState<number | null>(null);
  const [open, setOpen] = useState(false);
  const [consent, setConsentChecked] = useState(false);

  function applyMock() {
    const u: MockUser = getUser();
    setConsentChecked(u.marketingConsent);
    setDisplay({
      loggedIn: u.loggedIn,
      label: u.loggedIn && u.provider ? `${PROVIDER_LABEL[u.provider]} 회원` : "로그인",
    });
  }

  useEffect(() => {
    let mounted = true;
    // 1) 서버 세션(카카오) 확인 → 있으면 giveawayStore에 브리지(응모권 로직 공유)
    (async () => {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        const data: { user?: { nickname?: string; provider?: "kakao" | "naver" } | null; deal?: number } = await res.json();
        if (!mounted) return;
        if (data.user) {
          if (!getUser().loggedIn) {
            loginMock(data.user.provider ?? "kakao");
            setConsent(true); // 로그인 동의 후 진행했으므로
          }
          setDisplay({ loggedIn: true, label: data.user.nickname || "회원" });
          if (typeof data.deal === "number") setDeal(data.deal);
          return;
        }
      } catch {
        // 세션 조회 실패 → mock 반영
      }
      if (mounted) applyMock();
    })();

    const h = () => applyMock();
    window.addEventListener(AUTH_EVENT, h);
    return () => {
      mounted = false;
      window.removeEventListener(AUTH_EVENT, h);
    };
  }, []);

  function loginKakao() {
    if (!consent) return;
    const here = window.location.pathname + window.location.search;
    window.location.href = `/api/auth/kakao/login?returnTo=${encodeURIComponent(here)}`;
  }

  function loginNaverMock() {
    if (!consent) return;
    loginMock("naver");
    setConsent(true);
    setOpen(false);
  }

  async function logout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // 무시
    }
    logoutMock();
    setOpen(false);
  }

  return (
    <div className={styles.wrap}>
      <button className={styles.trigger} onClick={() => setOpen((v) => !v)} aria-expanded={open}>
        <i className="ti ti-user" />
        <span className={styles.label}>{display.label}</span>
        {display.loggedIn && deal !== null && <span className={styles.deal}>{deal.toLocaleString("ko-KR")} Đ</span>}
      </button>

      {open && (
        <div className={styles.dropdown}>
          {display.loggedIn ? (
            <>
              <p className={styles.title}>{display.label}님</p>
              {deal !== null && (
                <p className={styles.sub}>
                  보유 딜 <strong>{deal.toLocaleString("ko-KR")} Đ</strong> · 핫딜 글·출석·공유로 모아요
                </p>
              )}
              <button className={styles.logout} onClick={logout}>
                로그아웃
              </button>
            </>
          ) : (
            <>
              <p className={styles.title}>로그인하고 나눔이벤트 응모</p>
              <label className={styles.consent}>
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsentChecked(e.target.checked)}
                />
                <span>
                  마케팅 정보 수신 동의 <em>(응모 필수·언제든 철회 가능)</em>
                </span>
              </label>
              <button
                className={`${styles.sns} ${styles.kakao}`}
                disabled={!consent}
                onClick={loginKakao}
              >
                <i className="ti ti-message-circle-2" /> 카카오로 시작
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
