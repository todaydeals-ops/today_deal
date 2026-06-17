"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase/client";
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
const PENDING_CONSENT = "oneuldeal_pending_consent";

interface Display {
  loggedIn: boolean;
  label: string;
}

// 헤더 로그인.
//  - Supabase 설정 시: 실제 카카오 OAuth (signInWithOAuth)
//  - 미설정 시: mock 로그인(localStorage)
// 두 경우 모두 giveawayStore와 동기화해 응모권/레퍼럴이 동일하게 동작.
export default function AuthMenu() {
  const supabase = getSupabaseBrowser();
  const real = !!supabase;

  const [display, setDisplay] = useState<Display>({ loggedIn: false, label: "로그인" });
  const [open, setOpen] = useState(false);
  const [consent, setConsentChecked] = useState(false);

  /* ---------- 공통: mock 상태 반영 ---------- */
  function applyMock() {
    const u: MockUser = getUser();
    setConsentChecked(u.marketingConsent);
    setDisplay({
      loggedIn: u.loggedIn,
      label: u.loggedIn && u.provider ? `${PROVIDER_LABEL[u.provider]} 회원` : "로그인",
    });
  }

  useEffect(() => {
    if (!real || !supabase) {
      // mock 모드
      applyMock();
      const h = () => applyMock();
      window.addEventListener(AUTH_EVENT, h);
      return () => window.removeEventListener(AUTH_EVENT, h);
    }

    // 실 모드 (Supabase)
    let mounted = true;
    const bridge = async (session: import("@supabase/supabase-js").Session | null) => {
      if (!mounted) return;
      if (session?.user) {
        const u = session.user;
        const meta = u.user_metadata ?? {};
        const name =
          (meta.name as string) ||
          (meta.full_name as string) ||
          (meta.preferred_username as string) ||
          (u.email as string) ||
          "회원";
        setDisplay({ loggedIn: true, label: name });
        // 응모권 로직용 mock 스토어 브리지 (로그인 + 동의)
        if (!getUser().loggedIn) {
          loginMock("kakao");
          setConsent(true);
        }
        // profiles 업서트 (마케팅 동의 저장)
        try {
          const consented = window.localStorage.getItem(PENDING_CONSENT) !== "0";
          await supabase.from("profiles").upsert({
            id: u.id,
            provider: u.app_metadata?.provider ?? "kakao",
            marketing_consent: consented,
            consent_at: new Date().toISOString(),
          });
        } catch {
          // 프로필 저장 실패는 무시 (로그인 자체는 유지)
        }
      } else {
        setDisplay({ loggedIn: false, label: "로그인" });
        if (getUser().loggedIn) logoutMock();
      }
    };

    supabase.auth.getSession().then(({ data }) => bridge(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => bridge(session));
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------- 로그인 ---------- */
  async function loginKakao() {
    if (!consent) return;
    if (real && supabase) {
      window.localStorage.setItem(PENDING_CONSENT, "1");
      // Supabase가 카카오에 account_email/profile_image/profile_nickname을 요청하므로,
      // 카카오 동의항목에서 해당 항목들을 "사용"으로 설정해야 함(이메일은 비즈앱 전환 필요).
      await supabase.auth.signInWithOAuth({
        provider: "kakao",
        options: { redirectTo: window.location.origin + window.location.pathname },
      });
    } else {
      loginMock("kakao");
      setConsent(true);
      setOpen(false);
    }
  }

  function loginNaverMock() {
    if (!consent) return;
    loginMock("naver");
    setConsent(true);
    setOpen(false);
  }

  async function logout() {
    if (real && supabase) await supabase.auth.signOut();
    logoutMock();
    setOpen(false);
  }

  return (
    <div className={styles.wrap}>
      <button className={styles.trigger} onClick={() => setOpen((v) => !v)} aria-expanded={open}>
        <i className="ti ti-user" />
        <span className={styles.label}>{display.label}</span>
      </button>

      {open && (
        <div className={styles.dropdown}>
          {display.loggedIn ? (
            <>
              <p className={styles.title}>{display.label}님</p>
              <p className={styles.sub}>나눔이벤트에서 응모권을 받을 수 있어요.</p>
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
              {!real && (
                <button
                  className={`${styles.sns} ${styles.naver}`}
                  disabled={!consent}
                  onClick={loginNaverMock}
                >
                  N 네이버로 시작
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
