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
  const s = Math.floor((endMs - nowMs) / 1000);
  if (s <= 0) return "00:00:00";
  const h = Math.floor(s / 3600);
  // 48시간 초과(앵콜딜 등 장기) → HH:MM:SS가 깨져 보이므로 D-N로 표기
  if (h >= 48) return `D-${Math.ceil(h / 24)}`;
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
