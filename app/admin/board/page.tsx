"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./page.module.css";

// 클라이언트 안전 상수 (lib/data/board는 서버 전용이라 직접 import 안 함)
const BOARD_TYPES = [
  { key: "hot", label: "핫딜" },
  { key: "overseas", label: "해외직구" },
  { key: "free", label: "무료/이벤트" },
  { key: "coupon", label: "쿠폰/적립" },
];
const BOARD_CATEGORIES = ["전자/IT", "생활/주방", "식품", "뷰티/패션", "패션잡화", "유아동", "스포츠/취미", "기타"];

interface Row {
  id: string;
  slug: string | null;
  title: string;
  shop: string | null;
  category: string | null;
  price: number | null;
  image_url: string | null;
  author: string | null;
  created_at: string;
}

const EMPTY = {
  title: "",
  boardType: "hot",
  shop: "",
  category: "전자/IT",
  price: "",
  shipping: "무료",
  imageUrl: "",
  sourceUrl: "",
  affiliateUrl: "",
  author: "",
  body: "",
};

export default function AdminBoard() {
  const [form, setForm] = useState({ ...EMPTY });
  const [list, setList] = useState<Row[]>([]);
  const [adding, setAdding] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function reload() {
    try {
      const res = await fetch("/api/board", { cache: "no-store" });
      const data: { ok: boolean; deals?: Row[] } = await res.json();
      if (data.ok && data.deals) setList(data.deals);
    } catch {
      // 무시
    }
  }
  useEffect(() => {
    reload();
  }, []);

  function set<K extends keyof typeof EMPTY>(k: K, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function add() {
    if (!form.title.trim() || !form.sourceUrl.trim()) {
      setMsg("⚠ 제목·원본 링크는 필수입니다.");
      return;
    }
    setAdding(true);
    setMsg(null);
    try {
      const res = await fetch("/api/board", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deal: {
            title: form.title.trim(),
            boardType: form.boardType,
            shop: form.shop.trim() || undefined,
            category: form.category,
            price: form.price || undefined,
            shipping: form.shipping.trim() || undefined,
            imageUrl: form.imageUrl.trim() || undefined,
            sourceUrl: form.sourceUrl.trim(),
            affiliateUrl: form.affiliateUrl.trim() || undefined,
            author: form.author.trim() || undefined,
            body: form.body.trim() || undefined,
          },
        }),
      });
      const data: { ok: boolean; error?: string } = await res.json();
      if (!data.ok) {
        setMsg(`⚠ 등록 실패: ${data.error ?? "오류"}`);
        return;
      }
      await reload();
      setForm({ ...EMPTY, author: form.author }); // 작성자명 유지
      setMsg("✓ 제보딜을 등록했어요. (게시판 즉시 반영)");
    } catch {
      setMsg("⚠ 등록 실패. 잠시 후 다시 시도해주세요.");
    } finally {
      setAdding(false);
    }
  }

  async function remove(id: string) {
    try {
      await fetch(`/api/board?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      await reload();
    } catch {
      setMsg("⚠ 삭제 실패.");
    }
  }

  return (
    <main className={styles.wrap}>
      <header className={styles.head}>
        <h1>핫딜 제보 게시판 — 등록</h1>
        <Link href="/board" className={styles.viewLink}>
          게시판 보기 <i className="ti ti-external-link" />
        </Link>
      </header>

      <div className={styles.form}>
        <label className={styles.field}>
          보드
          <select className={styles.input} value={form.boardType} onChange={(e) => set("boardType", e.target.value)}>
            {BOARD_TYPES.map((t) => (
              <option key={t.key} value={t.key}>
                {t.label}
              </option>
            ))}
          </select>
        </label>
        <label className={styles.field}>
          제목 *
          <input className={styles.input} value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="상품명 / 딜 제목" />
        </label>
        <label className={styles.field}>
          원본 링크 * (상품/딜 URL)
          <input className={styles.input} value={form.sourceUrl} onChange={(e) => set("sourceUrl", e.target.value)} placeholder="https://..." />
        </label>
        <div className={styles.row3}>
          <label className={styles.field}>
            쇼핑몰
            <input className={styles.input} value={form.shop} onChange={(e) => set("shop", e.target.value)} placeholder="네이버·G마켓·와디즈…" />
          </label>
          <label className={styles.field}>
            카테고리
            <select className={styles.input} value={form.category} onChange={(e) => set("category", e.target.value)}>
              {BOARD_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <label className={styles.field}>
            가격(원)
            <input className={styles.input} type="number" value={form.price} onChange={(e) => set("price", e.target.value)} />
          </label>
        </div>
        <div className={styles.row3}>
          <label className={styles.field}>
            배송
            <input className={styles.input} value={form.shipping} onChange={(e) => set("shipping", e.target.value)} placeholder="무료 / 3,000원" />
          </label>
          <label className={styles.field}>
            작성자(에이전트)
            <input className={styles.input} value={form.author} onChange={(e) => set("author", e.target.value)} placeholder="닉네임" />
          </label>
          <label className={styles.field}>
            제휴 링크(선택)
            <input className={styles.input} value={form.affiliateUrl} onChange={(e) => set("affiliateUrl", e.target.value)} placeholder="있으면 우선 사용" />
          </label>
        </div>
        <label className={styles.field}>
          이미지 URL
          <input className={styles.input} value={form.imageUrl} onChange={(e) => set("imageUrl", e.target.value)} />
        </label>
        <label className={styles.field}>
          본문/설명 (선택)
          <textarea className={styles.textarea} rows={3} value={form.body} onChange={(e) => set("body", e.target.value)} placeholder="딜 포인트·꿀팁 등" />
        </label>
        <button className={styles.addBtn} onClick={add} disabled={adding}>
          <i className="ti ti-plus" /> {adding ? "등록 중…" : "제보딜 등록"}
        </button>
        {msg && <p className={styles.msg}>{msg}</p>}
      </div>

      <section className={styles.listSection}>
        <h2>등록된 제보딜 ({list.length})</h2>
        {list.length === 0 ? (
          <p className={styles.empty}>아직 없어요.</p>
        ) : (
          <ul className={styles.list}>
            {list.map((d) => (
              <li key={d.id} className={styles.item}>
                <span className={styles.itemThumb}>
                  {d.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={d.image_url} alt="" />
                  ) : (
                    <i className="ti ti-photo" />
                  )}
                </span>
                <span className={styles.itemName}>
                  {d.title}
                  <em>
                    {[d.category, d.shop, d.price ? `${d.price.toLocaleString("ko-KR")}원` : "", d.author].filter(Boolean).join(" · ")}
                  </em>
                </span>
                <button className={styles.delBtn} onClick={() => remove(d.id)}>
                  <i className="ti ti-trash" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
