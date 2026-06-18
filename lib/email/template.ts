// 뉴스레터 HTML 템플릿. 이메일 클라이언트 호환 위해 인라인 스타일 + 테이블 기반.
// 브랜드: 크림 배경 + 테라코타 포인트.

export interface NewsletterDeal {
  title: string;
  imageUrl?: string;
  price: number;
  discountRate?: number;
  productUrl: string;
}

export interface NewsletterWinnerBlock {
  prizeName: string;
  names: string[];
}

export interface NewsletterData {
  subject: string;
  intro: string;
  winners: NewsletterWinnerBlock[];
  deals: NewsletterDeal[];
}

const C = {
  canvas: "#FBFAF7",
  surface: "#FFFFFF",
  sunken: "#F4F1EA",
  muted: "#F1EEE8",
  strong: "#2C2A26",
  body: "#6B6760",
  faint: "#A39C8E",
  deal: "#D85A30",
  border: "#ECE8E0",
};

function won(n: number) {
  return n.toLocaleString("ko-KR");
}

// 이메일 안전한 로고 락업 (테라코타 시계 배지 + 워드마크).
// ※ 픽셀 단위 로고가 필요하면 배포 후 호스팅된 PNG로 교체: <img src="https://www.todaydeals.co.kr/logo-email.png" .../>
function logoLockup(): string {
  return `
  <table role="presentation" cellpadding="0" cellspacing="0"><tr>
    <td style="vertical-align:middle;">
      <table role="presentation" cellpadding="0" cellspacing="0"><tr>
        <td width="42" height="42" align="center" valign="middle" style="background:${C.deal};border-radius:11px;font-size:22px;line-height:42px;">🕐</td>
      </tr></table>
    </td>
    <td style="vertical-align:middle;padding-left:10px;">
      <div style="font-size:20px;font-weight:800;color:${C.strong};line-height:1.1;">오늘의딜<span style="color:${C.deal};">.</span></div>
      <div style="font-size:11px;color:${C.faint};margin-top:3px;">매일의 타임딜 · 추천 · 나눔</div>
    </td>
  </tr></table>`;
}

function dealRow(d: NewsletterDeal): string {
  const img = d.imageUrl
    ? `<img src="${d.imageUrl}" width="60" height="60" alt="" style="width:60px;height:60px;border-radius:10px;object-fit:cover;display:block;border:1px solid ${C.border};" />`
    : `<div style="width:60px;height:60px;border-radius:10px;background:${C.muted};"></div>`;
  const discount =
    typeof d.discountRate === "number"
      ? `<span style="color:${C.deal};font-weight:800;margin-right:5px;">${d.discountRate}%</span>`
      : "";
  return `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${C.border};border-radius:12px;margin-bottom:8px;">
    <tr>
      <td style="padding:10px;vertical-align:middle;width:60px;">${img}</td>
      <td style="padding:10px 8px;vertical-align:middle;">
        <div style="font-size:13px;color:${C.strong};line-height:1.4;font-weight:600;">${d.title}</div>
        <div style="font-size:15px;font-weight:800;color:${C.strong};margin-top:5px;">${discount}${won(d.price)}<span style="font-size:12px;font-weight:400;color:${C.faint};">원</span></div>
      </td>
      <td style="padding:10px;vertical-align:middle;text-align:right;white-space:nowrap;">
        <a href="${d.productUrl}" style="display:inline-block;font-size:12px;font-weight:700;color:#ffffff;background:${C.deal};text-decoration:none;border-radius:8px;padding:9px 14px;">보러가기</a>
      </td>
    </tr>
  </table>`;
}

function sectionTitle(text: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:26px 0 12px;"><tr>
    <td width="4" style="background:${C.deal};border-radius:2px;">&nbsp;</td>
    <td style="padding-left:10px;font-size:15px;font-weight:800;color:${C.strong};">${text}</td>
  </tr></table>`;
}

export function buildNewsletterHtml(data: NewsletterData): string {
  const winnersHtml =
    data.winners.length > 0
      ? `${sectionTitle("🎉 이번 주 당첨자")}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.sunken};border-radius:12px;"><tr><td style="padding:14px 16px;">
      ${data.winners
        .map(
          (w) => `<div style="font-size:13px;margin-bottom:8px;line-height:1.5;">
            <strong style="color:${C.strong};">${w.prizeName}</strong><br/>
            <span style="color:${C.deal};font-weight:700;">${w.names.join(", ")}</span>
          </div>`
        )
        .join("")}
    </td></tr></table>`
      : "";

  const dealsHtml =
    data.deals.length > 0
      ? `${sectionTitle("이번 주 꿀템 추천")}${data.deals.map(dealRow).join("")}`
      : "";

  return `<!DOCTYPE html>
<html lang="ko"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:${C.canvas};font-family:-apple-system,BlinkMacSystemFont,'Apple SD Gothic Neo','Malgun Gothic',sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.canvas};padding:24px 0;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:${C.surface};border:1px solid ${C.border};border-radius:16px;overflow:hidden;">
        <!-- 헤더 (로고 + 테라코타 액센트) -->
        <tr><td style="padding:22px 24px;background:${C.sunken};border-bottom:3px solid ${C.deal};">
          ${logoLockup()}
        </td></tr>
        <!-- 본문 -->
        <tr><td style="padding:24px;">
          <h2 style="font-size:19px;color:${C.strong};line-height:1.35;margin:0 0 12px;">${data.subject}</h2>
          <p style="font-size:14px;color:${C.body};line-height:1.7;margin:0;">${data.intro}</p>
          ${winnersHtml}
          ${dealsHtml}
        </td></tr>
        <!-- 푸터 -->
        <tr><td style="padding:18px 24px;background:${C.sunken};">
          <p style="font-size:11px;color:${C.faint};line-height:1.7;margin:0;">
            본 메일은 <strong>발신전용</strong>으로, 회신하셔도 답변되지 않습니다.<br/>
            이 메일은 마케팅 수신에 동의한 회원께 발송됩니다. 수신을 원치 않으시면 수신거부.<br/>
            이 사이트는 제휴 마케팅 활동의 일환으로 일정액의 수수료를 제공받으며, 그중 쿠팡 구매는 쿠팡 파트너스 활동의 일환으로 수수료를 제공받습니다.
          </p>
        </td></tr>
      </table>
      <div style="font-size:11px;color:${C.faint};margin-top:14px;">© 오늘의딜 · todaydeals.co.kr</div>
    </td></tr>
  </table>
</body></html>`;
}
