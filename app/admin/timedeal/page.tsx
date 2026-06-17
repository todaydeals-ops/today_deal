"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import type { Platform } from "@/lib/types";
import { PLATFORM_LABELS, PLATFORM_ORDER } from "@/lib/types";
import styles from "./page.module.css";

interface PreviewItem {
  inputUrl: string;
  supported: boolean;
  platform: Platform | null;
  note?: string;
  productName: string;
  imageUrl?: string;
  salePrice?: number;
  productUrl: string;
  affiliateUrl: string;
  linkSource: "linkprice" | "raw";
}

interface Draft {
  key: string;
  platform: Platform;
  productName: string;
  imageUrl: string;
  productUrl: string;
  affiliateUrl: string;
  salePrice: string;
  discountRate: string;
  dealEndAt: string; // datetime-local 값
  isSoldout: boolean;
  linkSource: "linkprice" | "raw";
  include: boolean;
}

interface RegisteredDeal {
  id: string;
  platform: Platform;
  productName: string;
  imageUrl?: string;
  salePrice: number;
  discountRate?: number;
  dealEndAt?: string;
  isSoldout: boolean;
}

// Date → datetime-local 입력값 (로컬 시간)
function toLocalInput(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

export default function AdminTimedeal() {
  const [bulkText, setBulkText] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Draft[]>([]);

  const [list, setList] = useState<RegisteredDeal[]>([]);
  const [listMsg, setListMsg] = useState<string | null>(null);

  const loadList = useCallback(async () => {
    try {
      const res = await fetch("/api/deals", { cache: "no-store" });
      const data: { ok: boolean; deals: RegisteredDeal[]; error?: string } = await res.json();
      if (data.ok) setList(data.deals);
      else setListMsg(`⚠ 목록 불러오기 실패: ${data.error ?? ""}`);
    } catch {
      setListMsg("⚠ 목록 불러오기 실패");
    }
  }, []);

  useEffect(() => {
    loadList();
  }, [loadList]);

  async function handleFetch() {
    const urls = bulkText.split(/[\s,]+/).map((u) => u.trim()).filter(Boolean);
    if (urls.length === 0) {
      setMsg("⚠ 타임딜 상품 URL을 한 줄에 하나씩 붙여넣어 주세요.");
      return;
    }
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch("/api/deals/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ urls }),
      });
      const data: { ok: boolean; items: PreviewItem[]; error?: string } = await res.json();
      if (!data.ok || data.items.length === 0) {
        setMsg(`⚠ ${data.error ?? "불러올 결과가 없어요."}`);
        return;
      }
      const defaultEnd = toLocalInput(new Date(Date.now() + 12 * 3600 * 1000));
      const supported = data.items.filter((it) => it.supported);
      const next: Draft[] = supported.map((it, i) => ({
        key: `${Date.now()}-${i}`,
        platform: (it.platform ?? "gmarket") as Platform,
        productName: it.productName,
        imageUrl: it.imageUrl ?? "",
        productUrl: it.productUrl,
        affiliateUrl: it.affiliateUrl,
        salePrice: it.salePrice ? String(it.salePrice) : "",
        discountRate: "",
        dealEndAt: defaultEnd,
        isSoldout: false,
        linkSource: it.linkSource,
        include: true,
      }));
      setDrafts(next);

      const unsupported = data.items.filter((it) => !it.supported);
      const raw = next.filter((d) => d.linkSource === "raw").length;
      const noName = next.filter((d) => !d.productName).length;
      const notes: string[] = [`✓ ${next.length}건 불러왔어요.`];
      if (raw > 0) notes.push(`⚠ 제휴링크 변환 실패 ${raw}건(LinkPrice 승인/키 확인) — 원본 URL.`);
      if (noName > 0) notes.push(`⚠ 상품명 미수집 ${noName}건 — 직접 입력.`);
      if (unsupported.length > 0)
        notes.push(`✗ 미지원 ${unsupported.length}건: ${unsupported[0].note ?? ""}`);
      setMsg(notes.join(" "));
    } catch {
      setMsg("⚠ 불러오기 실패. 잠시 후 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  }

  function patch(key: string, p: Partial<Draft>) {
    setDrafts((ds) => ds.map((d) => (d.key === key ? { ...d, ...p } : d)));
  }
  function removeDraft(key: string) {
    setDrafts((ds) => ds.filter((d) => d.key !== key));
  }

  async function registerAll() {
    const target = drafts.filter((d) => d.include);
    const ready = target.filter((d) => d.productName.trim() && d.productUrl.trim() && d.salePrice);
    if (ready.length === 0) {
      setMsg("⚠ 등록 가능한 항목이 없어요. 상품명·판매가를 채워주세요.");
      return;
    }
    setLoading(true);
    try {
      const deals = ready.map((d) => ({
        platform: d.platform,
        productName: d.productName.trim(),
        imageUrl: d.imageUrl.trim() || undefined,
        productUrl: d.productUrl.trim(),
        affiliateUrl: d.affiliateUrl.trim() || undefined,
        salePrice: Number(d.salePrice),
        discountRate: d.discountRate ? Number(d.discountRate) : undefined,
        dealEndAt: d.dealEndAt ? new Date(d.dealEndAt).toISOString() : undefined,
        isSoldout: d.isSoldout,
      }));
      const res = await fetch("/api/deals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deals }),
      });
      const data: { ok: boolean; count?: number; error?: string } = await res.json();
      if (data.ok) {
        setDrafts((ds) => ds.filter((d) => !ready.includes(d)));
        setMsg(`✓ ${data.count}건 등록 완료! 홈에 최대 60초 안에 반영됩니다.`);
        loadList();
      } else {
        setMsg(`⚠ 등록 실패: ${data.error ?? ""}`);
      }
    } catch {
      setMsg("⚠ 등록 실패. 잠시 후 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/deals?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      const data: { ok: boolean; error?: string } = await res.json();
      if (data.ok) setList((l) => l.filter((d) => d.id !== id));
      else setListMsg(`⚠ 삭제 실패: ${data.error ?? ""}`);
    } catch {
      setListMsg("⚠ 삭제 실패");
    }
  }

  return (
    <main className={styles.wrap}>
      <header className={styles.head}>
        <div className={styles.brand}>
          <span className={styles.logoBadge}>
            <i className="ti ti-clock-hour-4" />
          </span>
          <div>
            <h1>
              오늘의 타임딜 <span className={styles.brandDot}>·</span> 링크 등록
            </h1>
            <p className={styles.headSub}>
              지마켓·11번가·알리 상품 URL을 붙여넣으면 제목·이미지·제휴링크를 자동으로 불러와요
            </p>
          </div>
        </div>
        <Link href="/" className={styles.viewLink}>
          홈 보기 <i className="ti ti-external-link" />
        </Link>
      </header>

      {/* 링크 일괄 등록 */}
      <section className={styles.bulkPanel}>
        <label className={styles.label}>
          <i className="ti ti-link" /> 타임딜 URL 붙여넣기 (한 줄에 하나)
        </label>
        <textarea
          className={styles.bulkTextarea}
          rows={4}
          placeholder={"https://item.gmarket.co.kr/...\nhttps://www.11st.co.kr/products/...\nhttps://www.aliexpress.com/item/..."}
          value={bulkText}
          onChange={(e) => setBulkText(e.target.value)}
        />
        <div className={styles.bulkActions}>
          <button className={styles.fetchBtn} onClick={handleFetch} disabled={loading}>
            {loading ? "처리 중…" : "불러오기"}
          </button>
          {drafts.length > 0 && (
            <button className={styles.addBtn} onClick={registerAll} disabled={loading}>
              <i className="ti ti-plus" /> 전체 등록 ({drafts.filter((d) => d.include).length})
            </button>
          )}
        </div>
        {msg && <p className={styles.message}>{msg}</p>}

        {drafts.length > 0 && (
          <div className={styles.draftList}>
            {drafts.map((d) => (
              <div key={d.key} className={`${styles.draftRow} ${d.include ? "" : styles.draftOff}`}>
                <label className={styles.draftCheck}>
                  <input
                    type="checkbox"
                    checked={d.include}
                    onChange={(e) => patch(d.key, { include: e.target.checked })}
                  />
                </label>
                <span className={styles.draftThumb}>
                  {d.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={d.imageUrl} alt="" />
                  ) : (
                    <i className="ti ti-photo" />
                  )}
                </span>
                <div className={styles.draftFields}>
                  <input
                    className={styles.draftInput}
                    placeholder="상품명"
                    value={d.productName}
                    onChange={(e) => patch(d.key, { productName: e.target.value })}
                  />
                  <div className={styles.draftRow3}>
                    <select
                      className={styles.draftInput}
                      value={d.platform}
                      onChange={(e) => patch(d.key, { platform: e.target.value as Platform })}
                    >
                      {PLATFORM_ORDER.map((p) => (
                        <option key={p} value={p}>
                          {PLATFORM_LABELS[p]}
                        </option>
                      ))}
                    </select>
                    <input
                      className={styles.draftInput}
                      type="number"
                      placeholder="판매가"
                      value={d.salePrice}
                      onChange={(e) => patch(d.key, { salePrice: e.target.value })}
                    />
                    <input
                      className={styles.draftInput}
                      type="number"
                      placeholder="할인율%"
                      value={d.discountRate}
                      onChange={(e) => patch(d.key, { discountRate: e.target.value })}
                    />
                  </div>
                  <div className={styles.draftRow3}>
                    <label className={styles.endLabel}>
                      마감
                      <input
                        className={styles.draftInput}
                        type="datetime-local"
                        value={d.dealEndAt}
                        onChange={(e) => patch(d.key, { dealEndAt: e.target.value })}
                      />
                    </label>
                    <label className={styles.soldoutLabel}>
                      <input
                        type="checkbox"
                        checked={d.isSoldout}
                        onChange={(e) => patch(d.key, { isSoldout: e.target.checked })}
                      />
                      품절
                    </label>
                    <span className={d.linkSource === "linkprice" ? styles.tagLink : styles.tagRaw}>
                      {d.linkSource === "linkprice" ? "제휴링크 ✓" : "원본 URL"}
                    </span>
                  </div>
                </div>
                <button className={styles.delBtn} onClick={() => removeDraft(d.key)}>
                  <i className="ti ti-x" />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 등록된 타임딜 */}
      <section className={styles.listSection}>
        <h2>등록된 타임딜 ({list.length})</h2>
        {listMsg && <p className={styles.message}>{listMsg}</p>}
        {list.length === 0 ? (
          <p className={styles.empty}>아직 등록된 타임딜이 없어요. 위에서 링크로 등록하세요.</p>
        ) : (
          <ul className={styles.list}>
            {list.map((d) => (
              <li key={d.id} className={styles.listItem}>
                <span className={styles.platTag}>{PLATFORM_LABELS[d.platform]}</span>
                <span className={styles.listThumb}>
                  {d.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={d.imageUrl} alt="" />
                  ) : (
                    <i className="ti ti-photo" />
                  )}
                </span>
                <span className={styles.listName}>
                  {d.productName}
                  <em>
                    {d.discountRate ? `${d.discountRate}% · ` : ""}
                    {d.salePrice.toLocaleString("ko-KR")}원{d.isSoldout ? " · 품절" : ""}
                  </em>
                </span>
                <button className={styles.delBtn} onClick={() => handleDelete(d.id)}>
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
