// ADBC CPS 포스트백 수신 엔드포인트.
// 1단계(현재): "정상 수신 확인" — 어떤 파라미터가 와도 받아서 기록하고 200 응답.
//   ADBC 요구사항: 응답 성공 = HTTP 200.
//   등록할 포스트백 URL(매크로 포함, 가이드 "2.Postback" 기준으로 매크로 추가):
//   https://www.todaydeals.co.kr/api/adbc/postback?sub1={sub1}&aff_id={aff_id}&evt_price={evt_price}&cps={cps_json}
//   (sub1=우리 회원ID, aff_id=매체[app1=오늘의딜/app2=케이콘텐츠], evt_price=구매금액, cps_json=구매정보)
// 2단계(수신 확인 후): 실제 파라미터명 확인 → 구매 +Đ / 취소 회수(주문번호 멱등) + 서명 검증.
import { getSupabaseAdmin } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

async function handle(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const params: Record<string, string> = {};
  url.searchParams.forEach((v, k) => {
    params[k] = v;
  });

  // POST 바디(JSON/폼)도 있으면 병합
  if (request.method === "POST") {
    try {
      const ct = request.headers.get("content-type") || "";
      if (ct.includes("application/json")) {
        const body = await request.json();
        if (body && typeof body === "object") Object.assign(params, body);
      } else if (ct.includes("form")) {
        const fd = await request.formData();
        fd.forEach((v, k) => {
          params[k] = String(v);
        });
      }
    } catch {
      // 바디 파싱 실패는 무시 — 수신/200이 우선
    }
  }

  // 베스트에포트 기록(테이블 없으면 무시). 실제 파라미터명 확인 + 리워드 연동에 사용.
  const sb = getSupabaseAdmin();
  if (sb) {
    try {
      await sb.from("adbc_postback").insert({
        method: request.method,
        params,
      });
    } catch {
      // adbc_postback 테이블 미생성 시 패스 — 수신 확인엔 영향 없음
    }
  }

  // ADBC 요구: 성공 시 200
  return new Response("OK", { status: 200, headers: { "Content-Type": "text/plain" } });
}

export async function GET(request: Request): Promise<Response> {
  return handle(request);
}
export async function POST(request: Request): Promise<Response> {
  return handle(request);
}
