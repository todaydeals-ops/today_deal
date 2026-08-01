// 태그 없이 남아 있던 발행글 18편에 검색 태그 소급 주입 (report 코너는 성격상 제외)
// add-tags-all.mjs와 동일한 RAIL 주입 방식. 제품군·기술용어·비교대상·검색어 중심으로 구성하고,
// 브랜드가 실제로 거론되는 주제는 모델·브랜드명을 함께 넣어 검색 유입을 넓힌다.
import fs from "node:fs";
(function loadEnv() {
  try {
    const t = fs.readFileSync(`${import.meta.dirname}/../.env.local`, "utf8");
    for (const l of t.split(/\r?\n/)) { const m = l.match(/^([A-Z0-9_]+)=(.*)$/); if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].trim(); }
  } catch {}
})();
const SB = process.env.NEXT_PUBLIC_SUPABASE_URL, KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const H = { apikey: KEY, Authorization: `Bearer ${KEY}` };

const TAGS = {
  // ── 팩트체크 5 ─────────────────────────────────────
  "msg-safety-fact": ["MSG", "글루탐산나트륨", "미원", "식품첨가물", "MSG유해성", "감칠맛"],
  "natural-organic-cosmetic-fact": ["천연화장품", "유기농화장품", "무첨가", "화장품성분", "EWG등급", "저자극화장품"],
  "carbonated-water-fact": ["탄산수", "스파클링워터", "치아부식", "탄산수효능", "제로칼로리음료"],
  "gluten-free-fact": ["글루텐프리", "글루텐", "셀리악병", "밀가루알레르기", "글루텐불내증"],
  "led-mask-fact": ["LED마스크", "홈뷰티디바이스", "광테라피", "적색광", "피부관리기기", "의료기기인증"],

  // ── 스마트가이드 7 ─────────────────────────────────
  "blender-mixer-guide": ["블렌더", "믹서기", "핸드블렌더", "고속블렌더", "브레빌", "테팔", "블렌더고르는법"],
  "electric-toothbrush-guide": ["전동칫솔", "음파칫솔", "오랄비", "필립스소닉케어", "브러시헤드", "전동칫솔추천"],
  "rice-cooker-guide": ["전기밥솥", "IH압력밥솥", "쿠쿠", "쿠첸", "내솥코팅", "밥솥고르는법"],
  "tablet-vs-ereader-compare": ["태블릿", "이북리더", "전자책", "크레마", "리디페이퍼", "킨들", "전자잉크"],
  "bedding-care-longrun": ["침구관리", "이불세탁", "진드기", "베개세탁", "구스이불", "침구위생"],
  "bluetooth-speaker-soundbar-compare": ["블루투스스피커", "사운드바", "홈시어터", "JBL", "삼성사운드바", "LG사운드바"],
  "down-jacket-care-longrun": ["패딩관리", "다운점퍼", "구스다운", "덕다운", "필파워", "패딩세탁", "패딩보관"],

  // ── 트렌드랩 6 ─────────────────────────────────────
  "open-ear-earbuds-trend": ["오픈형이어폰", "귀안막는이어폰", "골전도이어폰", "에어팟", "샥즈", "오픈형무선이어폰"],
  "smart-doorbell-cam-trend": ["스마트도어벨", "홈캠", "현관카메라", "월패드", "IP카메라", "홈보안"],
  "wireless-charger-trend": ["무선충전기", "Qi충전", "맥세이프", "고속무선충전", "갤럭시무선충전"],
  "ai-speaker-trend": ["AI스피커", "인공지능스피커", "누구", "기가지니", "구글홈", "알렉사", "스마트스피커"],
  "electric-grill-trend": ["전기그릴", "실내그릴", "무연그릴", "홈파티", "전기팬", "연기없는그릴"],
  "portable-monitor-trend": ["포터블모니터", "휴대용모니터", "듀얼모니터", "USB-C모니터", "노트북서브모니터"],
};

let ok = 0, miss = 0;
for (const [slug, tags] of Object.entries(TAGS)) {
  const r = await fetch(`${SB}/rest/v1/magazine?slug=eq.${slug}&select=body_html`, { headers: H });
  const [row] = await r.json();
  if (!row) { console.log(`✗ NOT FOUND ${slug}`); miss++; continue; }
  const m = row.body_html.match(/^\s*<!--RAIL:([\s\S]*?)-->\s*/);
  let rail = {}, rest = row.body_html;
  if (m) { try { rail = JSON.parse(m[1]); } catch {} rest = row.body_html.slice(m[0].length); }
  rail.tags = tags;
  const p = await fetch(`${SB}/rest/v1/magazine?slug=eq.${slug}`, {
    method: "PATCH", headers: { ...H, "Content-Type": "application/json", Prefer: "return=minimal" },
    body: JSON.stringify({ body_html: `<!--RAIL:${JSON.stringify(rail)}-->\n${rest}` }),
  });
  if (p.status === 204) ok++; else { miss++; console.log(`✗ ${slug} HTTP ${p.status}`); }
}
console.log(`태그 주입: ${ok}편 성공 / ${miss}편 실패 (총 ${Object.keys(TAGS).length}편 시도)`);
