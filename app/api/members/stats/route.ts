// 회원 통계 (관리자용) — middleware 쿠키 게이트로 보호.
import { getMemberStats } from "@/lib/data/members";

export const runtime = "nodejs";

export async function GET(): Promise<Response> {
  const stats = await getMemberStats();
  return Response.json({ ok: true, ...stats });
}
