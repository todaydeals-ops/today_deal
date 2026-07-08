// 알리익스프레스 핫딜 수집 — 네이버 쇼핑 API로 알리 상품 검색 → board_deals __pending__ 삽입.
// 사용: node scripts/collect-ali.mjs
import fs from "node:fs";
import { naverShopSearch } from "../build/ai.mjs";

(function loadEnv() {
  for (const f of ["/../.env.local", "/../crawler/.env"]) {
    try {
      const t = fs.readFileSync(`${import.meta.dirname}${f}`, "utf8");
      for (const l of t.split(/\r?\n/)) { const m = l.match(/^([A-Z0-9_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim(); }
    } catch {}
  }
})();

const S = process.env.NEXT_PUBLIC_SUPABASE_URL, K = process.env.SUPABASE_SERVICE_ROLE_KEY;
const LP_ID = process.env.LINKPRICE_AFFILIATE_ID;
if (!S || !K) { console.error("[collect-ali] SUPA env 없음"); process.exit(1); }
const H = { apikey: K, Authorization: `Bearer ${K}`, "Content-Type": "application/json" };
const rest = (p, i = {}) => fetch(`${S}/rest/v1/${p}`, { ...i, headers: { ...H, ...(i.headers || {}) } });

const aliAffiliate = (url) => LP_ID
  ? `https://bestmore.net/click.php?${new URLSearchParams({ m: "aliexpress", a: LP_ID, l: "9999", l_cd1: "3", l_cd2: "0", tu: url })}`
  : url;

const isAliUrl = (u) => { try { return new URL(u).hostname.endsWith("aliexpress.com"); } catch { return false; } };

const cleanTitle = (t) => (t || "").replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").trim();

// 네이버 쇼핑 검색 키워드 — "알리익스프레스" 전체 표기 필수 (단어 "알리"만 쓰면 SmartStore URL이 반환됨)
const QUERIES = [
  { kw: "알리익스프레스 무선이어폰 블루투스", cat: "전자기기" },
  { kw: "알리익스프레스 GaN 충전기", cat: "전자기기" },
  { kw: "알리익스프레스 스마트워치 가성비", cat: "전자기기" },
  { kw: "알리익스프레스 보조배터리 초슬림", cat: "전자기기" },
  { kw: "알리익스프레스 캠핑 텐트", cat: "아웃도어" },
  { kw: "알리익스프레스 주방 조리도구", cat: "생활용품" },
  { kw: "알리익스프레스 수납용품 가성비", cat: "생활용품" },
  { kw: "알리익스프레스 자전거 용품", cat: "스포츠" },
  { kw: "알리익스프레스 강아지 고양이 용품", cat: "반려동물" },
  { kw: "알리익스프레스 LED 조명 인테리어", cat: "리빙·인테리어" },
  { kw: "알리익스프레스 무선 마우스 키보드", cat: "전자기기" },
  { kw: "알리익스프레스 낚시 용품", cat: "스포츠" },
];

console.log("[collect-ali] 네이버 쇼핑 → 알리 핫딜 수집");

// 기존 ali 슬러그 조회
const existR = await rest("board_deals?source=eq.ali-collect&select=original_url&limit=500");
const existUrls = new Set((await existR.json()).map(x => x.original_url));
const existR2 = await rest("board_deals?slug=like.ali-*&select=slug&limit=500");
const existSlugs = new Set((await existR2.json()).map(x => x.slug));

let inserted = 0;
const rows = [];

for (const { kw, cat } of QUERIES) {
  try {
    const r = await naverShopSearch(kw, { display: 5, sort: "sim" });
    if (!r.ok || !r.items?.length) continue;

    for (const item of r.items) {
      const aliUrl = item.link;
      if (!isAliUrl(aliUrl)) continue;
      if (existUrls.has(aliUrl)) continue;

      const price = Number(item.price) || null;
      const title = cleanTitle(item.title);
      if (!title || title.length < 5) continue;

      // slug: ali-{item ID from URL}
      const idMatch = aliUrl.match(/\/item\/(\d+)/);
      const slug = idMatch ? `ali-${idMatch[1]}` : `ali-${aliUrl.replace(/[^a-z0-9]/gi, "").slice(-12).toLowerCase()}`;
      if (existSlugs.has(slug)) continue;

      const affUrl = aliAffiliate(aliUrl);
      rows.push({
        slug,
        board_type: "hot",
        category: cat,
        shop: "알리익스프레스",
        title,
        body: `알리 직구 ${price ? price.toLocaleString("ko-KR") + "원대." : "특가."} 한국 직배송 옵션 확인 후 구매 추천.`,
        price,
        source_url: affUrl,
        original_url: aliUrl,
        affiliate_url: affUrl,
        author: "__pending__",
        is_published: false,
        source: "ali-collect",
      });
      existUrls.add(aliUrl);
      existSlugs.add(slug);
    }
  } catch (e) { console.log(`  [skip] ${kw}: ${e.message}`); }
}

console.log(`  [파싱] ${rows.length}건 추출`);

if (rows.length > 0) {
  // 배치 upsert
  const pr = await rest("board_deals?on_conflict=slug", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify(rows),
  });
  if (pr.ok || pr.status === 201) {
    inserted = rows.length;
    rows.forEach(r => console.log(`  [삽입] ${r.title.slice(0, 45)} — ${r.price ? r.price.toLocaleString("ko-KR") + "원" : "가격미상"}`));
  } else {
    console.log("  [오류]", pr.status, (await pr.text()).slice(0, 100));
  }
}

console.log(`[collect-ali] 완료: ${inserted}건 삽입`);
