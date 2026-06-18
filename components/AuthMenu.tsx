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

interface Ledger {
  delta: number;
  reason: string;
  ref: string | null;
  created_at: string;
}

const REASON_LABEL: Record<string, string> = {
  signup: "회원가입 보너스",
  visit: "출석",
  post: "핫딜 글 게시",
  click: "딜 클릭",
  ad: "광고 시청",
  share: "공유",
  entry: "이벤트 응모",
  admin: "관리자 조정",
};
function reasonLabel(r: string): string {
  return REASON_LABEL[r] ?? r;
}
function fmtDate(iso: string): string {
  try {
    const d = new Date(iso);
    return `${d.getMonth() + 1}.${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  } catch {
    return "";
  }
}

// 헤더 로그인 — 커스텀 카카오 OAuth(/api/auth/*, Supabase 미경유).
//  - 카카오: 실제 OAuth (이메일 없이 닉네임·프로필만 → KOE 에러 없음)
//  - 네이버: 아직 미연동 → mock (추후 동일 방식으로 추가)
export default function AuthMenu() {
  const [display, setDisplay] = useState<Display>({ loggedIn: false, label: "로그인" });
  const [deal, setDeal] = useState<number | null>(null);
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<"menu" | "history">("menu");
  const [consent, setConsentChecked] = useState(false);

  // 닉네임 편집
  const [editing, setEditing] = useState(false);
  const [nickInput, setNickInput] = useState("");
  const [savingNick, setSavingNick] = useState(false);

  // 딜 내역
  const [entries, setEntries] = useState<Ledger[] | null>(null);
  const [loadingHist, setLoadingHist] = useState(false);

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
    (async () => {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        const data: { user?: { nickname?: string; provider?: "kakao" | "naver" } | null; deal?: number } = await res.json();
        if (!mounted) return;
        if (data.user) {
          if (!getUser().loggedIn) {
            loginMock(data.user.provider ?? "kakao");
            setConsent(true);
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

  async function logout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // 무시
    }
    logoutMock();
    setOpen(false);
  }

  function openMenu() {
    setView("menu");
    setEditing(false);
    setOpen((v) => !v);
  }

  async function openHistory() {
    setView("history");
    setOpen(true);
    setLoadingHist(true);
    try {
      const res = await fetch("/api/auth/deals", { cache: "no-store" });
      const d: { deal?: number; entries?: Ledger[] } = await res.json();
      if (typeof d.deal === "number") setDeal(d.deal);
      setEntries(d.entries ?? []);
    } catch {
      setEntries([]);
    } finally {
      setLoadingHist(false);
    }
  }

  function startEdit() {
    setNickInput(display.label);
    setEditing(true);
  }

  async function saveNick() {
    const n = nickInput.trim();
    if (!n || savingNick) return;
    setSavingNick(true);
    try {
      const res = await fetch("/api/auth/nickname", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname: n }),
      });
      const d: { ok?: boolean; nickname?: string } = await res.json();
      if (d.ok && d.nickname) {
        setDisplay((p) => ({ ...p, label: d.nickname as string }));
        setEditing(false);
      }
    } catch {
      // 무시
    } finally {
      setSavingNick(false);
    }
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.trigger}>
        <button className={styles.triggerMain} onClick={openMenu} aria-expanded={open}>
          <i className="ti ti-user" />
          <span className={styles.label}>{display.label}</span>
        </button>
        {display.loggedIn && deal !== null && (
          <button className={styles.deal} onClick={openHistory} aria-label="딜 내역 보기">
            {deal.toLocaleString("ko-KR")}
            <span className={styles.dealUnit}> Đ</span>
          </button>
        )}
      </div>

      {open && (
        <div className={styles.dropdown}>
          {display.loggedIn ? (
            view === "history" ? (
              <>
                <div className={styles.histHead}>
                  <button className={styles.back} onClick={() => setView("menu")} aria-label="뒤로">
                    <i className="ti ti-chevron-left" />
                  </button>
                  <strong>딜 내역</strong>
                  {deal !== null && (
                    <span className={styles.histBal}>
                      {deal.toLocaleString("ko-KR")} <span className={styles.dealUnit}>Đ</span>
                    </span>
                  )}
                </div>
                {loadingHist ? (
                  <p className={styles.sub}>불러오는 중…</p>
                ) : !entries || entries.length === 0 ? (
                  <p className={styles.sub}>아직 딜 내역이 없어요. 출석·글쓰기로 모아보세요!</p>
                ) : (
                  <ul className={styles.hist}>
                    {entries.map((e, i) => (
                      <li key={i}>
                        <span className={styles.histReason}>{reasonLabel(e.reason)}</span>
                        <span className={e.delta >= 0 ? styles.plus : styles.minus}>
                          {e.delta >= 0 ? "+" : ""}
                          {e.delta} Đ
                        </span>
                        <span className={styles.histDate}>{fmtDate(e.created_at)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            ) : (
              <>
                {editing ? (
                  <div className={styles.nickEdit}>
                    <input
                      className={styles.nickInput}
                      value={nickInput}
                      maxLength={20}
                      placeholder="닉네임"
                      autoFocus
                      onChange={(e) => setNickInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveNick();
                        if (e.key === "Escape") setEditing(false);
                      }}
                    />
                    <button className={styles.nickSave} onClick={saveNick} disabled={savingNick}>
                      {savingNick ? "저장중" : "저장"}
                    </button>
                  </div>
                ) : (
                  <p className={styles.title}>
                    {display.label}님
                    <button className={styles.editNick} onClick={startEdit} aria-label="닉네임 수정">
                      <i className="ti ti-pencil" /> 수정
                    </button>
                  </p>
                )}
                {deal !== null && (
                  <p className={styles.sub}>
                    보유 딜 <strong className={styles.dealAmt}>{deal.toLocaleString("ko-KR")}</strong>
                    <span className={styles.dealUnit}> Đ</span> ·{" "}
                    <button className={styles.linkBtn} onClick={openHistory}>
                      내역 보기
                    </button>
                  </p>
                )}
                <button className={styles.logout} onClick={logout}>
                  로그아웃
                </button>
              </>
            )
          ) : (
            <>
              <p className={styles.title}>로그인하고 나눔이벤트 응모</p>
              <label className={styles.consent}>
                <input type="checkbox" checked={consent} onChange={(e) => setConsentChecked(e.target.checked)} />
                <span>
                  마케팅 정보 수신 동의 <em>(응모 필수·언제든 철회 가능)</em>
                </span>
              </label>
              <button className={`${styles.sns} ${styles.kakao}`} disabled={!consent} onClick={loginKakao}>
                <i className="ti ti-message-circle-2" /> 카카오로 시작
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
