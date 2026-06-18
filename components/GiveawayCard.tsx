"use client";

import { useCallback, useEffect, useState } from "react";
import type { Giveaway } from "@/lib/types";
import { AUTH_EVENT } from "@/lib/giveawayStore";
import EntryMission from "./EntryMission";
import styles from "./GiveawayCard.module.css";

interface GiveawayCardProps {
  giveaway: Giveaway;
}

type Status = "upcoming" | "open" | "closed";
interface Winner {
  id: string;
  name: string;
  entries: number;
}
interface DrawResult {
  winners: Winner[];
  poolSize: number;
  drawnAt: string;
}

function getStatus(startMs: number, endMs: number, nowMs: number): Status {
  if (nowMs < startMs) return "upcoming";
  if (nowMs > endMs) return "closed";
  return "open";
}

const STATUS_LABEL: Record<Status, string> = { upcoming: "오픈 예정", open: "응모 중", closed: "마감" };
const BADGE_CLASS: Record<Status, string> = {
  upcoming: styles.upcoming,
  open: styles.open,
  closed: styles.closedBadge,
};

function dday(targetMs: number, nowMs: number) {
  const days = Math.ceil((targetMs - nowMs) / (24 * 60 * 60 * 1000));
  if (days > 0) return `D-${days}`;
  if (days === 0) return "D-DAY";
  return "";
}

export default function GiveawayCard({ giveaway }: GiveawayCardProps) {
  const { title, prizeName, prizeImage, description, startAt, endAt, winnerCount, affiliateUrl } = giveaway;

  const [status, setStatus] = useState<Status | null>(null);
  const [ddayText, setDdayText] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [myEntries, setMyEntries] = useState(0);
  const [myId, setMyId] = useState<string | null>(null);
  const [result, setResult] = useState<DrawResult | null>(null);

  useEffect(() => {
    const startMs = new Date(startAt).getTime();
    const endMs = new Date(endAt).getTime();
    const now = Date.now();
    const s = getStatus(startMs, endMs, now);
    setStatus(s);
    setDdayText(s === "upcoming" ? dday(startMs, now) : s === "open" ? dday(endMs, now) : "");
  }, [startAt, endAt]);

  const refresh = useCallback(async () => {
    try {
      const [e, r] = await Promise.all([
        fetch(`/api/giveaway/entry?gid=${encodeURIComponent(giveaway.id)}`, { cache: "no-store" }).then((x) => x.json()),
        fetch(`/api/giveaway/results?gid=${encodeURIComponent(giveaway.id)}`, { cache: "no-store" }).then((x) => x.json()),
      ]);
      if (e.ok) {
        setMyEntries(e.entry?.total ?? 0);
        setMyId(e.loggedIn ? e.userId ?? null : null);
      }
      if (r.ok) setResult(r.result);
    } catch {
      // 무시
    }
  }, [giveaway.id]);

  useEffect(() => {
    refresh();
    const h = () => refresh();
    window.addEventListener(AUTH_EVENT, h);
    return () => window.removeEventListener(AUTH_EVENT, h);
  }, [refresh]);

  const isOpen = status === "open";
  const entered = myEntries > 0;
  const iWon = !!(result && myId && result.winners.some((w) => w.id === myId));

  return (
    <article className={`${styles.card} ${status === "closed" ? styles.closed : ""}`}>
      <div className={styles.imgWrap}>
        <div className={styles.img}>
          {prizeImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={prizeImage} alt={prizeName} loading="lazy" decoding="async" />
          ) : (
            <i className="ti ti-gift" />
          )}
        </div>
        {status && (
          <span className={`${styles.badge} ${BADGE_CLASS[status]}`}>
            {STATUS_LABEL[status]}
            {ddayText && <em>{ddayText}</em>}
          </span>
        )}
      </div>

      <div className={styles.body}>
        <span className={styles.title}>{title}</span>
        <h3 className={styles.prize}>{prizeName}</h3>
        {description && <p className={styles.desc}>{description}</p>}
        {affiliateUrl && (
          <a className={styles.buyLink} href={affiliateUrl} target="_blank" rel="noopener noreferrer sponsored">
            이 경품 쿠팡에서 보기 <i className="ti ti-chevron-right" />
          </a>
        )}

        <div className={styles.meta}>
          <span>
            <i className="ti ti-users" /> {winnerCount}명 추첨
          </span>
          {result && (
            <span>
              <i className="ti ti-checkbox" /> {result.poolSize.toLocaleString("ko-KR")}명 응모
            </span>
          )}
        </div>

        {result ? (
          <div className={styles.result}>
            <div className={styles.resultHead}>
              <i className="ti ti-confetti" /> 당첨자 발표
            </div>
            <div className={styles.winnerNames}>
              {result.winners.map((w) => (
                <span key={w.id} className={w.id === myId ? styles.meTag : ""}>
                  {w.id === myId ? "🎉 나" : w.name}
                </span>
              ))}
            </div>
            {iWon && <p className={styles.congrats}>축하해요! 당첨되셨어요 🎁</p>}
          </div>
        ) : (
          <>
            <button className={styles.btn} disabled={!isOpen} onClick={() => isOpen && setModalOpen(true)}>
              {status === "upcoming" && "오픈 알림 받기"}
              {status === "open" && "응모하기"}
              {status === "closed" && "응모 마감"}
              {status === null && "응모하기"}
            </button>
            <p className={styles.condition}>
              {entered
                ? `내 응모권 ${myEntries}개 · 0·6·12·18시·광고로 추가`
                : "로그인하고 시간대마다 응모권 받기"}
            </p>
          </>
        )}
      </div>

      {modalOpen && (
        <EntryMission giveaway={giveaway} onClose={() => setModalOpen(false)} onChange={refresh} />
      )}
    </article>
  );
}
