// IndexNow 알림 — 새로 공개한 URL 을 네이버·빙(및 IndexNow 참여 엔진)에 바로 알린다.
//
// ★2026-10-20 실측: 네이버(searchadvisor.naver.com/indexnow)가 200, 공용 창구(api.indexnow.org)가 202 로
//   81개 URL 을 접수했다. 서치어드바이저 로그인 없이 네이버 수집을 당기는 유일한 경로다.
// ★키는 공개값이다 — 규격상 사이트 루트 /<키>.txt 로 누구나 열 수 있어야 한다(public/ 에 있음).
//   그래서 환경변수가 아니라 상수로 둔다. 키를 바꾸면 public/<키>.txt 도 같이 바꾼다.
// ★알림 실패가 발행을 막으면 안 된다. 실패는 결과로만 돌려준다.
const KEY = "322831863d4b4c45ceb683ff0034678a";
const HOST = "www.todaydeals.co.kr";
const ENDPOINTS = ["https://searchadvisor.naver.com/indexnow", "https://api.indexnow.org/indexnow"];

export async function pingIndexNow(urls: string[]): Promise<Record<string, number | string>> {
  const list = [...new Set(urls)].filter((u) => u.startsWith(`https://${HOST}/`));
  if (!list.length) return {};
  const body = JSON.stringify({ host: HOST, key: KEY, keyLocation: `https://${HOST}/${KEY}.txt`, urlList: list });
  const out: Record<string, number | string> = {};
  await Promise.all(
    ENDPOINTS.map(async (ep) => {
      try {
        const r = await fetch(ep, { method: "POST", headers: { "Content-Type": "application/json; charset=utf-8" }, body, signal: AbortSignal.timeout(8000) });
        out[new URL(ep).host] = r.status;
      } catch (e) {
        out[new URL(ep).host] = e instanceof Error ? e.message : "error";
      }
    }),
  );
  return out;
}
