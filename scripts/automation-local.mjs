// 로컬(맥스) 드레인 — 창 열림 동안 대기 콘텐츠를 '내가(세션)' 생성하기 위한 보조 CLI.
// 서버 크론은 하트비트가 신선하면 API를 쓰지 않고 비켜준다(lib/automation).
//
// 사용:
//   node scripts/automation-local.mjs beat          # 하트비트 갱신(창 열림 표시)
//   node scripts/automation-local.mjs fetch [n]      # 대기 게시글+한줄평 배치를 JSON으로 출력(+beat)
//   node scripts/automation-local.mjs apply <file>   # 결과 JSON을 DB에 반영(+beat)
// 환경: SUPA_URL, SUPA_KEY(service role)
//
// apply 입력 JSON 형식:
//   { "posts":[{"id","slug","title","body"}...], "blurbs":[{"slug","summary"}...] }

const URL = process.env.SUPA_URL, KEY = process.env.SUPA_KEY;
if (!URL || !KEY) { console.error("SUPA_URL/SUPA_KEY 필요"); process.exit(1); }
const H = { apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" };
const rest = (path, init = {}) => fetch(`${URL}/rest/v1/${path}`, { ...init, headers: { ...H, ...(init.headers || {}) } });
const PENDING = "__pending__";

// 페르소나(lib/board/personas.ts와 동일 매핑: hash(slug)%61)
const PERSONAS = [
  ["가성비요정","가성비를 따지는 알뜰한 말투"],["지름신강림","텐션 높고 충동구매 부추기는 말투"],["짠테크중","절약·짠테크, 차분 실용 말투"],["직구고인물","해외직구 베테랑 정보형 말투"],["육아템헌터","육아맘 시점 따뜻한 말투"],["자취8년차","자취 현실공감 담백한 말투"],["캠핑가자","아웃도어 애호 활기찬 말투"],["겜돌이","게임·디지털 덕후 드립 말투"],["뷰티덕질","성분까지 보는 디테일 말투"],["헬스장출근","운동·건강식품 활력 말투"],
  ["주방템마스터","주방·살림 친절한 살림꾼 말투"],["최저가스나이퍼","간결 단정적 말투"],["월급요정","직장인 위트 자조 말투"],["전자기기병","IT 얼리어답터 스펙 말투"],["오늘도텅장","지갑 텅장 유머 말투"],["식탐대마왕","먹거리 군침 도는 묘사"],["패션피플","트렌드 감각적 말투"],["꿀템수집가","발견의 기쁨 강조 말투"],["와이프몰래","능청스러운 말투"],["쿠폰장인","쿠폰·적립 계산식 말투"],
  ["신상가즈아","신상에 약한 들뜬 말투"],["살림9단","노련하고 든든한 말투"],["직장인J","딱딱 정리하는 말투"],["여행적금중","설레는 알뜰 말투"],["반려견아빠","다정한 말투"],["키보드워리어","주변기기 디테일 집착"],["다이어터","의지 불태우는 말투"],["홈카페사장","감성적인 말투"],["득템각","짧고 강한 말투"],["신혼살림중","설레고 알뜰한 말투"],
  ["프로세일러","프로페셔널 말투"],["방구석평론가","솔직 직설 말투"],["알뜰살뜰","다정한 잔소리 말투"],["디지털노마드","쿨하고 간결한 말투"],["맘카페터줏대감","친근한 동네언니 말투"],["오타쿠인정","솔직 텐션 말투"],["건강챙겨","챙겨주는 말투"],["퇴근후쇼핑","나른한 말투"],["초보집사","귀엽고 서툰 말투"],["주말장보기","생활밀착 말투"],
  ["테크리뷰러","객관적인 말투"],["예쁜쓰레기수집","자조적 유머"],["현질장인","호탕한 말투"],["절약왕","단호하고 깔끔한 말투"],["트렌드세터","트렌디한 말투"],["집순이템","편안하고 솔직한 말투"],["출근길커피","잔잔한 말투"],["패밀리세일","든든한 말투"],["막판세일러","다급한 말투"],["꼼꼼이","신중한 말투"],
];
const hash = (s) => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; };
const personaFor = (seed) => { const [nick, tone] = PERSONAS[hash(seed) % PERSONAS.length]; return { nick, tone }; };

async function beat() {
  const now = new Date().toISOString();
  await rest("settings?on_conflict=key", { method: "POST", headers: { Prefer: "resolution=merge-duplicates" }, body: JSON.stringify({ key: "automation_heartbeat", value: { source: "local", at: now }, updated_at: now }) });
  return now;
}

async function fetchBatch(n) {
  await beat();
  const pb = await (await rest(`board_deals?author=eq.${PENDING}&select=id,slug,title,body,shop,price,category&order=created_at.asc&limit=${n}`)).json();
  const posts = (Array.isArray(pb) ? pb : []).map((r) => { const p = personaFor(r.slug); return { id: r.id, slug: r.slug, persona: p.nick, tone: p.tone, category: r.category, shop: r.shop, price: r.price, title: r.title, body: r.body }; });
  const db = await (await rest(`deal_archive?summary=is.null&select=slug,product_name,sale_price,category&limit=${n}`)).json();
  const blurbs = (Array.isArray(db) ? db : []).map((r) => ({ slug: r.slug, product_name: r.product_name, price: r.sale_price, category: r.category }));
  console.log(JSON.stringify({ posts, blurbs }, null, 2));
}

async function apply(file) {
  const fs = await import("node:fs");
  const data = JSON.parse(fs.readFileSync(file, "utf8"));
  let np = 0, nb = 0;
  for (const p of data.posts ?? []) {
    if (!p.id || !p.title) continue;
    const persona = personaFor(p.slug ?? "");
    const body = { title: String(p.title).slice(0, 60), body: (p.body ? String(p.body).slice(0, 180) : null), author: persona.nick };
    const r = await rest(`board_deals?id=eq.${p.id}`, { method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify(body) });
    if (r.ok) np++;
  }
  for (const b of data.blurbs ?? []) {
    if (!b.slug || !b.summary) continue;
    const r = await rest(`deal_archive?slug=eq.${encodeURIComponent(b.slug)}`, { method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ summary: String(b.summary).slice(0, 60) }) });
    if (r.ok) nb++;
  }
  await beat();
  console.log(`applied posts=${np} blurbs=${nb}`);
}

const [cmd, arg] = process.argv.slice(2);
if (cmd === "beat") { console.log("beat", await beat()); }
else if (cmd === "fetch") { await fetchBatch(Number(arg) || 40); }
else if (cmd === "apply") { if (!arg) { console.error("apply <file> 필요"); process.exit(1); } await apply(arg); }
else { console.error("cmd: beat | fetch [n] | apply <file>"); process.exit(1); }
