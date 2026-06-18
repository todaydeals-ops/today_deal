// RSS 2.0 피드 — 네이버 서치어드바이저 RSS 제출용 + 신규 딜 빠른 수집.
// 최근 딜 스냅샷(deal_archive)을 항목으로. 10분 캐시.
import { fetchArchiveRecent } from "@/lib/data/deals";

export const revalidate = 600;
const SITE = "https://www.todaydeals.co.kr";

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function cdata(s: string): string {
  return `<![CDATA[${s.replace(/]]>/g, "]]&gt;")}]]>`;
}

export async function GET(): Promise<Response> {
  const deals = await fetchArchiveRecent(50);
  const now = new Date().toUTCString();

  const items = deals
    .map((d) => {
      const disc = d.discountRate > 0 ? `${d.discountRate}% ` : "";
      const price = `${d.salePrice.toLocaleString("ko-KR")}원`;
      const title = `${d.productName} ${disc}${price}`;
      const link = `${SITE}/deal/${d.slug}`;
      const line = d.summary || `${d.productName} · ${disc}${price} 할인 정보. 오늘의딜에서 실시간 타임딜·최저가를 비교하세요.`;
      // 네이버 권장: 이미지 링크 포함 본문 전체
      const body =
        (d.imageUrl ? `<img src="${esc(d.imageUrl)}" alt="${esc(d.productName)}" /><br/>` : "") +
        `<p>${esc(line)}</p>`;
      const pub = d.lastSeen ? new Date(d.lastSeen).toUTCString() : now;
      return (
        `<item>` +
        `<title>${cdata(title)}</title>` +
        `<link>${esc(link)}</link>` +
        `<guid isPermaLink="true">${esc(link)}</guid>` +
        `<description>${cdata(body)}</description>` +
        (d.imageUrl ? `<enclosure url="${esc(d.imageUrl)}" type="image/jpeg" />` : "") +
        `<pubDate>${pub}</pubDate>` +
        `</item>`
      );
    })
    .join("");

  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<rss version="2.0"><channel>` +
    `<title>오늘의딜 — 실시간 타임딜·특가</title>` +
    `<link>${SITE}</link>` +
    `<description>지마켓·11번가·쿠팡·알리 실시간 타임딜과 쿠팡 골드박스 특가를 매일 갱신해 모아드립니다.</description>` +
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
