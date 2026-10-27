"use client";

import { useState } from "react";
import Link from "next/link";
import styles from "@/app/home.module.css";

export interface AsGroupData {
  label: string;
  cats: { key: string; name: string; href: string; img: string; alt: string; items: string[] }[];
}

// AS 셀프체크 모듈 — 세그먼트 탭(가전/디지털/헬스·통신·자동차)이 카테고리 카드 3개를 바꾼다. 탭 전환은 즉시(애니메이션 없음).
export default function AsModule({ groups }: { groups: AsGroupData[] }) {
  const [g, setG] = useState(0);
  return (
    <>
      <div className={styles.seg} role="group" aria-label="AS 분류 묶음">
        {groups.map((t, i) => (
          <button key={t.label} type="button" aria-pressed={i === g} onClick={() => setG(i)}>{t.label}</button>
        ))}
      </div>
      <div className={styles.asGrid}>
        {groups[g].cats.map((c) => (
          <Link key={c.key} href={c.href} className={styles.asCard}>
            <span className={styles.asImg}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={c.img} alt={c.alt} width={1200} height={640} loading="lazy" decoding="async" />
            </span>
            <span className={styles.asName}>{c.name}</span>
            <span className={styles.asTags}>{c.items.map((it) => <span key={it}>{it}</span>)}</span>
            <span className={styles.asGo}>증상으로 찾기 →</span>
          </Link>
        ))}
      </div>
    </>
  );
}
