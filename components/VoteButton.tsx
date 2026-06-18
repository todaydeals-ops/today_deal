"use client";

import { useEffect, useState } from "react";
import styles from "./VoteButton.module.css";

// 좋아요(추천) — IP 1회 + 같은 브라우저 중복 방지(localStorage). 실제 추천수만 누적.
export default function VoteButton({ slug, votes }: { slug: string; votes: number }) {
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

  async function vote() {
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

  return (
    <button
      type="button"
      className={`${styles.vote} ${voted ? styles.voted : ""}`}
      onClick={vote}
      disabled={voted || busy}
      aria-pressed={voted}
      aria-label="추천"
    >
      <i className="ti ti-thumb-up" /> {count.toLocaleString("ko-KR")}
    </button>
  );
}
