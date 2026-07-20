// 매거진 초안 추가 — JSON 기사스펙(블록) → 기존과 동일 포맷 HTML 렌더 → magazine(is_published=false) 적재.
// 집필(내용)과 렌더(HTML)를 분리: 작성자는 blocks 배열만 쓰면 됨.
// 사용: node scripts/magazine-draft-add.mjs .work/articles.json
// 입력: { "articles": [ { slug, corner, field, title, subtitle, excerpt, read_min, summary:[3], callout, closing, blocks:[...] } ] }
//   blocks 타입: {t:"p",html} | {t:"h2",text,sub?} | {t:"table",headers:[],rows:[[]]} | {t:"numlist",items:[]} | {t:"dtree",title,q1,yes,q2,ya,na}
//   인라인 강조는 html에 <b style="font-weight:700;">…</b> 직접(또는 B 사용 불가하니 태그로).
import fs from "node:fs";
(function loadEnv() {
  try { const t = fs.readFileSync(`${import.meta.dirname}/../.env.local`, "utf8");
    for (const l of t.split(/\r?\n/)) { const m = l.match(/^([A-Z0-9_]+)=(.*)$/); if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].trim(); } } catch {}
})();
const SUPA = process.env.NEXT_PUBLIC_SUPABASE_URL, KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPA || !KEY) { console.error("SUPA env 필요"); process.exit(1); }

