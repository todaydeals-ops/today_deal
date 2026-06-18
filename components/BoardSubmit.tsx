"use client";

import { useState } from "react";
import styles from "./BoardSubmit.module.css";

const BOARD_TYPES = [
  { key: "hot", label: "핫딜" },
  { key: "overseas", label: "해외직구" },
  { key: "free", label: "무료/이벤트" },
  { key: "coupon", label: "쿠폰/적립" },
];
const BOARD_CATEGORIES = ["전자/IT", "생활/주방", "식품", "뷰티/패션", "패션잡화", "유아동", "스포츠/취미", "기타"];

export default function BoardSubmit({ defaultType = "hot" }: { defaultType?: string }) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [fetching, setFetching] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [hp, setHp] = useState(""); // 허니팟
  const [form, setForm] = useState({
    title: "",
    shop: "",
    category: "전자/IT",
    price: "",
    boardType: defaultType,
    body: "",
    author: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  function set<K extends keyof typeof form>(k: K, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function fetchMeta() {
    if (!url.trim()) {
      setMsg("⚠ 핫딜 링크(URL)를 먼저 넣어주세요.");
      return;
    }
    setFetching(true);
    setMsg(null);
    try {
      const res = await fetch("/api/board/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });
      const d = await res.json();
      if (!d.ok) {
        setMsg("⚠ 불러오기 실패 — 제목만 직접 입력해도 제보돼요.");
        return;
      }
      setForm((f) => ({
        ...f,
        title: d.title || f.title,
        shop: d.shop || f.shop,
        price: d.price ? String(d.price) : f.price,
      }));
      setImageUrl(d.imageUrl || "");
      setMsg(d.partial ? "일부만 불러왔어요 — 제목 확인 후 제보하세요." : "✓ 불러왔어요. 확인 후 제보!");
    } catch {
      setMsg("⚠ 불러오기 실패 — 제목만 입력해도 제보돼요.");
    } finally {
      setFetching(false);
    }
  }

  async function submit() {
    if (!url.trim() || !form.title.trim()) {
      setMsg("⚠ 링크와 제목은 필요해요.");
      return;
    }
    setSubmitting(true);
    setMsg(null);
    try {
      const res = await fetch("/api/board/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deal: {
            url: url.trim(),
            title: form.title.trim(),
            boardType: form.boardType,
            shop: form.shop.trim() || undefined,
            category: form.category,
            price: form.price || undefined,
            imageUrl: imageUrl || undefined,
            body: form.body.trim() || undefined,
            author: form.author.trim() || undefined,
            hp,
          },
        }),
      });
      const d = await res.json();
      if (!d.ok) {
        setMsg(`⚠ 제보 실패: ${d.error ?? "오류"}`);
        return;
      }
      setDone(true);
    } catch {
      setMsg("⚠ 제보 실패. 잠시 후 다시 시도해주세요.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) {
    return (
      <button className={styles.openBtn} onClick={() => setOpen(true)}>
        <i className="ti ti-plus" /> 핫딜 제보하기 <span className={styles.openHint}>(가입 없이 링크만!)</span>
      </button>
    );
  }

  if (done) {
    return (
      <div className={styles.box}>
        <p className={styles.doneMsg}>
          <i className="ti ti-circle-check" /> 제보 완료! 검토 후 게시됩니다. 감사해요 🙌
        </p>
        <button
          className={styles.openBtn}
          onClick={() => {
            setDone(false);
            setUrl("");
            setImageUrl("");
            setForm({ title: "", shop: "", category: "전자/IT", price: "", boardType: defaultType, body: "", author: form.author });
          }}
        >
          <i className="ti ti-plus" /> 또 제보하기
        </button>
      </div>
    );
  }

  return (
    <div className={styles.box}>
      <div className={styles.boxHead}>
        <strong>핫딜 제보 (가입 불필요)</strong>
        <button className={styles.close} onClick={() => setOpen(false)} aria-label="닫기">
          <i className="ti ti-x" />
        </button>
      </div>

      <label className={styles.label}>핫딜 링크</label>
      <div className={styles.urlRow}>
        <input className={styles.input} placeholder="https://... 핫딜 상품 링크" value={url} onChange={(e) => setUrl(e.target.value)} />
        <button className={styles.fetchBtn} onClick={fetchMeta} disabled={fetching}>
          {fetching ? "불러오는 중…" : "불러오기"}
        </button>
      </div>

      {(form.title || imageUrl) && (
        <div className={styles.preview}>
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imageUrl} alt="" />
          ) : (
            <span className={styles.noImg}>
              <i className="ti ti-photo" />
            </span>
          )}
          <input className={styles.input} placeholder="제목" value={form.title} onChange={(e) => set("title", e.target.value)} />
        </div>
      )}

      <div className={styles.grid2}>
        <select className={styles.input} value={form.boardType} onChange={(e) => set("boardType", e.target.value)}>
          {BOARD_TYPES.map((t) => (
            <option key={t.key} value={t.key}>
              {t.label}
            </option>
          ))}
        </select>
        <select className={styles.input} value={form.category} onChange={(e) => set("category", e.target.value)}>
          {BOARD_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <input className={styles.input} placeholder="쇼핑몰" value={form.shop} onChange={(e) => set("shop", e.target.value)} />
        <input className={styles.input} type="number" placeholder="가격(원)" value={form.price} onChange={(e) => set("price", e.target.value)} />
      </div>
      <input className={styles.input} placeholder="닉네임(선택)" value={form.author} onChange={(e) => set("author", e.target.value)} />
      <textarea className={styles.textarea} rows={2} placeholder="한줄 설명(선택)" value={form.body} onChange={(e) => set("body", e.target.value)} />

      {/* 허니팟 (사람에겐 안 보임) */}
      <input className={styles.hp} tabIndex={-1} autoComplete="off" value={hp} onChange={(e) => setHp(e.target.value)} aria-hidden />

      {msg && <p className={styles.msg}>{msg}</p>}
      <button className={styles.submitBtn} onClick={submit} disabled={submitting}>
        {submitting ? "제보 중…" : "제보하기"}
      </button>
      <p className={styles.policy}>
        제보해 주셔서 감사해요! 타 사이트 홍보·개인 제휴링크는 정책에 따라 정규화될 수 있으며, 검토 후 게시됩니다.
      </p>
    </div>
  );
}
