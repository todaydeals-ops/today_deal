"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";

export default function AdminLogin() {
  const router = useRouter();
  const [id, setId] = useState("");
  const [pw, setPw] = useState("");
  const [next, setNext] = useState("/admin");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const n = new URLSearchParams(window.location.search).get("next");
    if (n && n.startsWith("/")) setNext(n);
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErr("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: id.trim(), pw }),
      });
      const data: { ok: boolean; error?: string } = await res.json();
      if (data.ok) {
        router.replace(next);
        router.refresh();
      } else {
        setErr(data.error || "로그인에 실패했습니다.");
      }
    } catch {
      setErr("요청에 실패했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className={styles.wrap}>
      <form className={styles.card} onSubmit={submit}>
        <div className={styles.brand}>
          <span className={styles.logo}>
            <i className="ti ti-clock-hour-4" />
          </span>
          <span className={styles.brandName}>
            오늘의딜 <em>관리자</em>
          </span>
        </div>
        <h1 className={styles.title}>
          <i className="ti ti-lock" /> 관리자 로그인
        </h1>

        <label className={styles.field}>
          <span>아이디</span>
          <input
            className={styles.input}
            value={id}
            onChange={(e) => setId(e.target.value)}
            placeholder="admin"
            autoComplete="username"
            autoFocus
          />
        </label>
        <label className={styles.field}>
          <span>비밀번호</span>
          <input
            className={styles.input}
            type="password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            placeholder="••••••••"
            autoComplete="current-password"
          />
        </label>

        {err && <p className={styles.err}>{err}</p>}

        <button className={styles.submit} type="submit" disabled={loading}>
          {loading ? "확인 중…" : "로그인"}
        </button>
        <p className={styles.note}>관리자 전용 페이지입니다.</p>
      </form>
    </main>
  );
}
