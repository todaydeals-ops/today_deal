// 뉴스레터 발송 어댑터. 지금은 목(mock). 추후 Resend(기획안 8.1)로 교체.
//   - 실제: Resend API로 마케팅 동의 회원에게 발송 + 수신거부 링크/발송 로그
// UI는 이 인터페이스만 의존하므로 어댑터만 교체하면 됨.

export interface NewsletterPayload {
  subject: string;
  recipientCount: number;
}

export interface EmailAdapter {
  readonly name: string;
  send(payload: NewsletterPayload): Promise<{ sent: number }>;
}

export const mockEmailAdapter: EmailAdapter = {
  name: "mock",
  send(payload) {
    return new Promise((resolve) => {
      setTimeout(() => resolve({ sent: payload.recipientCount }), 1200);
    });
  },
};

// 실제 사용 어댑터 (교체 지점)
export const emailAdapter: EmailAdapter = mockEmailAdapter;
