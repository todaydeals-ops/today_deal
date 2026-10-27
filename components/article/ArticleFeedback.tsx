"use client";

import { useEffect, useState } from "react";
import styles from "@/app/magazine/[slug]/article.module.css";

// "이 가이드로 해결됐나요?" — 서버 집계가 없다. 이 브라우저에서 1회 고른 값을 localStorage(`td-vote:{slug}`)에만 기억하고 문구를 바꾼다.
// ("N명이 …" 같은 집계처럼 보이는 문구는 쓰지 않는다.) 읽기·쓰기 모두 try/catch.
type Vote = "yes" | "no" | null;

const key = (slug: string) => `td-vote:${slug}`;

export default function ArticleFeedback({ slug }: { slug: string }) {
  const [vote, setVote] = useState<Vote>(null);

  useEffect(() => {
    try {
      const v = window.localStorage.getItem(key(slug));
      if (v === "yes" || v === "no") setVote(v);
    } catch {
      /* 저장소 차단 — 기억만 못 한다 */
    }
  }, [slug]);

  const pick = (v: "yes" | "no") => {
    if (vote) return; // 1회 선택
    setVote(v);
    try {
      window.localStorage.setItem(key(slug), v);
    } catch {
      /* 저장 실패해도 문구는 바뀐다 */
    }
  };

  const label =
    vote === "yes"
      ? "다행이에요. 알려주셔서 고마워요."
      : vote === "no"
        ? "아래 관련 가이드를 이어서 보세요."
        : "이 가이드로 해결됐나요?";

  return (
    <section className={styles.fb} aria-label="가이드 피드백">
      <span className={styles.fbLabel} aria-live="polite">{label}</span>
      <div className={styles.fbBtns}>
        <button type="button" className={`${styles.fbBtn} ${vote === "yes" ? styles.fbOn : ""}`} aria-pressed={vote === "yes"} disabled={!!vote && vote !== "yes"} onClick={() => pick("yes")}>
          해결됐어요
        </button>
        <button type="button" className={`${styles.fbBtn} ${vote === "no" ? styles.fbOn : ""}`} aria-pressed={vote === "no"} disabled={!!vote && vote !== "no"} onClick={() => pick("no")}>
          아직이에요
        </button>
      </div>
    </section>
  );
}
