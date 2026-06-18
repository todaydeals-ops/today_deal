"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Giveaway, GiveawayType } from "@/lib/types";
import styles from "./page.module.css";

const TYPE_LABEL: Record<GiveawayType, string> = { weekly: "주간", monthly: "월간" };

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
  affiliate_url: string | null;
  draw_at: string | null;
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
    affiliateUrl: r.affiliate_url ?? undefined,
    drawAt: r.draw_at ?? undefined,
  };
}

/* ── 날짜 계산 (UTC 기준) ── */
function addDaysUTC(d: Date, n: number): Date {
  const x = new Date(d);
  x.setUTCDate(x.getUTCDate() + n);
  return x;
}
function isoWeekMonday(year: number, week: number): Date {
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const dayIdx = (jan4.getUTCDay() + 6) % 7; // Mon=0
  const week1Mon = addDaysUTC(jan4, -dayIdx);
  return addDaysUTC(week1Mon, (week - 1) * 7);
}
// 주간: 월~일 + 다음 월요일 추첨 / 월간: 1일~말일 + 익월 5일 추첨
function periodDates(
  type: GiveawayType,
  week: string,
  month: string
): { start: Date; end: Date; draw: Date } | null {
  if (type === "weekly") {
    const m = /^(\d{4})-W(\d{2})$/.exec(week);
    if (!m) return null;
    const mon = isoWeekMonday(Number(m[1]), Number(m[2]));
    return { start: mon, end: addDaysUTC(mon, 6), draw: addDaysUTC(mon, 7) };
  }
  const mm = /^(\d{4})-(\d{2})$/.exec(month);
  if (!mm) return null;
  const y = Number(mm[1]);
  const mo = Number(mm[2]); // 1~12
  return {
    start: new Date(Date.UTC(y, mo - 1, 1)),
    end: new Date(Date.UTC(y, mo, 0)), // 말일
    draw: new Date(Date.UTC(y, mo, 5)), // 익월 5일
  };
}
function fmtMD(iso: string): string {
  const d = new Date(iso);
  return `${d.getUTCMonth() + 1}/${d.getUTCDate()}`;
}
function fmtMDDate(d: Date): string {
  return `${d.getUTCMonth() + 1}/${d.getUTCDate()}`;
}

const EMPTY = {
  type: "weekly" as GiveawayType,
  coupangUrl: "",
  prizeName: "",
  prizeImage: "",
  affiliateUrl: "",
  linkSource: "" as "" | "coupang" | "raw",
  title: "",
  description: "",
  winnerCount: "5",
  week: "",
  month: "",
};

