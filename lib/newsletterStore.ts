// 뉴스레터 발송 내역 (데모용 localStorage). 추후 Supabase 발송 로그 테이블로 교체.

export interface SentRecord {
  id: string;
  subject: string;
  sent: number; // 발송 수
  at: string; // 발송 시각(표시용)
}

const KEY = "oneuldeal_newsletter_sent_v1";

export function getHistory(): SentRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as SentRecord[]) : [];
  } catch {
    return [];
  }
}

export function addHistory(record: SentRecord): SentRecord[] {
  const next = [record, ...getHistory()].slice(0, 20);
  if (typeof window !== "undefined") {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  }
  return next;
}

// 마케팅 동의 회원 수 (데모용 베이스 + 현재 회원 동의 여부)
export function estimateRecipients(myConsent: boolean): number {
  const BASE = 1284;
  return BASE + (myConsent ? 1 : 0);
}
