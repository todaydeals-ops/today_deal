"use client";

import { useCallback, useEffect, useState } from "react";
import s from "@/app/wiki/[slug]/wiki-detail.module.css";
import { inlineHtml } from "./inline";

// 준비물 체크 리스트(시안 03 "신청 순서와 준비물"의 준비물 박스) — 섹션 제목이 준비물 계열이고 블록이 list 일 때만 쓴다.
// 저장은 이 브라우저의 localStorage 뿐이다(서버 집계 없음). 키 `td-wiki-check:{slug}`,
//   값 `{ [묶음 id]: { n: 항목 수, done: [체크한 항목 번호…] } }` — 한 항목 안에 준비물 목록이 둘 이상이어도 한 키로 합친다.
// 원고가 고쳐져 항목 수(n)가 달라졌으면 옛 기록은 버린다(번호가 어긋난 채 복원되는 걸 막는다).
// 서버 렌더는 전부 미체크로 나가고 마운트 뒤에 복원한다(하이드레이션 불일치 방지, 아티클 체크리스트와 같은 방식).
// 읽기·쓰기 모두 try/catch — 비공개 창·저장소 차단에서도 체크는 되고 저장만 안 된다.

type Saved = Record<string, { n: number; done: number[] }>;
const keyOf = (slug: string) => `td-wiki-check:${slug}`;

function readAll(slug: string): Saved {
  try {
    const raw = window.localStorage.getItem(keyOf(slug));
    if (!raw) return {};
    const j = JSON.parse(raw) as unknown;
    return j && typeof j === "object" && !Array.isArray(j) ? (j as Saved) : {};
  } catch {
    return {};
  }
}

function load(slug: string, group: string, total: number): number[] {
  const g = readAll(slug)[group];
  if (!g || g.n !== total || !Array.isArray(g.done)) return [];
  return g.done.filter((x): x is number => Number.isInteger(x) && x >= 0 && x < total);
}

export default function PrepChecklist({
  slug,
  group,
  title,
  items,
}: {
  slug: string;
  /** 항목 안에서 이 목록을 가리키는 id(섹션·블록 번호) */
  group: string;
  /** 박스 제목("준비물" 등) */
  title: string;
  /** 원고 한 줄씩(굵게 **만 허용) */
  items: string[];
}) {
  const total = items.length;
  const [done, setDone] = useState<number[]>([]);

  useEffect(() => {
    setDone(load(slug, group, total));
    // 다른 탭에서 같은 항목을 체크하면 따라간다
    const onStorage = (e: StorageEvent) => {
      if (e.key === keyOf(slug)) setDone(load(slug, group, total));
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [slug, group, total]);

  const toggle = useCallback(
    (i: number) => {
      const next = done.includes(i) ? done.filter((x) => x !== i) : [...done, i].sort((a, b) => a - b);
      setDone(next);
      try {
        const all = readAll(slug);
        all[group] = { n: total, done: next };
        window.localStorage.setItem(keyOf(slug), JSON.stringify(all));
      } catch {
        /* 저장 실패해도 체크는 동작한다 */
      }
    },
    [done, slug, group, total],
  );

  const set = new Set(done);
  const titleId = `prep-${group}`;
  return (
    <div className={s.prep} role="group" aria-labelledby={titleId}>
      <div className={s.prepHead}>
        <span className={s.prepTitle} id={titleId}>{title}</span>
        <span className={s.prepCount} aria-live="polite">
          {set.size} / {total} 확인
        </span>
      </div>
      <ul className={s.prepList}>
        {items.map((t, i) => {
          const on = set.has(i);
          return (
            <li key={i}>
              <label className={`${s.prepItem} ${on ? s.prepOn : ""}`}>
                <input type="checkbox" className={s.prepInput} checked={on} onChange={() => toggle(i)} />
                <span className={s.prepBox} aria-hidden="true">{on ? "✓" : ""}</span>
                <span className={s.prepText} dangerouslySetInnerHTML={{ __html: inlineHtml(t) }} />
              </label>
            </li>
          );
        })}
      </ul>
      <p className={s.prepHint}>확인한 항목은 이 기기의 브라우저에만 저장돼요.</p>
    </div>
  );
}
