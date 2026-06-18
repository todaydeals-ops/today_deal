// 표시 닉네임 변경 — 로그인 회원. members.display_name 저장(본명 노출 방지·자유 변경).
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { COOKIE_NAME, verifySession } from "@/lib/auth/session";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest): Promise<Response> {
  const user = verifySession(req.cookies.get(COOKIE_NAME)?.value);
  if (!user) return NextResponse.json({ ok: false, error: "로그인이 필요해요." }, { status: 401 });

  let raw = "";
  try {
    raw = ((await req.json()) as { nickname?: string }).nickname || "";
  } catch {
    return NextResponse.json({ ok: false, error: "잘못된 요청" }, { status: 400 });
  }
  const nickname = raw.trim().replace(/\s+/g, " ").slice(0, 20);
  if (nickname.length < 1) return NextResponse.json({ ok: false, error: "닉네임을 입력해주세요." }, { status: 400 });

  const sb = getSupabaseAdmin();
  if (!sb) return NextResponse.json({ ok: false, error: "서버 설정 오류" }, { status: 500 });

  const { error } = await sb.from("members").update({ display_name: nickname }).eq("id", user.id);
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, nickname });
}
