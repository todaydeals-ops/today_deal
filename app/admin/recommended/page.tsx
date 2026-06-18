"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { CuratedDeal, CuratedCategory } from "@/lib/types";
import { CURATED_CATEGORIES } from "@/lib/types";
import type { CoupangProduct } from "@/lib/coupang";
import type { RecHeader } from "@/lib/data/settings";
import CuratedCard from "@/components/CuratedCard";
import styles from "./page.module.css";

// API(/api/curated) 행(snake_case) → CuratedDeal
interface CuratedRow {
  id: string;
  seq: number;
  slug: string | null;
  product_name: string;
  category: CuratedCategory;
  image_url: string | null;
  affiliate_url: string;
  discount_rate: number | null;
  sale_price: number;
  admin_note: string | null;
  video_url: string | null;
  is_active: boolean;
}
function rowToDeal(r: CuratedRow): CuratedDeal {
  return {
    id: r.id,
    seq: r.seq,
    slug: r.slug ?? undefined,
    productName: r.product_name,
    category: r.category,
    imageUrl: r.image_url ?? undefined,
    affiliateUrl: r.affiliate_url,
    discountRate: r.discount_rate ?? undefined,
    salePrice: r.sale_price,
    adminNote: r.admin_note ?? undefined,
    videoUrl: r.video_url ?? undefined,
    isActive: r.is_active,
  };
}

interface SearchResponse {
  ok: boolean;
  source: "coupang" | "mock";
  products: CoupangProduct[];
  error?: string;
}

interface BulkApiItem {
  inputUrl: string;
  affiliateUrl: string;
  productName: string;
  imageUrl?: string;
  salePrice?: number;
  adminNote: string;
  blurbSource: "ai" | "mock";
  linkSource: "coupang" | "raw";
}

interface BulkResponse {
  ok: boolean;
  items: BulkApiItem[];
  error?: string;
}

// 일괄 등록 검토용 초안(편집 가능)
interface BulkDraft {
  key: string;
  productName: string;
  imageUrl: string;
  affiliateUrl: string;
  salePrice: string;
  discountRate: string;
  category: CuratedCategory;
  adminNote: string;
  videoUrl: string;
  blurbSource: "ai" | "mock";
  linkSource: "coupang" | "raw";
  include: boolean;
}

const EMPTY = {
  productName: "",
  imageUrl: "",
  affiliateUrl: "",
  salePrice: "",
  discountRate: "",
  category: "가전" as CuratedCategory,
  adminNote: "",
  videoUrl: "",
};

