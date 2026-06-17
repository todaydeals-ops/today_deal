"use client";

import { useEffect, useState } from "react";
import styles from "./Countdown.module.css";

interface CountdownProps {
  // 마감 시각 (ISO 8601)
  endAt: string;
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function remainingText(endMs: number, nowMs: number) {
  let s = Math.floor((endMs - nowMs) / 1000);
  if (s <= 0) return "00:00:00";
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${pad(h)}:${pad(m)}:${pad(sec)}`;
}

export default function Countdown({ endAt }: CountdownProps) {
  // SSR/CSR 불일치 방지: 마운트 전엔 placeholder. 마운트 후 1초마다 갱신.
  const [text, setText] = useState("--:--:--");

  useEffect(() => {
    const endMs = new Date(endAt).getTime();
    const update = () => setText(remainingText(endMs, Date.now()));
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [endAt]);

  return (
    <div className={styles.timer}>
      <i className="ti ti-clock" />
      <span>{text}</span>
    </div>
  );
}