export default function AdminGiveaway() {
  const [list, setList] = useState<Giveaway[]>([]);
  const [results, setResults] = useState<Record<string, DrawResult | null>>({});
  const [form, setForm] = useState({ ...EMPTY });
  const [fetching, setFetching] = useState(false);
  const [adding, setAdding] = useState(false);
  const [drawingId, setDrawingId] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  async function reload() {
    try {
      const res = await fetch("/api/giveaways", { cache: "no-store" });
      const data: { ok: boolean; giveaways?: GRow[] } = await res.json();
      const items = data.ok && data.giveaways ? data.giveaways.map(rowToGiveaway) : [];
      setList(items);
      // 추첨 결과는 서버(draw_results)에서
      const pairs = await Promise.all(
        items.map(async (g) => {
          try {
            const r = await fetch(`/api/giveaway/results?gid=${encodeURIComponent(g.id)}`, { cache: "no-store" });
            const j = await r.json();
            return [g.id, j.ok ? j.result : null] as const;
          } catch {
            return [g.id, null] as const;
          }
        })
      );
      setResults(Object.fromEntries(pairs));
    } catch {
      // 무시
    }
  }

  useEffect(() => {
    reload();
  }, []);

  // 쿠팡 URL → 경품명·이미지·제휴링크 자동 채움 (추천딜 일괄등록 로직 재사용)
  async function fetchCoupang() {
    if (!form.coupangUrl.trim()) {
      setMsg("⚠ 쿠팡 상품 URL을 먼저 넣어주세요.");
      return;
    }
    setFetching(true);
    setMsg(null);
    try {
      const res = await fetch("/api/curated/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ urls: [form.coupangUrl.trim()] }),
      });
      const data: {
        ok: boolean;
        items?: { productName: string; imageUrl?: string; affiliateUrl: string; linkSource: "coupang" | "raw" }[];
        error?: string;
      } = await res.json();
      const it = data.items?.[0];
      if (!data.ok || !it) {
        setMsg(`⚠ 불러오기 실패: ${data.error ?? "결과 없음"}`);
        return;
      }
      setForm((f) => ({
        ...f,
        prizeName: it.productName || f.prizeName,
        prizeImage: it.imageUrl || f.prizeImage,
        affiliateUrl: it.affiliateUrl || f.affiliateUrl,
        linkSource: it.linkSource,
      }));
      setMsg(
        it.linkSource === "coupang"
          ? "✓ 상품을 불러왔어요. 제휴링크(우리 코드) 적용됨."
          : "✓ 상품을 불러왔어요. (제휴링크 변환은 실패 — 원본 URL, 파트너스 키 확인)"
      );
    } catch {
      setMsg("⚠ 불러오기 실패. 잠시 후 다시 시도해주세요.");
    } finally {
      setFetching(false);
    }
  }

  function setType(type: GiveawayType) {
    setForm((f) => ({ ...f, type, winnerCount: type === "monthly" ? "1" : "5" }));
  }

  const period = periodDates(form.type, form.week, form.month);

  async function handleAdd() {
    if (!form.prizeName.trim()) {
      setMsg("⚠ 경품을 먼저 불러오거나 입력하세요.");
      return;
    }
    if (!period) {
      setMsg(form.type === "weekly" ? "⚠ 추첨할 주를 선택하세요." : "⚠ 추첨할 월을 선택하세요.");
      return;
    }
    setAdding(true);
    setMsg(null);
    const autoTitle =
      form.title.trim() ||
      (form.type === "weekly" ? `이번 주 나눔 · ${form.prizeName.trim()}` : `이달의 경품 · ${form.prizeName.trim()}`);
    try {
      const res = await fetch("/api/giveaways", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          giveaway: {
            type: form.type,
            title: autoTitle,
            prizeName: form.prizeName.trim(),
            prizeImage: form.prizeImage.trim() || undefined,
            affiliateUrl: form.affiliateUrl.trim() || undefined,
            description: form.description.trim() || undefined,
            winnerCount: form.winnerCount,
            startAt: period.start.toISOString(),
            endAt: period.end.toISOString(),
            drawAt: period.draw.toISOString(),
          },
        }),
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

  async function handleDraw(g: Giveaway) {
    setDrawingId(g.id);
    setMsg(null);
    try {
      const res = await fetch("/api/giveaways/draw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gid: g.id }),
      });
      const data: { ok: boolean; winners?: Winner[]; poolSize?: number; drawnAt?: string; error?: string } =
        await res.json();
      if (!data.ok) {
        setMsg(`⚠ ${data.error ?? "추첨 실패"}`);
        return;
      }
      setResults((r) => ({
        ...r,
        [g.id]: { winners: data.winners ?? [], poolSize: data.poolSize ?? 0, drawnAt: data.drawnAt ?? "" },
      }));
      setMsg(`✓ ${g.title} 추첨 완료 — 공개 페이지에 자동 발표됩니다.`);
    } catch {
      setMsg("⚠ 추첨 실패. 잠시 후 다시 시도해주세요.");
    } finally {
      setDrawingId(null);
    }
  }

  async function handleClear(g: Giveaway) {
    try {
      await fetch(`/api/giveaways/draw?gid=${encodeURIComponent(g.id)}`, { method: "DELETE" });
      setResults((r) => ({ ...r, [g.id]: null }));
    } catch {
      setMsg("⚠ 발표 취소 실패.");
    }
  }

  return (
    <main className={styles.wrap}>
      <header className={styles.head}>
        <h1>나눔이벤트 관리</h1>
        <Link href="/giveaway" className={styles.viewLink}>
          공개 페이지 보기 <i className="ti ti-external-link" />
        </Link>
      </header>

      {/* ── ① 나눔상품 등록 ── */}
      <h2 className={styles.sectionTitle}>① 나눔상품 등록</h2>
      <div className={styles.gForm}>
        {/* 쿠팡 URL 자동채움 */}
        <label className={styles.gField}>
          쿠팡 상품 URL (붙여넣고 불러오기 → 경품·이미지·제휴링크 자동)
          <div className={styles.coupangRow}>
            <input
              className={styles.gInput}
              placeholder="https://www.coupang.com/vp/products/..."
              value={form.coupangUrl}
              onChange={(e) => setForm({ ...form, coupangUrl: e.target.value })}
            />
            <button className={styles.coupangBtn} onClick={fetchCoupang} disabled={fetching}>
              {fetching ? "불러오는 중…" : "불러오기"}
            </button>
          </div>
        </label>

        {/* 불러온 경품 미리보기 */}
        {(form.prizeName || form.prizeImage) && (
          <div className={styles.thumbRow}>
            {form.prizeImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img className={styles.thumb} src={form.prizeImage} alt="" />
            ) : (
              <span className={styles.thumb} />
            )}
            <input
              className={styles.gInput}
              style={{ flex: 1 }}
              placeholder="경품명 *"
              value={form.prizeName}
              onChange={(e) => setForm({ ...form, prizeName: e.target.value })}
            />
            {form.linkSource && (
              <span className={`${styles.affTag} ${form.linkSource === "coupang" ? styles.affOk : styles.affRaw}`}>
                {form.linkSource === "coupang" ? "제휴링크 ✓" : "원본 URL"}
              </span>
            )}
          </div>
        )}

        <div className={styles.gRow}>
          <label className={styles.gField}>
            주기
            <select className={styles.gInput} value={form.type} onChange={(e) => setType(e.target.value as GiveawayType)}>
              <option value="weekly">주간 (월~일 · 다음 월요일 추첨)</option>
              <option value="monthly">월간 (1일~말일 · 익월 5일 추첨)</option>
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

        {/* 주간=주 선택 / 월간=월 선택 */}
        <label className={styles.gField}>
          {form.type === "weekly" ? "추첨할 주 선택" : "추첨할 월 선택"}
          {form.type === "weekly" ? (
            <input
              className={styles.gInput}
              type="week"
              value={form.week}
              onChange={(e) => setForm({ ...form, week: e.target.value })}
            />
          ) : (
            <input
              className={styles.gInput}
              type="month"
              value={form.month}
              onChange={(e) => setForm({ ...form, month: e.target.value })}
            />
          )}
        </label>

        {period && (
          <div className={styles.periodInfo}>
            기간 <strong>{fmtMDDate(period.start)} ~ {fmtMDDate(period.end)}</strong>
            {"  ·  "}
            추첨 예정 <strong>{fmtMDDate(period.draw)}</strong>
            <span className={styles.drawTag}> (자동추첨은 추후 작동)</span>
          </div>
        )}

        <label className={styles.gField}>
          설명 (선택)
          <textarea
            className={styles.gTextarea}
            rows={2}
            placeholder="비우면 자동으로 채워져요"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </label>

        <button className={styles.gAddBtn} onClick={handleAdd} disabled={adding}>
          <i className="ti ti-plus" /> {adding ? "등록 중…" : "나눔이벤트 등록"}
        </button>
        {msg && <p className={styles.gMsg}>{msg}</p>}
      </div>

      {/* ── ② 추첨 관리 ── */}
      <h2 className={styles.sectionTitle}>② 추첨 관리</h2>
      <p className={styles.guide}>
        응모권 수에 비례한 <strong>가중 추첨</strong>입니다. (지금은 수동 — 자동추첨은 회원 DB 연동 후 작동)
      </p>

      {list.length === 0 ? (
        <p className={styles.empty}>아직 등록된 나눔이벤트가 없어요. 위에서 먼저 등록하세요.</p>
      ) : (
        <div className={styles.list}>
          {list.map((g) => {
            const result = results[g.id];
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
                  {result && (
                    <span>
                      <i className="ti ti-users" /> 응모자 {result.poolSize.toLocaleString("ko-KR")}명
                    </span>
                  )}
                  {g.drawAt && (
                    <span className={styles.drawTag}>
                      <i className="ti ti-calendar-event" /> 추첨 예정 {fmtMD(g.drawAt)}
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
                      {result.drawnAt && (
                        <span className={styles.drawnAt}>
                          {new Date(result.drawnAt).toLocaleString("ko-KR")} 추첨
                        </span>
                      )}
                    </div>
                    <ul className={styles.winners}>
                      {result.winners.map((w, i) => (
                        <li key={w.id}>
                          <span className={styles.rank}>{i + 1}</span>
                          <span className={styles.wname}>{w.name}</span>
                          <span className={styles.wentry}>응모권 {w.entries}</span>
                        </li>
                      ))}
                    </ul>
                    <div className={styles.actions}>
                      <button className={styles.redraw} onClick={() => handleDraw(g)} disabled={drawingId === g.id}>
                        <i className="ti ti-refresh" /> {drawingId === g.id ? "추첨 중…" : "다시 추첨"}
                      </button>
                      <button className={styles.clear} onClick={() => handleClear(g)}>
                        발표 취소
                      </button>
                    </div>
                  </div>
                ) : (
                  <button className={styles.drawBtn} onClick={() => handleDraw(g)} disabled={drawingId === g.id}>
                    <i className="ti ti-confetti" /> {drawingId === g.id ? "추첨 중…" : "지금 추첨"}
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
