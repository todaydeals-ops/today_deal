// 옛 딜 RSS(/rss.xml) — 2026-10-21 개편으로 타임딜을 폐지해 종료한다(410).
// 신규 글 피드는 /magazine-rss.xml(매거진 + 생활백과)이다. 레이아웃의 RSS 링크도 그쪽으로 바꿨다.
// 이 경로는 확장자(.xml) 때문에 proxy.ts 를 거치지 않아서 여기서 직접 410 을 낸다.
export const dynamic = "force-static";

export function GET(): Response {
  return new Response("이 피드는 종료됐습니다. 새 글 피드: https://www.todaydeals.co.kr/magazine-rss.xml\n", {
    status: 410,
    headers: { "Content-Type": "text/plain; charset=utf-8", "X-Robots-Tag": "noindex" },
  });
}
