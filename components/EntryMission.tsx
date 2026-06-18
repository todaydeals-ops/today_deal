"use client";

import { useCallback, useEffect, useState } from "react";
import type { Giveaway } from "@/lib/types";
import {
  AD_ENTRY_CAP,
  REF_ENTRY_CAP,
  VISIT_DAILY_CAP,
  AUTH_EVENT,
  getUser,
  getEntry,
  getRefCode,
  loginMock,
  setConsent,
  claimVisit,
  addAdEntry,
  addRefChannel,
  totalEntries,
  visitEligibility,
  canEnter,
  type MockUser,
  type EntryState,
  type VisitEligibility,
} from "@/lib/giveawayStore";
import { adAdapter } from "@/lib/adAdapter";
import styles from "./EntryMission.module.css";

interface EntryMissionProps {
  giveaway: Giveaway;
  onClose: () => void;
  onChange?: () => void;
}

function fmtRemaining(ms: number) {
  const m = Math.max(0, Math.ceil(ms / 60000));
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return h > 0 ? `${h}시간 ${mm}분` : `${mm}분`;
}

// 공유 채널 버튼 (key는 giveawayStore의 SHARE_CHANNELS와 일치)
const SHARE_BTNS = [
  { key: "share", label: "공유", icon: "ti-share-2" },
  { key: "x", label: "X", icon: "ti-brand-x" },
  { key: "facebook", label: "페이스북", icon: "ti-brand-facebook" },
  { key: "line", label: "라인", icon: "ti-brand-line" },
  { key: "copy", label: "링크복사", icon: "ti-link" },
];

