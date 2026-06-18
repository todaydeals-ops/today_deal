// 현재 로그인 사용자 + 딜 잔액 + 표시 닉네임(display_name 우선). 서명 세션 쿠키 검증.
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { COOKIE_NAME, verifySession } from "@/lib/auth/session";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET(req: NextRequest): Promise<Response> {
  const user = verifySession(req.cookies.get(COOKIE_NAME)?.value);
  if (!user) return NextResponse.json({ user: null });

  let deal = 0;
  let nickname = user.nickname;
  const sb = getSupabaseAdmin();
  if (sb) {
    try {
      const { data } = await sb.from("members").select("deal_balance, display_name").eq("id", user.id).maybeSingle();
      if (data) {
        deal = Number(data.deal_balance) || 0;
        if (data.display_name?.trim()) nickname = data.display_name.trim();
      }
    } catch {
      // 무시
    }
  }
  return NextResponse.json({ user: { ...user, nickname }, deal });
}
