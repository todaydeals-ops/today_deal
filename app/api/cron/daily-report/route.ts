// 매거진 일일 리포트 — 운영자가 하루 한 번에 알아야 할 것만 메일로.
// 재고(며칠치) / 오늘 발행 / 품질 경고 / 액션 필요. 매일 08:00 KST(23:00 UTC) 발송.
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { CORNERS, cornerOf } from "@/lib/magazine/corners";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const SITE = "https://www.todaydeals.co.kr";

function authorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  if (request.headers.get("authorization") === `Bearer ${secret}`) return true;
  return new URL(request.url).searchParams.get("key") === secret;
}

const kstDate = (d = new Date()) => new Date(d.getTime() + 9 * 3600_000).toISOString().slice(0, 10);

interface Row { slug: string; title: string; corner: string; is_published: boolean; created_at: string; body_html: string }

export async function GET(request: Request): Promise<Response> {
  if (!authorized(request)) return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const sb = getSupabaseAdmin();
  if (!sb) return Response.json({ ok: false, error: "Supabase 미설정" }, { status: 500 });

  const { data } = await sb.from("magazine").select("slug,title,corner,is_published,created_at,body_html").neq("corner", "report");
  const rows = (data ?? []) as Row[];
  const today = kstDate();

  // ── 재고: 코너별 미발행 ──────────────────────────────
  const drafts = rows.filter((r) => !r.is_published);
  const stockByCorner = CORNERS.map((c) => ({
    name: c.name,
    key: c.key,
    count: drafts.filter((d) => d.corner === c.key).length,
  }));
  const totalStock = drafts.length;

  // ── 오늘 발행분 ─────────────────────────────────────
  const publishedToday = rows.filter((r) => r.is_published && kstDate(new Date(r.created_at)) === today);

  // ── 최근 7일 발행 속도 → 소진 예상 ───────────────────
  const weekAgo = Date.now() - 7 * 86400_000;
  const last7 = rows.filter((r) => r.is_published && new Date(r.created_at).getTime() >= weekAgo).length;
  const perDay = last7 / 7;
  const daysLeft = perDay > 0 ? Math.floor(totalStock / perDay) : null;

  // ── 품질 경고 ───────────────────────────────────────
  const warn: string[] = [];
  const CJK = /[㐀-䶿一-鿿Ѐ-ӿ぀-ゟ゠-ヺ]/;
  const noTags = rows.filter((r) => r.is_published && !/"tags"\s*:\s*\[[^\]]/.test(r.body_html)).length;
  const noImage = rows.filter((r) => r.is_published && !/"images"\s*:\s*\[[^\]]/.test(r.body_html)).length;
  const cjkHit = rows.filter((r) => r.is_published && CJK.test(r.body_html.replace(/<[^>]+>/g, ""))).length;
  if (noTags) warn.push(`검색 태그 없는 발행글 ${noTags}편`);
  if (noImage) warn.push(`이미지 없는 발행글 ${noImage}편`);
  if (cjkHit) warn.push(`한자·키릴 혼입 의심 ${cjkHit}편`);
  for (const s of stockByCorner) if (s.count === 0) warn.push(`${s.name} 재고 0편 — 보충 필요`);
  if (daysLeft !== null && daysLeft <= 7) warn.push(`전체 재고 ${daysLeft}일치 — 보충 시점`);

  const publishedTotal = rows.filter((r) => r.is_published).length;

  // ── 메일 본문 ───────────────────────────────────────
  const li = (s: string) => `<li style="margin:4px 0;">${s}</li>`;
  const html = `<div style="font-family:-apple-system,'Malgun Gothic',sans-serif;max-width:640px;margin:0 auto;color:#1a1a1a;line-height:1.6;">
    <h2 style="font-size:19px;margin:0 0 4px;">오늘의딜 매거진 일일 리포트</h2>
    <p style="color:#888;font-size:13px;margin:0 0 20px;">${today} (KST)</p>

    <div style="background:${warn.length ? "#fff5f1" : "#f2f8f4"};border:1px solid ${warn.length ? "#f0c3b5" : "#c8e0d0"};border-radius:10px;padding:14px 16px;margin-bottom:18px;">
      <div style="font-weight:700;font-size:14px;margin-bottom:${warn.length ? "8px" : "0"};color:${warn.length ? "#c0392b" : "#217a4b"};">
        ${warn.length ? `확인 필요 ${warn.length}건` : "이상 없음"}
      </div>
      ${warn.length ? `<ul style="margin:0;padding-left:18px;font-size:14px;">${warn.map(li).join("")}</ul>` : ""}
    </div>

    <h3 style="font-size:15px;margin:0 0 8px;">원고 재고 — 총 ${totalStock}편${daysLeft !== null ? ` (약 ${daysLeft}일치)` : ""}</h3>
    <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:20px;">
      ${stockByCorner.map((s) => `<tr>
        <td style="padding:6px 0;border-bottom:1px solid #eee;">${s.name}</td>
        <td style="padding:6px 0;border-bottom:1px solid #eee;text-align:right;font-weight:700;color:${s.count === 0 ? "#c0392b" : "#1a1a1a"};">${s.count}편</td>
      </tr>`).join("")}
    </table>

    <h3 style="font-size:15px;margin:0 0 8px;">오늘 발행 ${publishedToday.length}편</h3>
    ${publishedToday.length
      ? `<ul style="margin:0 0 20px;padding-left:18px;font-size:14px;">${publishedToday.map((p) => li(`<a href="${SITE}/magazine/${p.slug}" style="color:#1a5fb4;">${p.title}</a> <span style="color:#999;">(${cornerOf(p.corner).name})</span>`)).join("")}</ul>`
      : `<p style="font-size:14px;color:#888;margin:0 0 20px;">아직 없음</p>`}

    <h3 style="font-size:15px;margin:0 0 8px;">현황</h3>
    <p style="font-size:14px;margin:0 0 20px;">총 발행 <b>${publishedTotal}편</b> · 최근 7일 <b>${last7}편</b>(일 평균 ${perDay.toFixed(1)}편)</p>

    <p style="margin:24px 0 0;"><a href="${SITE}" style="background:#ff5a3c;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;font-weight:700;font-size:14px;display:inline-block;">매거진 보기</a></p>
    <p style="color:#aaa;font-size:12px;margin-top:22px;border-top:1px solid #eee;padding-top:12px;">
      본 메일은 발신전용으로 회신할 수 없습니다.
    </p>
  </div>`;

  // ── 발송 ────────────────────────────────────────────
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.REPORT_TO || "smart7321@gmail.com";
  const from = process.env.RESEND_FROM || "오늘의딜 <onboarding@resend.dev>";
  const subject = `[오늘의딜] 재고 ${totalStock}편${daysLeft !== null ? `(${daysLeft}일치)` : ""} · 오늘 ${publishedToday.length}편 발행${warn.length ? ` · 확인 ${warn.length}건` : ""}`;

  if (!apiKey) return Response.json({ ok: true, sent: false, reason: "RESEND_API_KEY 미설정", subject, warn });

  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ from, to, subject, html }),
  });
  const sent = r.ok;
  return Response.json({ ok: true, sent, subject, stock: totalStock, daysLeft, publishedToday: publishedToday.length, warn });
}
