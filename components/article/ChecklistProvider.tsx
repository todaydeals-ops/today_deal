"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

// AS 셀프체크 아티클의 체크 상태 — 본문 체크리스트 · 사이드바 진행 카드 · 모바일 하단 CTA 가 같은 상태를 본다.
// 저장은 브라우저 localStorage 뿐이다(서버 집계 없음). 키 `td-check:{slug}`, 값 `{ n: 단계 총수, done: [체크한 단계 번호…] }`.
// 글이 고쳐져서 단계 수(n)가 달라졌으면 옛 기록은 버린다(번호가 어긋난 채 복원되는 걸 막는다).
// 읽기·쓰기 모두 try/catch — 비공개 창·저장소 차단에서도 체크 동작은 그대로 되고 저장만 안 된다.

interface ChecklistCtx {
  total: number;
  done: ReadonlySet<number>;
  count: number;
  toggle: (index: number) => void;
  /** 아직 체크하지 않은 첫 단계(모두 했으면 -1) */
  nextIndex: number;
}

const Ctx = createContext<ChecklistCtx | null>(null);

/** 체크리스트가 없는 글에서는 null */
export function useChecklist(): ChecklistCtx | null {
  return useContext(Ctx);
}

const keyOf = (slug: string) => `td-check:${slug}`;

function load(slug: string, total: number): number[] {
  try {
    const raw = window.localStorage.getItem(keyOf(slug));
    if (!raw) return [];
    const j = JSON.parse(raw) as { n?: unknown; done?: unknown };
    if (!j || j.n !== total || !Array.isArray(j.done)) return [];
    return j.done.filter((x): x is number => Number.isInteger(x) && (x as number) >= 0 && (x as number) < total);
  } catch {
    return [];
  }
}

export default function ChecklistProvider({ slug, total, children }: { slug: string; total: number; children: ReactNode }) {
  const [done, setDone] = useState<number[]>([]);

  // 서버 렌더는 전부 미체크로 나가고, 마운트 뒤에 저장된 체크를 복원한다
  useEffect(() => {
    setDone(load(slug, total));
    // 다른 탭에서 같은 글을 체크하면 따라간다
    const onStorage = (e: StorageEvent) => {
      if (e.key === keyOf(slug)) setDone(load(slug, total));
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [slug, total]);

  const toggle = useCallback(
    (index: number) => {
      const next = done.includes(index) ? done.filter((x) => x !== index) : [...done, index].sort((a, b) => a - b);
      setDone(next);
      try {
        window.localStorage.setItem(keyOf(slug), JSON.stringify({ n: total, done: next }));
      } catch {
        /* 저장 실패해도 체크는 동작한다 */
      }
    },
    [done, slug, total],
  );

  const value = useMemo<ChecklistCtx>(() => {
    const set = new Set(done);
    let next = -1;
    for (let i = 0; i < total; i++) if (!set.has(i)) { next = i; break; }
    return { total, done: set, count: set.size, toggle, nextIndex: next };
  }, [done, total, toggle]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
