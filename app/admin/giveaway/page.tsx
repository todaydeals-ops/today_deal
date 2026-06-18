"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Giveaway, GiveawayType } from "@/lib/types";
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

const TYPE_LABEL: Record<GiveawayType, string> = { weekly: "주간", monthly: "월간" };

// /api/giveaways 행(snake) → Giveaway
interface GRow {
  id: string;
  type: GiveawayType;
  title: string;
  prize_name: string;
  prize_image: string | null;
  description: string | null;
  start_at: string;
  end_at: string;
  winner_count: number;
}
function rowToGiveaway(r: GRow): Giveaway {
  return {
    id: r.id,
    type: r.type,
    title: r.title,
    prizeName: r.prize_name,
    prizeImage: r.prize_image ?? undefined,
    description: r.description ?? undefined,
    startAt: r.start_at,
    endAt: r.end_at,
    winnerCount: r.winner_count,
  };
}

const EMPTY = {
  type: "weekly" as GiveawayType,
  title: "",
  prizeName: "",
  prizeImage: "",
  description: "",
  startAt: "",
  endAt: "",
  winnerCount: "5",
};

export default function AdminGiveaway() {
  const [list, setList] = useState<Giveaway[]>([]);
  const [results, setResults] = useState<Record<string, DrawResult | null>>({});
  const [entries, setEntries] = useState<Record<string, number>>({});
  const [form, setForm] = useState({ ...EMPTY });
  const [adding, setAdding] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function reload() {
    try {
      const res = await fetch("/api/giveaways", { cache: "no-store" });
      const data: { ok: boolean; giveaways?: GRow[] } = await res.json();
      const items = data.ok && data.giveaways ? data.giveaways.map(rowToGiveaway) : [];
      setList(items);
      const rmap: Record<string, DrawResult | null> = {};
      const emap: Record<string, number> = {};
      items.forEach((g) => {
        rmap[g.id] = getResult(g.id);
        emap[g.id] = totalEntries(getEntry(g.id));
      });
      setResults(rmap);
      setEntries(emap);
    } catch {
      // 무시
    }
  }

  useEffect(() => {
    reload();
  }, []);

  async function handleAdd() {
    if (!form.title.trim() || !form.prizeName.trim() || !form.endAt) {
      setMsg("⚠ 제목·경품명·종료일은 필수입니다.");
      return;
    }
    setAdding(true);
    setMsg(null);
    try {
      const res = await fetch("/api/giveaways", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ giveaway: { ...form } }),
      });
      const data: { ok: boolean; error?: string } = await res.json();
      if (!data.ok) {
        setMsg(`⚠ 등록 실패: ${data.error ?? "오류"}`);
        return;
      }
      await reload();
      setForm({ ...EMPTY });
      setMsg("✓ 나눔이벤트를 등록했어요. (공개 페이지 즉시 반영)");
    } catch {
      setMsg("⚠ 등록 실패. 잠시 후 다시 시도해주세요.");
    } finally {
      setAdding(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await fetch(`/api/giveaways?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      await reload();
    } catch {
      setMsg("⚠ 삭제 실패.");
    }
  }

  function handleDraw(g: Giveaway) {
    const pool: Participant[] = makeSyntheticPool(120 + Math.floor(Math.random() * 280));
    const myTotal = totalEntries(getEntry(g.id));
    if (myTotal > 0) pool.push({ id: "me", name: "나 (현재 회원)", weight: myTotal });
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
        <h1>나눔이벤트 관리</h1>
        <Link href="/giveaway" className={styles.viewLink}>
          공개 페이지 보기 <i className="ti ti-external-link" />
        </Link>
      </header>

      {/* ── 경품(이벤트) 등록 ── */}
      <h2 className={styles.sectionTitle}>① 나눔상품 등록</h2>
      <div className={styles.gForm}>
        <div className={styles.gRow}>
          <label className={styles.gField}>
            주기
            <select
              className={styles.gInput}
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value as GiveawayType })}
            >
              <option value="weekly">주간 (매주·다수 추첨)</option>
              <option value="monthly">월간 (매월·고가 1명)</option>
            </select>
          </label>
          <label className={styles.gField}>
            당첨자 수
            <input
              className={styles.gInput}
              type="number"
              min={1}
              value={form.winnerCount}
              onChange={(e) => setForm({ ...form, winnerCount: e.target.value })}
            />
          </label>
        </div>
        <label className={styles.gField}>
          이벤트 제목 *
          <input
            className={styles.gInput}
            placeholder="예: 이번 주 살림 나눔"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
        </label>
        <label className={styles.gField}>
          경품명 *
          <input
            className={styles.gInput}
            placeholder="예: 락앤락 밀폐용기 14P 세트"
            value={form.prizeName}
            onChange={(e) => setForm({ ...form, prizeName: e.target.value })}
          />
        </label>
        <label className={styles.gField}>
          경품 이미지 URL
          <input
            className={styles.gInput}
            value={form.prizeImage}
            onChange={(e) => setForm({ ...form, prizeImage: e.target.value })}
          />
        </label>
        <div className={styles.gRow}>
          <label className={styles.gField}>
            시작일
            <input
              className={styles.gInput}
              type="date"
              value={form.startAt}
              onChange={(e) => setForm({ ...form, startAt: e.target.value })}
            />
          </label>
          <label className={styles.gField}>
            종료일 *
            <input
              className={styles.gInput}
              type="date"
              value={form.endAt}
              onChange={(e) => setForm({ ...form, endAt: e.target.value })}
            />
          </label>
        </div>
        <label className={styles.gField}>
          설명
          <textarea
            className={styles.gTextarea}
            rows={2}
            placeholder="경품 소개·응모 안내"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </label>
        <button className={styles.gAddBtn} onClick={handleAdd} disabled={adding}>
          <i className="ti ti-plus" /> {adding ? "등록 중…" : "나눔이벤트 등록"}
        </button>
        {msg && <p className={styles.gMsg}>{msg}</p>}
      </div>

      {/* ── 추첨 관리 ── */}
      <h2 className={styles.sectionTitle}>② 추첨 관리</h2>
      <p className={styles.guide}>
        응모권 수에 비례한 <strong>가중 추첨</strong>입니다. 추첨 결과는 공개 페이지에 자동 발표됩니다.
      </p>

      {list.length === 0 ? (
        <p className={styles.empty}>아직 등록된 나눔이벤트가 없어요. 위에서 먼저 등록하세요.</p>
      ) : (
        <div className={styles.list}>
          {list.map((g) => {
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
                  <button className={styles.gDelBtn} onClick={() => handleDelete(g.id)}>
                    <i className="ti ti-trash" /> 삭제
                  </button>
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
      )}
    </main>
  );
}
