// 일회용 — 게시판 구조 개편 데이터 이전 + 카테고리 백필.
const URL = process.env.SUPA_URL, KEY = process.env.SUPA_KEY;
const H = { apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" };
const base = `${URL}/rest/v1/board_deals`;

async function patchWhere(filter, body) {
  const res = await fetch(`${base}?${filter}`, { method: "PATCH", headers: { ...H, Prefer: "return=minimal" }, body: JSON.stringify(body) });
  if (!res.ok) console.error("  ✗", filter, res.status, (await res.text()).slice(0, 150));
  return res.ok;
}

// 1) 보드타입 이전
console.log("① 보드타입 이전");
await patchWhere("board_type=eq.coupon", { board_type: "event" });
await patchWhere("board_type=eq.free", { board_type: "event" });
await patchWhere("board_type=eq.overseas", { board_type: "hot" });
console.log("   coupon·free→event, overseas→hot 완료");

// 2) 카테고리 백필 (핫딜 중 category 없음)
const KEYWORDS = [
  ["전자/IT", /노트북|데스크탑|ssd|hdd|모니터|키보드|마우스|충전|usb|아이폰|갤럭시|이어폰|에어팟|버즈|그래픽|cpu|램|공유기|tv|모뎀|배터리|보조배터리|태블릿|아이패드|스마트워치|가전|청소기|에어컨|선풍기|전기|닌텐도|플스|콘솔/i],
  ["식품", /과일|복숭아|사과|수박|포도|쌀|김치|닭가슴살|돼지|소고기|한우|간식|커피|음료|라면|과자|만두|밀키트|즉석|식품|먹거리|건강식품|영양제|비타민|홍삼|유산균|견과|누룽지|아이스크림/i],
  ["패션/뷰티", /화장품|스킨|로션|크림|에센스|세럼|향수|마스크팩|선크림|쿠션|틴트|립|샴푸|바디|클렌징|뷰티|의류|티셔츠|맨투맨|바지|청바지|원피스|신발|운동화|구두|슬리퍼|가방|백팩|지갑|벨트|모자|양말|패딩|자켓|코트|니트|속옷/i],
  ["생활/주방", /세제|섬유유연제|휴지|물티슈|주방|냄비|프라이팬|후라이팬|청소|세탁|생활|수건|타월|칫솔|치약|텀블러|밀폐|용기|살림|걸레|위생|방향제|기저귀|분유|유아|아기|키즈|어린이|주니어/i],
];
const catOf = (t) => { for (const [c, re] of KEYWORDS) if (re.test(t || "")) return c; return "기타"; };

console.log("② 카테고리 백필 (미분류 핫딜)");
const res = await fetch(`${base}?select=id,title&board_type=eq.hot&category=is.null&limit=3000`, { headers: H });
const rows = await res.json();
console.log(`   미분류 ${rows.length}건`);
const byCat = {};
for (const r of rows) (byCat[catOf(r.title)] ??= []).push(r.id);
for (const [cat, ids] of Object.entries(byCat)) {
  for (let i = 0; i < ids.length; i += 50) {
    const chunk = ids.slice(i, i + 50);
    await patchWhere(`id=in.(${chunk.join(",")})`, { category: cat });
  }
  console.log(`   ${cat}: ${ids.length}건`);
}
console.log("✅ 완료");
