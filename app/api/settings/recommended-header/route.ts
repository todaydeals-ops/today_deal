// 추천딜 헤더 설정 조회/저장 (관리자). middleware 쿠키 게이트로 보호.
import { getRecommendedHeader, saveRecommendedHeader, DEFAULT_REC_HEADER, type RecHeader } from "@/lib/data/settings";

export const runtime = "nodejs";

export async function GET(): Promise<Response> {
  const header = await getRecommendedHeader();
  return Response.json({ ok: true, header });
}

export async function POST(request: Request): Promise<Response> {
  let body: Partial<RecHeader> = {};
  try {
    body = (await request.json()) as Partial<RecHeader>;
  } catch {
    return Response.json({ ok: false, error: "잘못된 요청" }, { status: 400 });
  }
  // 기본값 위에 덮어써 누락 필드 보정
  const merged: RecHeader = { ...DEFAULT_REC_HEADER, ...body, mode: body.mode === "profile" ? "profile" : "banner" };
  if (!merged.title?.trim() && merged.mode === "banner") {
    return Response.json({ ok: false, error: "배너 제목은 필수입니다." }, { status: 400 });
  }
  const r = await saveRecommendedHeader(merged);
  return Response.json(r, { status: r.ok ? 200 : 500 });
}
