"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Giveaway } from "@/lib/types";
import { mockGiveaways } from "@/data/mockGiveaways";
import { getEntry, totalEntries } from "@/lib/giveawayStore";
import { makeSyntheticPool, weightedDraw, type Participant } from "@/lib/draw";
import {
  getResult,
  saveResult,
  clearResult,
  type DrawResult,
  type Winner,
} from "@/lib/giveawayResults";
import styles from "./page.module.css";

const TYPE_LABEL: Record<Giveaway["type"], string> = {
  weekly: "주간",
  monthly: "월간",
};

export default function AdminGiveaway() {
  // 각 이벤트의 추첨 결과 + 내 응모권 (마운트 후 로드 — SSR 불일치 방지)
  const [results, setResults] = useState<Record<string, DrawResult | null>>({});
  const [entries, setEntries] = useState<Record<string, number>>({});

  useEffect(() => {
    const rmap: Record<string, DrawResult | null> = {};
    const emap: Record<string, number> = {};
    mockGiveaways.forEach((g) => {
      rmap[g.id] = getResult(g.id);
      emap[g.id] = totalEntries(getEntry(g.id));
    });
    setResults(rmap);
    setEntries(emap);
  }, []);

  function handleDraw(g: Giveaway) {
    // 합성 응모자 풀 + 현재 회원(내 응모권) 스냅샷
    const pool: Participant[] = makeSyntheticPool(120 + Math.floor(Math.random() * 280));
    const myTotal = totalEntries(getEntry(g.id));
    if (myTotal > 0) {
      pool.push({ id: "me", name: "나 (현재 회원)", weight: myTotal });
    }

    const picked = weightedDraw(pool, g.winnerCount);
    const winners: Winner[] = picked.map((p) => ({
      id: p.id,
      name: p.name,
      entries: p.weight,
      isMe: p.id === "me",
    }));

    const result: DrawResult = {
      giveawayId: g.id,
      winners,
      poolSize: pool.length,
      drawnAt: new Date().toLocaleString("ko-KR"),
    };
    saveResult(result);
    setResults((r) => ({ ...r, [g.id]: result }));
  }

  function handleClear(g: Giveaway) {
    clearResult(g.id);
    setResults((r) => ({ ...r, [g.id]: null }));
  }

  return (
    <main className={styles.wrap}>
      <header className={styles.head}>
        <h1>나눔이벤트 추첨 관리</h1>
        <Link href="/giveaway" className={styles.viewLink}>
          공개 페이지 보기 <i className="ti ti-external-link" />
        </Link>
      </header>

      <p className={styles.guide}>
        응모권 수에 비례한 <strong>가중 추첨</strong>입니다. 데모는 합성 응모자 풀에 현재 브라우저
        회원(내 응모권)을 섞어 추첨해요. 추첨 결과는 공개 페이지에 자동 발표됩니다.
      </p>

      <div className={styles.list}>
        {mockGiveaways.map((g) => {
          const result = results[g.id];
          const myEntries = entries[g.id] ?? 0;
          return (
            <section key={g.id} className={styles.card}>
              <div className={styles.cardHead}>
                <span className={`${styles.typeTag} ${styles[g.type]}`}>{TYPE_LABEL[g.type]}</span>
                <div className={styles.titleBox}>
                  <span className={styles.title}>{g.title}</span>
                  <span className={styles.prize}>{g.prizeName}</span>
                </div>
                <span className={styles.winnerCount}>{g.winnerCount}명 추첨</span>
              </div>

              <div className={styles.metaRow}>
                <span>
                  <i className="ti ti-ticket" /> 내 응모권 {myEntries}개
                </span>
                {result && (
                  <span>
                    <i className="ti ti-users" /> 모집단 {result.poolSize.toLocaleString("ko-KR")}명
                  </span>
                )}
              </div>

              {result ? (
                <div className={styles.resultBox}>
                  <div className={styles.resultHead}>
                    <span>🎉 당첨자 {result.winners.length}명</span>
                    <span className={styles.drawnAt}>{result.drawnAt} 추첨</span>
                  </div>
                  <ul className={styles.winners}>
                    {result.winners.map((w, i) => (
                      <li key={w.id} className={w.isMe ? styles.meWinner : ""}>
                        <span className={styles.rank}>{i + 1}</span>
                        <span className={styles.wname}>{w.name}</span>
                        <span className={styles.wentry}>응모권 {w.entries}</span>
                      </li>
                    ))}
                  </ul>
                  <div className={styles.actions}>
                    <button className={styles.redraw} onClick={() => handleDraw(g)}>
                      <i className="ti ti-refresh" /> 다시 추첨
                    </button>
                    <button className={styles.clear} onClick={() => handleClear(g)}>
                      발표 취소
                    </button>
                  </div>
                </div>
              ) : (
                <button className={styles.drawBtn} onClick={() => handleDraw(g)}>
                  <i className="ti ti-confetti" /> 추첨 실행
                </button>
              )}
            </section>
          );
        })}
      </div>
    </main>
  );
}