export default function AdminRecommended() {
  const [keyword, setKeyword] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<CoupangProduct[]>([]);
  const [source, setSource] = useState<"coupang" | "mock" | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [form, setForm] = useState({ ...EMPTY });
  const [genningBlurb, setGenningBlurb] = useState(false);
  const [list, setList] = useState<CuratedDeal[]>([]);

  // 일괄 등록 상태
  const [bulkText, setBulkText] = useState("");
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkMsg, setBulkMsg] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<BulkDraft[]>([]);

  // 헤더 꾸미기 상태
  const [header, setHeader] = useState<RecHeader | null>(null);
  const [savingHeader, setSavingHeader] = useState(false);
  const [headerMsg, setHeaderMsg] = useState<string | null>(null);
  function setH(patch: Partial<RecHeader>) {
    setHeader((h) => (h ? { ...h, ...patch } : h));
  }
  async function loadHeader() {
    try {
      const r = await fetch("/api/settings/recommended-header", { cache: "no-store" });
      const d = await r.json();
      if (d.ok) setHeader(d.header);
    } catch {
      // 무시
    }
  }
  async function saveHeader() {
    if (!header) return;
    setSavingHeader(true);
    setHeaderMsg(null);
    try {
      const r = await fetch("/api/settings/recommended-header", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(header),
      });
      const d = await r.json();
      setHeaderMsg(d.ok ? "✓ 헤더 저장 완료 (추천딜 페이지 즉시 반영)" : `⚠ ${d.error ?? "저장 실패"}`);
    } catch {
      setHeaderMsg("⚠ 저장 실패. 잠시 후 다시 시도해주세요.");
    } finally {
      setSavingHeader(false);
    }
  }

  // 등록 목록 = 실DB(/api/curated)
  async function reload() {
    try {
      const res = await fetch("/api/curated", { cache: "no-store" });
      const data: { ok: boolean; deals?: CuratedRow[]; error?: string } = await res.json();
      if (data.ok && data.deals) setList(data.deals.map(rowToDeal));
    } catch {
      // 무시 (네트워크 일시 오류)
    }
  }

  // 다음 추천 번호(미리보기용 — 실제 seq는 서버가 부여)
  function nextSeqLocal(): number {
    return list.reduce((acc, d) => Math.max(acc, d.seq), 0) + 1;
  }

  useEffect(() => {
    reload();
    loadHeader();
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

  // 단일 폼 한줄평 AI 생성
  async function handleGenBlurb() {
    if (!form.productName.trim()) {
      setMessage("⚠ 한줄평을 만들려면 상품명을 먼저 채워주세요.");
      return;
    }
    setGenningBlurb(true);
    try {
      const res = await fetch("/api/curated/blurb", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productName: form.productName.trim(),
          category: form.category,
          price: form.salePrice ? Number(form.salePrice) : undefined,
        }),
      });
      const data: { ok: boolean; source: "ai" | "mock"; blurb: string } = await res.json();
      if (data.blurb) {
        setForm((f) => ({ ...f, adminNote: data.blurb }));
        setMessage(
          data.source === "ai"
            ? "✓ AI 한줄평을 만들었어요. 마음에 안 들면 수정하거나 다시 생성하세요."
            : "⚠ ANTHROPIC_API_KEY 미설정 — 템플릿 한줄평이에요. 키 등록 시 AI가 생성합니다."
        );
      }
    } catch {
      setMessage("⚠ 한줄평 생성 실패. 잠시 후 다시 시도해주세요.");
    } finally {
      setGenningBlurb(false);
    }
  }

  const [adding, setAdding] = useState(false);
  async function handleAdd() {
    if (!form.productName.trim() || !form.affiliateUrl.trim() || !form.salePrice) {
      setMessage("⚠ 상품명·제휴링크·판매가는 필수입니다.");
      return;
    }
    setAdding(true);
    try {
      const res = await fetch("/api/curated", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deal: {
            productName: form.productName.trim(),
            category: form.category,
            imageUrl: form.imageUrl.trim() || undefined,
            affiliateUrl: form.affiliateUrl.trim(),
            salePrice: form.salePrice,
            discountRate: form.discountRate || undefined,
            adminNote: form.adminNote.trim() || undefined,
            videoUrl: form.videoUrl.trim() || undefined,
          },
        }),
      });
      const data: { ok: boolean; error?: string } = await res.json();
      if (!data.ok) {
        setMessage(`⚠ 등록 실패: ${data.error ?? "알 수 없는 오류"}`);
        return;
      }
      await reload();
      setForm({ ...EMPTY });
      setMessage("✓ 추천딜을 등록했어요. (공개 페이지·개별 페이지 즉시 반영)");
    } catch {
      setMessage("⚠ 등록 실패. 잠시 후 다시 시도해주세요.");
    } finally {
      setAdding(false);
    }
  }

  async function handleRemove(id: string) {
    try {
      await fetch(`/api/curated?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      await reload();
    } catch {
      setMessage("⚠ 삭제 실패. 잠시 후 다시 시도해주세요.");
    }
  }

  // ── 일괄 등록 ─────────────────────────────────────────
  async function handleBulkFetch() {
    const urls = bulkText
      .split(/[\s,]+/)
      .map((u) => u.trim())
      .filter(Boolean);
    if (urls.length === 0) {
      setBulkMsg("⚠ 쿠팡 상품 URL을 한 줄에 하나씩 붙여넣어 주세요.");
      return;
    }
    setBulkLoading(true);
    setBulkMsg(null);
    try {
      const res = await fetch("/api/curated/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ urls }),
      });
      const data: BulkResponse = await res.json();
      if (!data.ok || data.items.length === 0) {
        setBulkMsg(`⚠ ${data.error ?? "불러오기 결과가 없어요."}`);
        setDrafts([]);
        return;
      }
      const next: BulkDraft[] = data.items.map((it, i) => ({
        key: `${Date.now()}-${i}`,
        productName: it.productName,
        imageUrl: it.imageUrl ?? "",
        affiliateUrl: it.affiliateUrl,
        salePrice: it.salePrice ? String(it.salePrice) : "",
        discountRate: "",
        category: "가전",
        adminNote: it.adminNote,
        videoUrl: "",
        blurbSource: it.blurbSource,
        linkSource: it.linkSource,
        include: true,
      }));
      setDrafts(next);

      const rawLinks = next.filter((d) => d.linkSource === "raw").length;
      const noName = next.filter((d) => !d.productName).length;
      const aiCount = next.filter((d) => d.blurbSource === "ai").length;
      const notes: string[] = [`✓ ${next.length}건 불러왔어요.`];
      if (aiCount > 0) notes.push(`AI 한줄평 ${aiCount}건 생성.`);
      if (rawLinks > 0) notes.push(`⚠ 제휴링크 변환 실패 ${rawLinks}건(파트너스 키 확인) — 원본 URL로 표시.`);
      if (noName > 0) notes.push(`⚠ 상품명/이미지 미수집 ${noName}건(쿠팡 차단) — 표에서 직접 채워주세요.`);
      setBulkMsg(notes.join(" "));
    } catch {
      setBulkMsg("⚠ 일괄 불러오기 실패. 잠시 후 다시 시도해주세요.");
    } finally {
      setBulkLoading(false);
    }
  }

  function updateDraft(key: string, patch: Partial<BulkDraft>) {
    setDrafts((ds) => ds.map((d) => (d.key === key ? { ...d, ...patch } : d)));
  }

  function removeDraft(key: string) {
    setDrafts((ds) => ds.filter((d) => d.key !== key));
  }

  async function registerAll() {
    const target = drafts.filter((d) => d.include);
    const ready = target.filter(
      (d) => d.productName.trim() && d.affiliateUrl.trim() && d.salePrice
    );
    if (ready.length === 0) {
      setBulkMsg("⚠ 등록 가능한 항목이 없어요. 상품명·제휴링크·판매가를 채워주세요.");
      return;
    }
    try {
      const res = await fetch("/api/curated", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deals: ready.map((d) => ({
            productName: d.productName.trim(),
            category: d.category,
            imageUrl: d.imageUrl.trim() || undefined,
            affiliateUrl: d.affiliateUrl.trim(),
            salePrice: d.salePrice,
            discountRate: d.discountRate || undefined,
            adminNote: d.adminNote.trim() || undefined,
            videoUrl: d.videoUrl.trim() || undefined,
          })),
        }),
      });
      const data: { ok: boolean; registered?: number; error?: string } = await res.json();
      if (!data.ok) {
        setBulkMsg(`⚠ 등록 실패: ${data.error ?? "알 수 없는 오류"}`);
        return;
      }
      await reload();
      const skipped = target.length - ready.length;
      setDrafts((ds) => ds.filter((d) => !ready.includes(d)));
      setBulkMsg(
        `✓ ${data.registered ?? ready.length}건 DB 등록 완료.` +
          (skipped > 0 ? ` (필수값 부족 ${skipped}건은 남겨뒀어요.)` : "")
      );
    } catch {
      setBulkMsg("⚠ 등록 실패. 잠시 후 다시 시도해주세요.");
    }
  }

  const preview: CuratedDeal = {
    id: "preview",
    seq: nextSeqLocal(),
    productName: form.productName || "상품명 미리보기",
    category: form.category,
    imageUrl: form.imageUrl || undefined,
    affiliateUrl: form.affiliateUrl || "#",
    salePrice: form.salePrice ? Number(form.salePrice) : 0,
    discountRate: form.discountRate ? Number(form.discountRate) : undefined,
    adminNote: form.adminNote || undefined,
    videoUrl: form.videoUrl || undefined,
    isActive: true,
  };

  return (
    <main className={styles.wrap}>
      <header className={styles.head}>
        <div className={styles.brand}>
          <span className={styles.logoBadge}>
            <i className="ti ti-clock-hour-4" />
          </span>
          <div>
            <h1>
              오늘의 추천딜 <span className={styles.brandDot}>·</span> 상품등록
            </h1>
            <p className={styles.headSub}>쿠팡 상품을 검색하거나 URL로 일괄 등록하세요</p>
          </div>
        </div>
        <Link href="/recommended" className={styles.viewLink}>
          공개 페이지 보기 <i className="ti ti-external-link" />
        </Link>
      </header>

      {/* 추천딜 헤더 꾸미기 (배너/프로필) */}
      {header && (
        <section className={styles.bulkPanel}>
          <div className={styles.bulkHead}>
            <label className={styles.label}>
              <i className="ti ti-layout-navbar" /> 추천딜 헤더 꾸미기
            </label>
            <span className={styles.bulkHint}>추천딜 페이지 상단 영역 — 배너 또는 큐레이터 프로필</span>
          </div>

          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            {(["banner", "profile"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setH({ mode: m })}
                style={{
                  padding: "8px 16px",
                  borderRadius: 9,
                  border: header.mode === m ? "0" : "1px solid var(--border-soft)",
                  background: header.mode === m ? "var(--accent-deal)" : "#fff",
                  color: header.mode === m ? "#fff" : "var(--text-body)",
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                {m === "banner" ? "배너" : "큐레이터 프로필"}
              </button>
            ))}
          </div>

          <div className={styles.fields}>
            {header.mode === "banner" ? (
              <>
                <Field label="뱃지 (작은 칩)">
                  <input className={styles.input} value={header.badge ?? ""} onChange={(e) => setH({ badge: e.target.value })} placeholder="🔥 SNS 화제템" />
                </Field>
                <Field label="제목 *">
                  <input className={styles.input} value={header.title} onChange={(e) => setH({ title: e.target.value })} placeholder="오늘의딜이 추천하는 SNS 핫이슈 상품" />
                </Field>
                <Field label="부제목">
                  <input className={styles.input} value={header.subtitle} onChange={(e) => setH({ subtitle: e.target.value })} />
                </Field>
                <div className={styles.row2}>
                  <Field label="버튼 텍스트 (선택)">
                    <input className={styles.input} value={header.ctaText ?? ""} onChange={(e) => setH({ ctaText: e.target.value })} placeholder="인스타 보러가기" />
                  </Field>
                  <Field label="버튼 링크 (선택)">
                    <input className={styles.input} value={header.ctaUrl ?? ""} onChange={(e) => setH({ ctaUrl: e.target.value })} placeholder="https://..." />
                  </Field>
                </div>
              </>
            ) : (
              <>
                <Field label="이름">
                  <input className={styles.input} value={header.name ?? ""} onChange={(e) => setH({ name: e.target.value })} />
                </Field>
                <Field label="핸들 (@아이디)">
                  <input className={styles.input} value={header.handle ?? ""} onChange={(e) => setH({ handle: e.target.value })} />
                </Field>
                <Field label="소개 문구">
                  <input className={styles.input} value={header.tagline ?? ""} onChange={(e) => setH({ tagline: e.target.value })} />
                </Field>
                <Field label="인스타그램 URL">
                  <input className={styles.input} value={header.instagramUrl ?? ""} onChange={(e) => setH({ instagramUrl: e.target.value })} />
                </Field>
              </>
            )}
            <button className={styles.addBtn} onClick={saveHeader} disabled={savingHeader}>
              <i className="ti ti-device-floppy" /> {savingHeader ? "저장 중…" : "헤더 저장"}
            </button>
            {headerMsg && <p className={styles.message}>{headerMsg}</p>}
          </div>
        </section>
      )}

      {/* 일괄 등록 (쿠팡 URL 여러 개) */}
      <section className={styles.bulkPanel}>
        <div className={styles.bulkHead}>
          <label className={styles.label}>
            <i className="ti ti-list-check" /> 쿠팡 URL 일괄 등록
          </label>
          <span className={styles.bulkHint}>
            상품 URL을 한 줄에 하나씩 붙여넣기 → 제휴링크·이미지·AI 한줄평 자동 채움
          </span>
        </div>
        <textarea
          className={styles.bulkTextarea}
          rows={4}
          placeholder={"https://www.coupang.com/vp/products/...\nhttps://link.coupang.com/a/...\n..."}
          value={bulkText}
          onChange={(e) => setBulkText(e.target.value)}
        />
        <div className={styles.bulkActions}>
          <button
            className={styles.fetchBtn}
            onClick={handleBulkFetch}
            disabled={bulkLoading}
          >
            {bulkLoading ? "불러오는 중…" : "일괄 불러오기"}
          </button>
          {drafts.length > 0 && (
            <button className={styles.addBtnInline} onClick={registerAll}>
              <i className="ti ti-plus" /> 전체 등록 ({drafts.filter((d) => d.include).length})
            </button>
          )}
        </div>
        {bulkMsg && <p className={styles.message}>{bulkMsg}</p>}

        {drafts.length > 0 && (
          <div className={styles.draftList}>
            {drafts.map((d) => (
              <div
                key={d.key}
                className={`${styles.draftRow} ${d.include ? "" : styles.draftOff}`}
              >
                <label className={styles.draftCheck}>
                  <input
                    type="checkbox"
                    checked={d.include}
                    onChange={(e) => updateDraft(d.key, { include: e.target.checked })}
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
                    placeholder="상품명 (자동 수집 실패 시 직접 입력)"
                    value={d.productName}
                    onChange={(e) => updateDraft(d.key, { productName: e.target.value })}
                  />
                  <div className={styles.draftRow2}>
                    <input
                      className={styles.draftInput}
                      type="number"
                      placeholder="판매가"
                      value={d.salePrice}
                      onChange={(e) => updateDraft(d.key, { salePrice: e.target.value })}
                    />
                    <input
                      className={styles.draftInput}
                      type="number"
                      placeholder="할인율%"
                      value={d.discountRate}
                      onChange={(e) => updateDraft(d.key, { discountRate: e.target.value })}
                    />
                    <select
                      className={styles.draftInput}
                      value={d.category}
                      onChange={(e) =>
                        updateDraft(d.key, { category: e.target.value as CuratedCategory })
                      }
                    >
                      {CURATED_CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className={styles.draftNoteRow}>
                    <input
                      className={styles.draftInput}
                      placeholder="한줄평"
                      value={d.adminNote}
                      onChange={(e) => updateDraft(d.key, { adminNote: e.target.value })}
                    />
                    <span
                      className={d.blurbSource === "ai" ? styles.tagAi : styles.tagMock}
                    >
                      {d.blurbSource === "ai" ? "AI" : "템플릿"}
                    </span>
                  </div>
                  <input
                    className={styles.draftInput}
                    placeholder="쇼츠/릴스 영상 URL (선택)"
                    value={d.videoUrl}
                    onChange={(e) => updateDraft(d.key, { videoUrl: e.target.value })}
                  />
                  <span
                    className={d.linkSource === "coupang" ? styles.tagLink : styles.tagRaw}
                  >
                    {d.linkSource === "coupang" ? "제휴링크 ✓" : "원본 URL(변환 실패)"}
                  </span>
                </div>
                <button className={styles.delBtn} onClick={() => removeDraft(d.key)}>
                  <i className="ti ti-x" />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className={styles.layout}>
        {/* 입력 폼 (단건 검색·등록) */}
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
              <div className={styles.noteRow}>
                <textarea
                  className={styles.textarea}
                  rows={2}
                  value={form.adminNote}
                  onChange={(e) => setForm({ ...form, adminNote: e.target.value })}
                />
                <button
                  type="button"
                  className={styles.genBtn}
                  onClick={handleGenBlurb}
                  disabled={genningBlurb}
                  title="상품명 기반 AI 한줄평 생성"
                >
                  <i className="ti ti-sparkles" />
                  {genningBlurb ? "생성 중…" : "AI 생성"}
                </button>
              </div>
            </Field>

            <Field label="쇼츠/릴스 영상 URL (선택 — 입력 시 개별 페이지에 영상 임베드)">
              <input
                className={styles.input}
                placeholder="https://youtube.com/shorts/...  ·  instagram.com/reel/...  ·  tiktok.com/.../video/..."
                value={form.videoUrl}
                onChange={(e) => setForm({ ...form, videoUrl: e.target.value })}
              />
            </Field>

            <button className={styles.addBtn} onClick={handleAdd} disabled={adding}>
              <i className="ti ti-plus" /> {adding ? "등록 중…" : "추천딜에 추가"}
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