/* ---------- 헬퍼 (magazine-drafts.mjs와 동일 토큰) ---------- */
const P0 = (t) => `<p style="font-size:18px; line-height:1.95; color:#2c2a24; margin:0;">${t}</p>`;
const P = (t) => `<p style="font-size:18px; line-height:1.95; color:#2c2a24; margin:18px 0 0;">${t}</p>`;
const H2 = (t) => `<h2 style="font-family:'Noto Serif KR',serif; font-weight:700; font-size:27px; letter-spacing:-0.6px; line-height:1.3; margin:44px 0 0; color:#16140f;">${t}</h2>`;
const SUB = (t) => `<p style="font-size:15px; line-height:1.8; color:#76726b; margin:10px 0 22px;">${t}</p>`;
const TABLE = (headers, rows) => {
  const gtc = headers.map((_, i) => (i === 0 ? "0.95fr" : "1fr")).join(" ");
  const head = `<div style="display:grid; grid-template-columns:${gtc}; background:#16140f; color:#fff; font-family:'JetBrains Mono',monospace; font-size:11px;">${headers.map((h) => `<div style="padding:12px 14px;">${h}</div>`).join("")}</div>`;
  const body = rows.map((row, ri) => `<div style="display:grid; grid-template-columns:${gtc}; border-top:1px solid rgba(22,20,15,0.08); font-size:13px;${ri % 2 ? " background:#faf8f5;" : ""}">${row.map((c, ci) => `<div style="padding:12px 14px; line-height:1.55;${ci === 0 ? " font-weight:700; color:#16140f;" : " color:#46433d;"}">${c}</div>`).join("")}</div>`).join("");
  return `<div style="border:1px solid rgba(22,20,15,0.14); border-radius:12px; overflow:hidden;">${head}${body}</div>`;
};
const NUMLIST = (color, items) => `<div style="margin-top:16px; border-top:1px solid rgba(22,20,15,0.12);">${items.map((t, i) => `<div style="display:flex; gap:14px; padding:15px 2px;${i < items.length - 1 ? " border-bottom:1px solid rgba(22,20,15,0.08);" : ""}"><span style="font-family:'JetBrains Mono',monospace; font-weight:700; font-size:13px; color:${color}; flex:none;">${String(i + 1).padStart(2, "0")}</span><span style="font-size:16px; line-height:1.6; color:#33312d;">${t}</span></div>`).join("")}</div>`;
const DTREE = ({ title, q1, yes, q2, ya, na }) => `<div style="border:1px solid rgba(22,20,15,0.14); border-radius:16px; padding:24px; margin:26px 0 0; background:#fcfbf9;">
  <div style="display:flex; align-items:center; gap:8px; margin-bottom:18px;"><span style="font-family:'JetBrains Mono',monospace; font-size:11px; font-weight:700; letter-spacing:1px; color:#ff5a3c;">DECISION TREE</span><span style="font-size:13px; font-weight:700; color:#16140f;">${title}</span></div>
  <div style="background:#ff5a3c; color:#fff; border-radius:10px; padding:13px 16px; font-size:14px; font-weight:700; line-height:1.45;">${q1}</div>
  <div style="display:grid; grid-template-columns:1fr 1fr; gap:14px; margin-top:12px;">
    <div style="display:flex; flex-direction:column; align-items:center; gap:8px;"><span style="font-family:'JetBrains Mono',monospace; font-size:11px; font-weight:700; color:#6f6b64;">YES ↓</span><div style="width:100%; text-align:center; border:1.5px solid #d8d2c7; color:#16140f; background:#fff; border-radius:9px; padding:12px; font-size:13.5px; font-weight:700; line-height:1.4;">${yes}</div></div>
    <div style="display:flex; flex-direction:column; align-items:center; gap:8px;"><span style="font-family:'JetBrains Mono',monospace; font-size:11px; font-weight:700; color:#9a9286;">NO ↓</span><div style="width:100%; background:#16140f; color:#fff; border-radius:9px; padding:12px 14px; font-size:13.5px; font-weight:700; line-height:1.4;">${q2}</div><div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; width:100%; margin-top:2px;"><div style="text-align:center; border:1.5px solid #d8d2c7; color:#16140f; background:#fff; border-radius:9px; padding:10px 6px; font-size:12px; font-weight:700; line-height:1.35;">${ya}</div><div style="text-align:center; border:1.5px solid #d8d2c7; color:#16140f; background:#fff; border-radius:9px; padding:10px 6px; font-size:12px; font-weight:700; line-height:1.35;">${na}</div></div></div>
  </div>
</div>`;
const WRAP = (h) => `<div style="margin-top:22px;">${h}</div>`;
const TEAL = "#1f6b66", SMART = "#e0481f", INDIGO = "#38539a", OLIVE = "#7a5f2e", PURPLE = "#6e4690";
const CORNER_COLOR = { smartguide: SMART, factcheck: TEAL, trendlab: PURPLE, repair: INDIGO };

function renderBlock(b, corner, idx) {
  switch (b.t) {
    case "p": return idx === 0 ? P0(b.html) : P(b.html);
    case "h2": return H2(b.text) + (b.sub ? SUB(b.sub) : "");
    case "table": return WRAP(TABLE(b.headers, b.rows));
    case "numlist": return NUMLIST(CORNER_COLOR[corner] || INDIGO, b.items);
    case "dtree": return DTREE(b);
    default: return "";
  }
}

const file = process.argv[2];
if (!file) { console.error("입력 JSON 파일 경로 필요"); process.exit(1); }
const data = JSON.parse(fs.readFileSync(file, "utf8"));
const articles = Array.isArray(data) ? data : data.articles ?? [];

// 재적재(수정본 덮어쓰기) 시 기존 RAIL의 images를 잃지 않도록 미리 읽어둔다.
// ⚠️ 이 보존이 없으면 글을 손볼 때마다 이미지가 사라져 재수집해야 한다.
const keepImages = new Map();
{
  const slugs = articles.map((a) => a.slug).filter(Boolean);
  if (slugs.length) {
    const q = `slug=in.(${slugs.map((s) => `"${s}"`).join(",")})&select=slug,body_html`;
    try {
      const res = await fetch(`${SUPA}/rest/v1/magazine?${q}`, { headers: { apikey: KEY, Authorization: `Bearer ${KEY}` } });
      for (const row of (await res.json()) ?? []) {
        const m = String(row.body_html || "").match(/^\s*<!--RAIL:([\s\S]*?)-->/);
        if (!m) continue;
        try {
          const rail = JSON.parse(m[1]);
          if (Array.isArray(rail.images) && rail.images.length) keepImages.set(row.slug, rail.images);
        } catch { /* 무시 */ }
      }
      if (keepImages.size) console.log(`기존 이미지 보존: ${keepImages.size}편`);
    } catch { /* 조회 실패 시 그냥 진행 */ }
  }
}
const VALID_CORNERS = ["smartguide", "factcheck", "trendlab", "repair"];
const rows = [];
for (const a of articles) {
  if (!a.slug || !a.title || !Array.isArray(a.blocks) || !VALID_CORNERS.includes(a.corner)) { console.error("스킵(필수누락/코너오류):", a.slug); continue; }
  const main = a.blocks.map((b, i) => renderBlock(b, a.corner, i)).filter(Boolean);
  rows.push({
    slug: a.slug, corner: a.corner, field: a.field || "리빙·주방", title: a.title, subtitle: a.subtitle || "",
    excerpt: a.excerpt || "", read_min: a.read_min || 8,
    body_html: `<!--RAIL:${JSON.stringify({
      summary: a.summary || [], callout: a.callout || "", faq: a.faq || [],
      sources: a.sources || [], tags: a.tags || [],
      ...(a.images?.length ? { images: a.images } : keepImages.has(a.slug) ? { images: keepImages.get(a.slug) } : {}),
    })}-->\n` + main.join("\n").trim(),
    closing: a.closing || "", is_published: false, created_at: a.date || new Date().toISOString(),
  });
}
if (!rows.length) { console.error("적재할 기사 없음"); process.exit(1); }
const res = await fetch(`${SUPA}/rest/v1/magazine?on_conflict=slug`, {
  method: "POST",
  headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": "application/json", Prefer: "resolution=merge-duplicates,return=minimal" },
  body: JSON.stringify(rows),
});
console.log(`초안 적재: HTTP ${res.status} · ${rows.length}편 (is_published=false)`);
if (!res.ok) console.error((await res.text()).slice(0, 200));
else console.log("슬러그:", rows.map((r) => r.slug).join(", "));
