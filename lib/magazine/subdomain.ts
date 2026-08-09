import { headers } from "next/headers";

// 서브 미디어 링크 베이스 — 호스트에 따라 경로를 다르게 만든다.
// 서브도메인(pill.todaydeals.co.kr)에서는 루트("/")가 /pill로 rewrite되므로 "/?cat=" 형태를 쓰고,
// 메인(www)이나 로컬에서는 "/pill?cat=" 형태를 써야 한다.
// ★서브도메인이 아직 연결되지 않은 상태에서도 링크가 죽지 않게 하는 것이 목적.
export async function pillOnSubdomain(): Promise<boolean> {
  try {
    const h = await headers();
    return (h.get("host") || "").startsWith("pill.");
  } catch {
    return false;
  }
}

export function pillHref(onSub: boolean, cat?: string, page?: number): string {
  return subHref(onSub, "/pill", cat, page);
}

// 성분연구소(beauty.todaydeals.co.kr)
export async function beautyOnSubdomain(): Promise<boolean> {
  try {
    const h = await headers();
    return (h.get("host") || "").startsWith("beauty.");
  } catch {
    return false;
  }
}

export function beautyHref(onSub: boolean, cat?: string, page?: number): string {
  return subHref(onSub, "/beauty", cat, page);
}

function subHref(onSub: boolean, base: string, cat?: string, page?: number): string {
  const q = new URLSearchParams();
  if (cat) q.set("cat", cat);
  if (page && page > 1) q.set("page", String(page));
  const s = q.toString();
  const path = onSub ? "/" : base;
  return s ? `${path}?${s}` : path;
}
