"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./BoardSubmit.module.css";

const BOARD_TYPES = [
  { key: "hot", label: "핫딜" },
  { key: "free", label: "무료/이벤트" },
  { key: "coupon", label: "쿠폰/적립" },
];
const BOARD_CATEGORIES = ["전자/IT", "식품", "생활/주방", "패션/뷰티", "해외직구", "기타"];

interface Me {
  nickname: string;
}

export default function BoardSubmit({ defaultType = "hot" }: { defaultType?: string }) {
  const [me, setMe] = useState<Me | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [fetching, setFetching] = useState(false);
  const [fetchedFor, setFetchedFor] = useState(""); // 마지막으로 불러온 URL(중복 호출 방지)
  const [imageUrl, setImageUrl] = useState("");
  const [hp, setHp] = useState(""); // 허니팟
  const [detail, setDetail] = useState(false); // 상세 입력 펼침
  const [form, setForm] = useState({
    title: "",
    shop: "",
    category: "전자/IT",
    price: "",
    boardType: defaultType,
    body: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);

  // 로그인 상태 확인
  useEffect(() => {
    let on = true;
    (async () => {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        const d: { user?: { nickname?: string } | null } = await res.json();
        if (on && d.user) setMe({ nickname: d.user.nickname || "회원" });
      } catch {
        // 무시
      } finally {
        if (on) setAuthReady(true);
      }
    })();
    return () => {
      on = false;
    };
  }, []);

  function set<K extends keyof typeof form>(k: K, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function loginToPost() {
    const here = window.location.pathname + window.location.search;
    window.location.href = `/api/auth/kakao/login?returnTo=${encodeURIComponent(here)}`;
  }

  // 링크만 넣으면 자동으로 메타(제목·이미지·쇼핑몰·가격) 채움
  async function fetchMeta(target?: string) {
    const u = (target ?? url).trim();
    if (!u || u === fetchedFor) return;
    setFetching(true);
    setMsg(null);
    setFetchedFor(u);
    try {
      const res = await fetch("/api/board/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: u }),
      });
      const d = await res.json();
      if (!d.ok) {
        setMsg("불러오기에 실패했어요 — 제목만 직접 적어도 올릴 수 있어요.");
        if (titleRef.current) titleRef.current.focus();
        return;
      }
      setForm((f) => ({
        ...f,
        title: d.title || f.title,
        shop: d.shop || f.shop,
        price: d.price ? String(d.price) : f.price,
      }));
      setImageUrl(d.imageUrl || "");
      setMsg(d.partial ? "일부만 불러왔어요 — 제목 확인 후 올리세요." : null);
    } catch {
      setMsg("불러오기에 실패했어요 — 제목만 적어도 올릴 수 있어요.");
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
            author: me?.nickname || undefined,
            hp,
          },
        }),
      });
      const d = await res.json();
      if (!d.ok) {
        if (res.status === 401) {
          setMsg("⚠ 로그인이 필요해요.");
          setMe(null);
          return;
        }
        setMsg(`⚠ 등록 실패: ${d.error ?? "오류"}`);
        return;
      }
      setDone(true);
    } catch {
      setMsg("⚠ 등록 실패. 잠시 후 다시 시도해주세요.");
    } finally {
      setSubmitting(false);
    }
  }

  function reset(keepOpen: boolean) {
    setDone(false);
    setUrl("");
    setFetchedFor("");
    setImageUrl("");
    setDetail(false);
    setForm({ title: "", shop: "", category: "전자/IT", price: "", boardType: defaultType, body: "" });
    setOpen(keepOpen);
  }

  // 접힌 상태 — 로그인 여부에 따라 버튼 문구가 다름
  if (!open) {
    return (
      <button className={styles.openBtn} onClick={() => (me ? setOpen(true) : loginToPost())} disabled={!authReady}>
        <i className="ti ti-plus" />{" "}
        {me ? (
          <>
            핫딜 올리기 <span className={styles.openHint}>(+5딜 적립)</span>
          </>
        ) : (
          <>
            로그인하고 핫딜 올리기 <span className={styles.openHint}>(글 1개당 +5딜)</span>
          </>
        )}
      </button>
    );
  }

  // 혹시 모를 세션 만료 — 폼을 열었는데 비로그인
  if (!me) {
    return (
      <div className={styles.box}>
        <p className={styles.doneMsg}>
          <i className="ti ti-lock" /> 핫딜 글쓰기는 로그인 후 이용할 수 있어요. (글 1개당 +5딜)
        </p>
        <button className={styles.submitBtn} onClick={loginToPost}>
          <i className="ti ti-message-circle-2" /> 카카오로 로그인
        </button>
      </div>
    );
  }

  if (done) {
    return (
      <div className={styles.box}>
        <p className={styles.doneMsg}>
          <i className="ti ti-circle-check" /> 등록 완료! 검토 후 게시되며, 게시되면 <strong>+5딜</strong>이 적립돼요 🙌
        </p>
        <button className={styles.openBtn} onClick={() => reset(true)}>
          <i className="ti ti-plus" /> 하나 더 올리기
        </button>
      </div>
    );
  }

  const isHot = form.boardType === "hot";

  return (
    <div className={styles.box}>
      <div className={styles.boxHead}>
        <strong>{isHot ? "핫딜" : "글"} 올리기 · {me.nickname}님</strong>
        <button className={styles.close} onClick={() => reset(false)} aria-label="닫기">
          <i className="ti ti-x" />
        </button>
      </div>

      <label className={styles.label}>
        {isHot ? "핫딜 링크만 붙여넣으면 자동으로 채워져요" : "링크를 붙여넣고 내용을 적어주세요"}
      </label>
      <div className={styles.urlRow}>
        <input
          className={styles.input}
          placeholder="https://... 핫딜 상품/이벤트 링크"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onBlur={() => fetchMeta()}
          onPaste={(e) => {
            const t = e.clipboardData.getData("text");
            if (t) setTimeout(() => fetchMeta(t), 0);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              fetchMeta();
            }
          }}
        />
        <button className={styles.fetchBtn} onClick={() => fetchMeta()} disabled={fetching}>
          {fetching ? "불러오는 중…" : "불러오기"}
        </button>
      </div>

      {/* 제목은 항상 입력 가능 — 네이버 등 미리보기 차단 사이트도 직접 적어 올릴 수 있게 */}
      <div className={styles.preview}>
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt="" />
        ) : (
          <span className={styles.noImg}>
            <i className={fetching ? "ti ti-loader-2" : "ti ti-photo"} />
          </span>
        )}
        <input
          ref={titleRef}
          className={styles.input}
          placeholder={fetching ? "제목 불러오는 중…" : "제목 (필수) — 자동으로 안 채워지면 직접 적어주세요"}
          value={form.title}
          onChange={(e) => set("title", e.target.value)}
        />
      </div>

      {/* 보드 종류는 기본 = 현재 탭, 한 줄로 */}
      <select className={styles.input} value={form.boardType} onChange={(e) => set("boardType", e.target.value)}>
        {BOARD_TYPES.map((t) => (
          <option key={t.key} value={t.key}>
            {t.label} 게시판에 올리기
          </option>
        ))}
      </select>

      {isHot ? (
        <>
          {/* 핫딜 = 쇼핑 전용 필드(선택) 접어둠 */}
          <button type="button" className={styles.detailToggle} onClick={() => setDetail((v) => !v)}>
            <i className={`ti ${detail ? "ti-chevron-up" : "ti-chevron-down"}`} /> 상세 입력 (쇼핑몰·가격·설명, 선택)
          </button>
          {detail && (
            <>
              <div className={styles.grid2}>
                <select className={styles.input} value={form.category} onChange={(e) => set("category", e.target.value)}>
                  {BOARD_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                <input className={styles.input} placeholder="쇼핑몰" value={form.shop} onChange={(e) => set("shop", e.target.value)} />
                <input
                  className={styles.input}
                  type="number"
                  placeholder="가격(원)"
                  value={form.price}
                  onChange={(e) => set("price", e.target.value)}
                />
              </div>
              <textarea
                className={styles.textarea}
                rows={2}
                placeholder="한줄 설명(선택)"
                value={form.body}
                onChange={(e) => set("body", e.target.value)}
              />
            </>
          )}
        </>
      ) : (
        /* 일반 게시판(직구·이벤트·쿠폰) = 링크 + 텍스트 */
        <textarea
          className={styles.textarea}
          rows={5}
          placeholder="내용을 적어주세요 — 혜택·조건·기간·이용 방법 등"
          value={form.body}
          onChange={(e) => set("body", e.target.value)}
        />
      )}

      {/* 허니팟 (사람에겐 안 보임) */}
      <input className={styles.hp} tabIndex={-1} autoComplete="off" value={hp} onChange={(e) => setHp(e.target.value)} aria-hidden />

      {msg && <p className={styles.msg}>{msg}</p>}
      <button className={styles.submitBtn} onClick={submit} disabled={submitting || fetching}>
        {submitting ? "올리는 중…" : "핫딜 올리기"}
      </button>
      <p className={styles.policy}>
        검토 후 게시되며, 게시되면 +5딜이 적립돼요. 타 사이트 홍보·개인 제휴링크는 정책에 따라 정규화될 수 있어요.
        <br />
        ⚠ 허위·스팸·악성 게시물은 게시 삭제 및 <strong>적립 딜 회수, 이용 제한(탈퇴) 처리</strong>될 수 있어요.
      </p>
    </div>
  );
}
