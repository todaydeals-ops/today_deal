"use client";

import { useEffect, useState, type MouseEvent, type KeyboardEvent } from "react";
import styles from "./VoteButton.module.css";

// 좋아요(추천) — IP 1회 + 같은 브라우저 중복 방지(localStorage). 실제 추천수만 누적.
export default function VoteButton({ slug, votes, size }: { slug: string; votes: number; size?: "sm" }) {
  const [count, setCount] = useState(votes);
  const [voted, setVoted] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(`bv:${slug}`)) setVoted(true);
    } catch {
      // 무시
    }
  }, [slug]);

  async function vote(e: MouseEvent | KeyboardEvent) {
    // 목록에선 행 전체가 링크 → 클릭이 페이지 이동으로 새지 않게 차단
    e.preventDefault();
    e.stopPropagation();
    if (voted || busy) return;
    setBusy(true);
    // 낙관적 +1
    setCount((c) => c + 1);
    setVoted(true);
    try {
      localStorage.setItem(`bv:${slug}`, "1");
    } catch {
      // 무시
    }
    try {
      const res = await fetch("/api/board/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug }),
      });
      const d = await res.json();
      if (typeof d.votes === "number") setCount(d.votes); // 서버 실제값으로 보정
    } catch {
      // 네트워크 실패 — 낙관적 표시 유지
    } finally {
      setBusy(false);
    }
  }

  // <a> 안에 중첩될 수 있어 button 대신 span[role=button] 사용(중첩 인터랙티브 회피)
  return (
    <span
      role="button"
      tabIndex={0}
      className={`${styles.vote} ${voted ? styles.voted : ""} ${size === "sm" ? styles.sm : ""}`}
      onClick={vote}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") vote(e);
      }}
      aria-pressed={voted}
      aria-label="추천"
    >
      <i className="ti ti-thumb-up" /> {count.toLocaleString("ko-KR")}
    </span>
  );
}
