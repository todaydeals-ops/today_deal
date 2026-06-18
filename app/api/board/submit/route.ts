// 공개(무가입) 핫딜 제보 — 검토 대기(is_published=false)로 접수. 에이전트 승인 후 게시.
// proxy matcher의 "/api/board"(정확매칭)에 안 걸려서 공개. 허니팟 스팸가드.
import crypto from "node:crypto";
import { cookies } from "next/headers";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { COOKIE_NAME, verifySession } from "@/lib/auth/session";

export const runtime = "nodejs";

const BOARD_TYPE_KEYS = ["hot", "overseas", "free", "coupon"];

interface Input {
  url?: string;
  title?: string;
  boardType?: string;
  shop?: string;
  category?: string;
  price?: number | string;
  shipping?: string;
  imageUrl?: string;
  body?: string;
  author?: string;
  hp?: string; // 허니팟
}

function boardSlug(title: string): string {
  const base = (title || "")
    .toLowerCase()
    .replace(/[^가-힣a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40)
    .replace(/-+$/g, "");
  return `${base || "deal"}-${crypto.randomBytes(3).toString("hex")}`;
}
const num = (v: unknown): number | null => {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : null;
};

export async function POST(request: Request): Promise<Response> {
  let d: Input = {};
  try {
    d = ((await request.json()) as { deal?: Input }).deal ?? {};
  } catch {
    return Response.json({ ok: false, error: "잘못된 요청" }, { status: 400 });
  }
  // 허니팟: 봇이 채우면 성공인 척 조용히 버림
  if (d.hp && d.hp.trim() !== "") return Response.json({ ok: true, pending: true });

  const url = (d.url || "").trim();
  if (!url || !/^https?:\/\//i.test(url)) {
    return Response.json({ ok: false, error: "올바른 링크(URL)를 넣어주세요." }, { status: 400 });
  }
  if (!d.title?.trim()) {
    return Response.json({ ok: false, error: "제목을 불러오거나 입력해주세요." }, { status: 400 });
  }

  const sb = getSupabaseAdmin();
  if (!sb) return Response.json({ ok: false, error: "서버 설정 오류" }, { status: 500 });

  // 로그인 회원이 제보하면 submitter 기록 → 승인 시 딜 적립
  let submitterId: string | null = null;
  try {
    const c = await cookies();
    submitterId = verifySession(c.get(COOKIE_NAME)?.value)?.id ?? null;
  } catch {
    submitterId = null;
  }

  const row = {
    slug: boardSlug(d.title.trim()),
    board_type: BOARD_TYPE_KEYS.includes(d.boardType ?? "") ? d.boardType : "hot",
    title: d.title.trim().slice(0, 200),
    shop: d.shop?.trim()?.slice(0, 60) || null,
    category: d.category?.trim() || null,
    price: num(d.price),
    shipping: d.shipping?.trim()?.slice(0, 30) || null,
    image_url: d.imageUrl?.trim() || null,
    source_url: url,
    original_url: url,
    body: d.body?.trim()?.slice(0, 1000) || null,
    author: d.author?.trim()?.slice(0, 20) || "익명 제보",
    submitter_id: submitterId,
    is_published: false, // 검토 대기
  };
  const { error } = await sb.from("board_deals").insert(row);
  if (error) return Response.json({ ok: false, error: error.message }, { status: 500 });
  return Response.json({ ok: true, pending: true });
}
