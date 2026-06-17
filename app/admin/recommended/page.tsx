"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { CuratedDeal, CuratedCategory } from "@/lib/types";
import { CURATED_CATEGORIES } from "@/lib/types";
import type { CoupangProduct } from "@/lib/coupang";
import { mockCurated } from "@/data/mockCurated";
import {
  getStoredCurated,
  addStoredCurated,
  removeStoredCurated,
  nextSeq,
} from "@/lib/curatedStore";
import CuratedCard from "@/components/CuratedCard";
import styles from "./page.module.css";

interface SearchResponse {
  ok: boolean;
  source: "coupang" | "mock";
  products: CoupangProduct[];
  error?: string;
}

const EMPTY = {
  productName: "",
  imageUrl: "",
  affiliateUrl: "",
  salePrice: "",
  discountRate: "",
  category: "가전" as CuratedCategory,
  adminNote: "",
};

export default function AdminRecommended() {
  const [keyword, setKeyword] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<CoupangProduct[]>([]);
  const [source, setSource] = useState<"coupang" | "mock" | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [form, setForm] = useState({ ...EMPTY });
  const [list, setList] = useState<CuratedDeal[]>([]);

  useEffect(() => {
    setList(getStoredCurated());
  }, []);

  // 쿠팡 파트너스 API 검색 (키 없으면 목)
  async function handleSearch() {
    if (!keyword.trim()) return;
    setSearching(true);
    setMessage(null);
    try {
      const res = await fetch("/api/coupang/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword: keyword.trim() }),
      });
      const data: SearchResponse = await res.json();
      setResults(data.products);
      setSource(data.source);
      if (data.products.length === 0) setMessage("검색 결과가 없어요.");
      else if (data.source === "mock")
        setMessage("⚠ 파트너스 API 키 미설정 — 목 결과예요. 키 등록 시 실제 상품이 검색됩니다.");
      else setMessage(null);
    } catch {
      setMessage("⚠ 검색 실패. 잠시 후 다시 시도해주세요.");
    } finally {
      setSearching(false);
    }
  }

  // 검색 결과에서 상품 선택 → 폼 자동 채움 (이미지·제목·가격·제휴링크)
  function pickProduct(p: CoupangProduct) {
    setForm((f) => ({
      ...f,
      productName: p.title,
      imageUrl: p.imageUrl ?? "",
      salePrice: p.price ? String(p.price) : "",
      affiliateUrl: p.productUrl,
    }));
    setMessage("✓ 상품을 불러왔어요. 카테고리·할인율·한줄평을 채워주세요.");
  }

  function handleAdd() {
    if (!form.productName.trim() || !form.affiliateUrl.trim() || !form.salePrice) {
      setMessage("⚠ 상품명·제휴링크·판매가는 필수입니다.");
      return;
    }
    const deal: CuratedDeal = {
      id: `u${nextSeq(mockCurated)}-${form.productName.slice(0, 4)}`,
      seq: nextSeq(mockCurated),
      productName: form.productName.trim(),
      category: form.category,
      imageUrl: form.imageUrl.trim() || undefined,
      affiliateUrl: form.affiliateUrl.trim(),
      salePrice: Number(form.salePrice),
      discountRate: form.discountRate ? Number(form.discountRate) : undefined,
      adminNote: form.adminNote.trim() || undefined,
      isActive: true,
    };
    setList(addStoredCurated(deal));
    setForm({ ...EMPTY });
    setMessage("✓ 추천딜에 추가했어요.");
  }

  function handleRemove(id: string) {
    setList(removeStoredCurated(id));
  }

  const preview: CuratedDeal = {
    id: "preview",
    seq: nextSeq(mockCurated),
    productName: form.productName || "상품명 미리보기",
    category: form.category,
    imageUrl: form.imageUrl || undefined,
    affiliateUrl: form.affiliateUrl || "#",
    salePrice: form.salePrice ? Number(form.salePrice) : 0,
    discountRate: form.discountRate ? Number(form.discountRate) : undefined,
    adminNote: form.adminNote || undefined,
    isActive: true,
  };

  return (
    <main className={styles.wrap}>
      <header className={styles.head}>
        <h1>추천딜 관리</h1>
        <Link href="/recommended" className={styles.viewLink}>
          공개 페이지 보기 <i className="ti ti-external-link" />
        </Link>
      </header>

      <div className={styles.layout}>
        {/* 입력 폼 */}
        <section className={styles.formCol}>
          <label className={styles.label}>쿠팡 상품 검색 (파트너스 API)</label>
          <div className={styles.urlRow}>
            <input
              className={styles.input}
              placeholder="상품 키워드 (예: 무선청소기, 밀폐용기)"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
            <button className={styles.fetchBtn} onClick={handleSearch} disabled={searching}>
              {searching ? "검색 중…" : "검색"}
            </button>
          </div>

          {/* 검색 결과 */}
          {results.length > 0 && (
            <div className={styles.results}>
              {source === "mock" && <span className={styles.mockTag}>목 데이터</span>}
              {results.map((p) => (
                <button key={p.productId} className={styles.resultItem} onClick={() => pickProduct(p)}>
                  <span className={styles.resultThumb}>
                    {p.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.imageUrl} alt="" />
                    ) : (
                      <i className="ti ti-photo" />
                    )}
                  </span>
                  <span className={styles.resultInfo}>
                    <span className={styles.resultName}>{p.title}</span>
                    <span className={styles.resultPrice}>{p.price.toLocaleString("ko-KR")}원</span>
                  </span>
                  <span className={styles.resultPick}>선택</span>
                </button>
              ))}
            </div>
          )}

          {message && <p className={styles.message}>{message}</p>}

          <div className={styles.fields}>
            <Field label="상품명 *">
              <input
                className={styles.input}
                value={form.productName}
                onChange={(e) => setForm({ ...form, productName: e.target.value })}
              />
            </Field>

            <Field label="이미지 URL">
              <input
                className={styles.input}
                value={form.imageUrl}
                onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
              />
            </Field>

            <div className={styles.row2}>
              <Field label="판매가 (원) *">
                <input
                  className={styles.input}
                  type="number"
                  value={form.salePrice}
                  onChange={(e) => setForm({ ...form, salePrice: e.target.value })}
                />
              </Field>
              <Field label="할인율 (%)">
                <input
                  className={styles.input}
                  type="number"
                  value={form.discountRate}
                  onChange={(e) => setForm({ ...form, discountRate: e.target.value })}
                />
              </Field>
            </div>

            <Field label="카테고리">
              <select
                className={styles.input}
                value={form.category}
                onChange={(e) =>
                  setForm({ ...form, category: e.target.value as CuratedCategory })
                }
              >
                {CURATED_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="제휴 링크 * (검색 선택 시 자동)">
              <input
                className={styles.input}
                value={form.affiliateUrl}
                onChange={(e) => setForm({ ...form, affiliateUrl: e.target.value })}
              />
            </Field>

            <Field label="한줄평">
              <textarea
                className={styles.textarea}
                rows={2}
                value={form.adminNote}
                onChange={(e) => setForm({ ...form, adminNote: e.target.value })}
              />
            </Field>

            <button className={styles.addBtn} onClick={handleAdd}>
              <i className="ti ti-plus" /> 추천딜에 추가
            </button>
          </div>
        </section>

        {/* 미리보기 */}
        <section className={styles.previewCol}>
          <span className={styles.previewLabel}>카드 미리보기</span>
          <div className={styles.previewBox}>
            <CuratedCard deal={preview} />
          </div>
        </section>
      </div>

      {/* 등록 목록 */}
      <section className={styles.listSection}>
        <h2>등록된 추천딜 ({list.length})</h2>
        {list.length === 0 ? (
          <p className={styles.empty}>아직 등록한 추천딜이 없어요.</p>
        ) : (
          <ul className={styles.list}>
            {list.map((d) => (
              <li key={d.id} className={styles.listItem}>
                <span className={styles.listSeq}>{d.seq}</span>
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
                    {d.category} · {d.salePrice.toLocaleString("ko-KR")}원
                  </em>
                </span>
                <button className={styles.delBtn} onClick={() => handleRemove(d.id)}>
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className={styles.field}>
      <span className={styles.fieldLabel}>{label}</span>
      {children}
    </label>
  );
}