export default function EntryMission({ giveaway, onClose, onChange }: EntryMissionProps) {
  const [user, setUser] = useState<MockUser>({ loggedIn: false, marketingConsent: false });
  const [entry, setEntry] = useState<EntryState | null>(null);
  const [elig, setElig] = useState<VisitEligibility | null>(null);
  const [consent, setConsentChecked] = useState(false);

  const [adPlaying, setAdPlaying] = useState(false);
  const [adRemaining, setAdRemaining] = useState(0);
  const [message, setMessage] = useState<string | null>(null);

  const refresh = useCallback(() => {
    const u = getUser();
    setUser(u);
    setConsentChecked(u.marketingConsent);
    setEntry(getEntry(giveaway.id));
    setElig(visitEligibility(giveaway.id));
    onChange?.();
  }, [giveaway.id, onChange]);

  useEffect(() => {
    refresh();
    const h = () => refresh();
    window.addEventListener(AUTH_EVENT, h);
    return () => window.removeEventListener(AUTH_EVENT, h);
  }, [refresh]);

  function handleLogin(provider: "kakao" | "naver") {
    if (!consent) {
      setMessage("마케팅 수신에 동의해야 응모할 수 있어요.");
      return;
    }
    if (provider === "kakao") {
      setConsent(true); // 돌아왔을 때 동의 유지 (localStorage)
      const here = window.location.pathname + window.location.search;
      window.location.href = `/api/auth/kakao/login?returnTo=${encodeURIComponent(here)}`;
      return;
    }
    // 네이버: 아직 미연동 → mock
    loginMock(provider);
    setConsent(true); // 이벤트 → refresh
    setMessage("✓ 로그인 완료! 응모하기를 눌러 응모권을 받으세요.");
  }

  function handleClaimVisit() {
    if (!elig?.ok) return;
    claimVisit(giveaway.id); // 이벤트 → refresh
    setMessage("✓ 방문 응모권 +1! 다음 시간대(0·6·12·18시)에 또 받을 수 있어요.");
  }

  async function handleWatchAd() {
    if (!entry || entry.adEntries >= AD_ENTRY_CAP || adPlaying) return;
    setMessage(null);
    setAdPlaying(true);
    try {
      const result = await adAdapter.showRewarded((sec) => setAdRemaining(sec));
      if (result.completed) {
        const next = addAdEntry(giveaway.id); // 이벤트 → refresh
        setMessage(`✓ 응모권 +1! (광고 추가 ${next.adEntries}/${AD_ENTRY_CAP})`);
      } else {
        setMessage("광고를 끝까지 봐야 응모권이 지급돼요.");
      }
    } finally {
      setAdPlaying(false);
    }
  }

  async function handleShareChannel(channel: string) {
    if (!entry || entry.refChannels.includes(channel)) return;
    const link = `${window.location.origin}/giveaway?ref=${getRefCode()}`;
    const text = `${giveaway.prizeName} 나눔 중! 같이 응모해요 🎁`;
    const u = encodeURIComponent(link);
    const t = encodeURIComponent(text);
    try {
      if (channel === "share") {
        if (typeof navigator.share === "function") {
          await navigator.share({ title: "오늘의딜 나눔이벤트", text, url: link }); // 취소 시 reject
        } else {
          await navigator.clipboard.writeText(link);
        }
      } else if (channel === "copy") {
        await navigator.clipboard.writeText(link);
      } else {
        const urls: Record<string, string> = {
          x: `https://twitter.com/intent/tweet?text=${t}&url=${u}`,
          facebook: `https://www.facebook.com/sharer/sharer.php?u=${u}`,
          line: `https://social-plugins.line.me/lineit/share?url=${u}`,
        };
        window.open(urls[channel], "_blank", "noopener,noreferrer,width=600,height=640");
      }
      const next = addRefChannel(giveaway.id, channel); // 이벤트 → refresh
      setMessage(`✓ 공유 응모권 +1! (친구 추천 ${next.refChannels.length}/${REF_ENTRY_CAP})`);
    } catch {
      // 공유 취소 — 응모권 미지급
    }
  }

  const total = entry ? totalEntries(entry) : 0;
  const loggedIn = canEnter(user);
  const visitUsed = VISIT_DAILY_CAP - (elig?.remainingToday ?? VISIT_DAILY_CAP);
  const adMaxed = !!entry && entry.adEntries >= AD_ENTRY_CAP;
  const refChannels = entry?.refChannels ?? [];
  const refMaxed = refChannels.length >= REF_ENTRY_CAP;

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.close} onClick={onClose} aria-label="닫기">
          <i className="ti ti-x" />
        </button>

        <span className={styles.kicker}>오늘의딜 나눔이벤트 응모</span>
        <h3 className={styles.prize}>{giveaway.prizeName}</h3>

        <div className={styles.entryBadge}>
          <i className="ti ti-ticket" />
          현재 내 응모권 <strong>{total}</strong>개
        </div>

        {/* STEP 1 — 방문(로그인) 응모권 */}
        <div className={styles.step}>
          <div className={styles.stepHead}>
            <span className={styles.stepNo}>1</span>
            <span className={styles.stepTitle}>방문 응모 (0·6·12·18시)</span>
            <span className={styles.stepReward}>
              {loggedIn ? `오늘 ${visitUsed}/${VISIT_DAILY_CAP}` : "+1"}
            </span>
          </div>

          {!loggedIn ? (
            <div className={styles.loginBox}>
              <label className={styles.consent}>
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsentChecked(e.target.checked)}
                />
                <span>
                  마케팅 정보 수신 동의 <em>(응모 필수)</em>
                </span>
              </label>
              <div className={styles.loginRow}>
                <button
                  className={`${styles.snsBtn} ${styles.kakao}`}
                  disabled={!consent}
                  onClick={() => handleLogin("kakao")}
                >
                  <i className="ti ti-message-circle-2" /> 카카오로 시작
                </button>
                <button
                  className={`${styles.snsBtn} ${styles.naver}`}
                  disabled={!consent}
                  onClick={() => handleLogin("naver")}
                >
                  N 네이버로 시작
                </button>
              </div>
            </div>
          ) : elig?.ok ? (
            <button className={styles.primaryBtn} onClick={handleClaimVisit}>
              응모하기 <span className={styles.plus}>+1</span>
            </button>
          ) : elig?.reason === "cooldown" ? (
            <button className={styles.waitBtn} disabled>
              다음 응모까지 {fmtRemaining((elig.nextClaimAt ?? 0) - Date.now())}
            </button>
          ) : (
            <button className={styles.waitBtn} disabled>
              오늘 방문 응모 완료 ({VISIT_DAILY_CAP}/{VISIT_DAILY_CAP})
            </button>
          )}
        </div>

        {/* STEP 2 — 광고 응모권 */}
        <div className={`${styles.step} ${!loggedIn ? styles.locked : ""}`}>
          <div className={styles.stepHead}>
            <span className={styles.stepNo}>2</span>
            <span className={styles.stepTitle}>광고 보고 응모권 추가</span>
            <span className={styles.stepReward}>
              {entry?.adEntries ?? 0}/{AD_ENTRY_CAP}
            </span>
          </div>

          {!loggedIn ? (
            <p className={styles.lockedText}>로그인 후 열려요.</p>
          ) : adMaxed ? (
            <p className={styles.stepDoneText}>추가 응모권을 모두 받았어요 🎉</p>
          ) : (
            <button className={styles.adBtn} onClick={handleWatchAd} disabled={adPlaying}>
              <i className="ti ti-player-play" />
              광고 보고 응모권 +1
            </button>
          )}
        </div>

        {/* STEP 3 — 친구 공유(레퍼럴) 응모권 — 채널별 1회 */}
        <div className={`${styles.step} ${!loggedIn ? styles.locked : ""}`}>
          <div className={styles.stepHead}>
            <span className={styles.stepNo}>3</span>
            <span className={styles.stepTitle}>SNS 공유하고 응모권 추가</span>
            <span className={styles.stepReward}>
              {refChannels.length}/{REF_ENTRY_CAP}
            </span>
          </div>

          {!loggedIn ? (
            <p className={styles.lockedText}>로그인 후 열려요.</p>
          ) : refMaxed ? (
            <p className={styles.stepDoneText}>모든 채널 공유 완료 🎉</p>
          ) : (
            <>
              <div className={styles.shareGrid}>
                {SHARE_BTNS.map((c) => {
                  const used = refChannels.includes(c.key);
                  return (
                    <button
                      key={c.key}
                      className={`${styles.shareChip} ${used ? styles.shareUsed : ""}`}
                      onClick={() => handleShareChannel(c.key)}
                      disabled={used}
                    >
                      <i className={`ti ${used ? "ti-check" : c.icon}`} />
                      {c.label}
                    </button>
                  );
                })}
              </div>
              <p className={styles.shareHint}>채널마다 1회씩, 공유만 해도 응모권을 드려요.</p>
            </>
          )}
        </div>

        {message && <p className={styles.message}>{message}</p>}

        <p className={styles.note}>
          로그인하면 0·6·12·18시 시간대마다(하루 최대 {VISIT_DAILY_CAP}회) 방문 응모권을 받고, 광고
          시청·친구 초대로 추가로 받을 수 있어요. 추첨은 응모권 수에 비례합니다.
        </p>

        {adPlaying && (
          <div className={styles.adOverlay}>
            <span className={styles.adTag}>광고</span>
            <div className={styles.adScreen}>
              <i className="ti ti-movie" />
              <p>광고 재생 중…</p>
              <span className={styles.adTimer}>{adRemaining}초</span>
            </div>
            <p className={styles.adHint}>끝까지 보면 응모권이 지급돼요</p>
          </div>
        )}
      </div>
    </div>
  );
}
