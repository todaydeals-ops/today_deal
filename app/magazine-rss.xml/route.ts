// 매거진 전용 RSS 2.0 — 네이버 서치어드바이저 RSS 제출용 + 신규 발행글 빠른 수집.
//
// ★기존 rss.xml(딜 갱신용)과 역할이 다르다. 그쪽은 /deal/[slug] 를 담는데
// 그 페이지들은 robots:{index:false} 라 애초에 색인 대상이 아니다(수시로
// 내려가는 상품 페이지라 noindex 가 맞다). RSS 로 신규 콘텐츠를 빨리 알리려는
// 목적에는 안 맞았다 — 그 목적에 맞는 건 매거진(잠자리·알약·성분·AS·협찬 전부
// 포함, 정본이 www 라 색인 대상)이라 여기 별도로 뺀다.
import { fetchMagazineList } from "@/lib/data/magazine";
import { canonicalArticleUrl } from "@/lib/magazine/owner";

export const revalidate = 600;
const SITE = "https://www.todaydeals.co.kr";

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function cdata(s: string): string {
  return `<![CDATA[${s.replace(/]]>/g, "]]&gt;")}]]>`;
}

export async function GET(): Promise<Response> {
  // all:true — 서브 미디어(잠자리·알약·성분·AS·협찬) 격리를 여기서는 끈다.
  // RSS 목적은 "신규 발행 전체를 빨리 알리는 것"이라 사이트맵과 같은 기준을 쓴다.
  const arts = await fetchMagazineList({ limit: 60, all: true, light: true });
  const now = new Date().toUTCString();

  const items = arts
    .map((a) => {
      const link = canonicalArticleUrl(a.slug);
      const desc = a.excerpt || a.subtitle || a.title;
      const pub = a.createdAt ? new Date(a.createdAt).toUTCString() : now;
      return (
        `<item>` +
        `<title>${cdata(a.title)}</title>` +
        `<link>${esc(link)}</link>` +
        `<guid isPermaLink="true">${esc(link)}</guid>` +
        `<description>${cdata(desc)}</description>` +
        `<pubDate>${pub}</pubDate>` +
        `</item>`
      );
    })
    .join("");

  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<rss version="2.0"><channel>` +
    `<title>오늘의딜 매거진 — 잠자리·알약·성분·AS·협찬연구소</title>` +
    `<link>${SITE}/magazine</link>` +
    `<description>가전·리빙·디지털 가이드부터 수면·영양·성분 검증, AS 셀프체크, 방송 협찬 기록까지 — 신규 발행 원고를 모읍니다.</description>` +
    `<language>ko-KR</language>` +
    `<lastBuildDate>${now}</lastBuildDate>` +
    items +
    `</channel></rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=600, s-maxage=600",
    },
  });
}
