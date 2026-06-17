// 뉴스레터 실발송 (서버). Resend 사용. 키 없으면 시뮬레이션 폴백.
// ⚠️ 도메인 인증 전에는 발신자가 onboarding@resend.dev 여야 하고,
//    수신자는 Resend 계정 가입 이메일로만 보낼 수 있음(테스트 모드).
//    todaydeals.co.kr 도메인 인증 후 RESEND_FROM 을 그 도메인 주소로 바꾸면 임의 수신자 발송 가능.
import { Resend } from "resend";
import {
  buildNewsletterHtml,
  type NewsletterData,
} from "@/lib/email/template";

interface SendBody extends NewsletterData {
  to: string; // 수신 이메일 (현재는 테스트 수신자)
}

export async function POST(request: Request): Promise<Response> {
  let body: SendBody;
  try {
    body = (await request.json()) as SendBody;
  } catch {
    return Response.json({ ok: false, error: "잘못된 요청" }, { status: 400 });
  }

  const to = (body.to ?? "").trim();
  if (!to || !/^\S+@\S+\.\S+$/.test(to)) {
    return Response.json({ ok: false, error: "올바른 수신 이메일을 입력하세요." }, { status: 400 });
  }
  if (!body.subject?.trim()) {
    return Response.json({ ok: false, error: "제목을 입력하세요." }, { status: 400 });
  }

  const html = buildNewsletterHtml({
    subject: body.subject,
    intro: body.intro ?? "",
    winners: body.winners ?? [],
    deals: body.deals ?? [],
  });

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM || "오늘의딜 <onboarding@resend.dev>";

  // 키 미설정 → 시뮬레이션
  if (!apiKey) {
    return Response.json({
      ok: true,
      source: "mock",
      sent: 1,
      message: "RESEND_API_KEY 미설정 — 발송 시뮬레이션(실제 미발송).",
    });
  }

  try {
    const resend = new Resend(apiKey);
    const { data, error } = await resend.emails.send({
      from,
      to,
      subject: body.subject,
      html,
    });
    if (error) {
      return Response.json(
        { ok: false, source: "resend", error: error.message ?? "발송 실패" },
        { status: 200 }
      );
    }
    return Response.json({ ok: true, source: "resend", sent: 1, id: data?.id });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "발송 오류";
    return Response.json({ ok: false, source: "resend", error: msg }, { status: 200 });
  }
}
