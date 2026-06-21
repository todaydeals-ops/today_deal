// 편집국 엔진 — 1편 즉시 발행(upsert, 삭제 없음). 매일/요청 시 이 패턴으로 글 추가.
const URL = process.env.SUPA_URL, KEY = process.env.SUPA_KEY;

/* ---------- 헬퍼 (상세 기준안 토큰) ---------- */
const P0 = (t) => `<p style="font-size:18px; line-height:1.95; color:#2c2a24; margin:0;">${t}</p>`;
const P = (t) => `<p style="font-size:18px; line-height:1.95; color:#2c2a24; margin:18px 0 0;">${t}</p>`;
const H2 = (t) => `<h2 style="font-family:'Noto Serif KR',serif; font-weight:700; font-size:27px; letter-spacing:-0.6px; line-height:1.3; margin:44px 0 0; color:#16140f;">${t}</h2>`;
const SUB = (t) => `<p style="font-size:15px; line-height:1.8; color:#76726b; margin:10px 0 22px;">${t}</p>`;
const B = (t) => `<b style="font-weight:700;">${t}</b>`;
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
const INDIGO = "#38539a";

/* ============================================================ 끝장비교 · 제습기 */
const a = {
  slug: "dehumidifier-compressor-vs-desiccant", corner: "compare", field: "가전",
  title: "제습기, 컴프레서 vs 데시칸트 vs 어느 게 맞을까", subtitle: "‘최대 OOL’ 숫자보다 ‘시험 조건’을 봅니다",
  excerpt: "방식마다 잘 맞는 계절도, 전기료도 달라요. 장마철 잘못 고르면 ‘안 시원하고 전기만 먹는’ 제습기가 되는데요. 광고가 안 알려주는 ‘L 숫자의 함정’까지 따져봤습니다.",
  read_min: 8,
  summary: [
    "여름 거실은 컴프레서, 겨울·저온은 데시칸트, 옷장 같은 소공간은 펠티어예요.",
    "‘최대 OOL’은 시험 온도·습도가 깔린 숫자 — 조건을 같이 보세요.",
    "용량은 ‘집 전체’가 아니라 ‘가동할 공간’ 크기로 잡아요.",
  ],
  callout: "‘최대 제습량 OOL’만 보면 안 돼요. 같은 제품이 " + B("27℃에선 7L, 30℃·고습에선 12L로 표기된 사례") + "가 소비자매체에서 확인됐어요. 표준(보통 27℃/60%)보다 덥고 습한 조건에서 재면 숫자가 부풀려져요. ‘L’ 옆의 시험 조건(℃/%)을 꼭 확인하세요.",
  closing: "‘제일 센 제습기’는 없습니다. 여름 거실이면 컴프레서, 겨울·비난방 공간이면 데시칸트, 옷장·신발장이면 소형이 맞는 편이에요. 다만 <span style=\"color:#ff8a6f;\">L 숫자보다 ‘시험 조건’과 ‘내 공간 크기’</span>가 먼저입니다. 선택은 당신의 몫입니다.",
  main: [
    P0("장마가 시작되면 집안 눅눅함에 제습기를 찾게 되는데요. 막상 검색하면 ‘컴프레서·데시칸트·펠티어’ 방식이 뒤섞이고, ‘최대 18L’ 같은 숫자만 요란하죠. 잘못 고르면 " + B("안 시원하고 전기만 먹거나, 옷장용을 거실에 들이는") + " 실수를 하기 쉬운데요. 한국소비자원·공기청정협회 자료와 시험 조건까지 따져 정리했습니다."),
    P("‘어떤 방식이 정답이냐’는 " + B("주로 언제·어디서 쓰느냐") + "가 정하는 편이에요. 흐름부터 짚어볼게요."),
    DTREE({ title: "내 상황엔 어떤 방식?", q1: "Q1. 주로 여름·장마철(실내 18℃ 이상)에 쓰시나요?", yes: "컴프레서식<br><span style=\"font-weight:500; font-size:11.5px; color:#76726b;\">고온일수록 강함·효율 좋음</span>", q2: "Q2. 옷장·신발장 같은 좁고 닫힌 소공간인가요?", ya: "YES<br>펠티어/소형", na: "겨울·저온 방·다용도실<br>데시칸트식" }),
    H2("세 방식, 원리부터 다릅니다"),
    P("" + B("컴프레서식") + "은 에어컨처럼 차가운 코일에 습기를 응결시켜 빼요. 고온다습할수록 잘 뽑고 전기 효율도 좋지만, 약 18℃ 아래에선 코일이 얼어 성능이 뚝 떨어지죠. " + B("데시칸트식") + "은 흡습제(제올라이트)가 물을 빨아들인 뒤 히터로 데워 말리는 방식이라, 추운 계절에도 강하지만 전기를 더 먹고 더운 바람이 나와요. " + B("펠티어식") + "은 열전소자로 결로시키는데, 무소음·저전력이지만 제습량이 매우 적어 좁은 공간 전용이에요."),
    WRAP(TABLE(["구분", "컴프레서", "데시칸트", "펠티어"], [
      ["강한 계절", "여름·고온", "겨울·저온", "소공간 보조"],
      ["일 제습량", "6~20L", "6~10L", "0.25~1.5L"],
      ["소비전력", "150~300W", "300~700W(히터)", "20~60W"],
      ["소음", "40~50dB+진동", "정숙한 편", "거의 무소음"],
      ["발열(실내↑)", "+1.5~3℃", "+3~5℃", "작음"],
      ["무게", "무거움(10kg+)", "가벼움", "초경량"],
    ])),
    P("요지는 ‘경쟁’이 아니라 ‘용도 분담’이에요. 여름 거실의 메인은 컴프레서, 겨울·비난방 공간은 데시칸트, 옷장·신발장은 펠티어. 한여름에 데시칸트를 오래 돌리면 방이 더워지는 역효과도 있으니 계절을 먼저 보세요."),
    H2("‘최대 OOL’ 숫자의 함정"),
    P("제습량은 " + B("어떤 온도·습도에서 쟀느냐") + "에 따라 크게 달라져요. 국내 표준은 보통 27℃·습도 60% 기준인데, 더 덥고 습한 30℃·80%에서 재면 같은 기계도 숫자가 커지거든요. 실제로 한 제품이 " + B("27℃에선 7L, 30℃에선 12L로 표기") + "돼 ‘최대 12L’로 광고된 사례가 소비자매체에서 확인됐어요. 그래서 조건이 빠진 ‘L’ 비교는 사실상 무의미한 편이에요."),
    H2("용량은 ‘집 전체’가 아니라 ‘가동할 공간’"),
    P("제습기 용량은 집 평수가 아니라 " + B("실제로 제습기를 돌릴 공간") + " 크기로 잡아요. 라벨의 ‘적용면적(㎡)’을 1차 기준으로 보면 안전하고요."),
    WRAP(TABLE(["사용 공간", "권장 용량(L/day)", "예시"], [
      ["원룸·작은 방(10평 미만)", "6~10L", "1인 가구, 방 1칸"],
      ["거실+주방(20~30평대)", "10~16L", "거실 메인은 15·18L급"],
      ["넓은 거실·다공간(40평+)", "17~20L 이상", "복수 공간·다용도실 병행"],
    ])),
    SUB("주택·지하·저층 등 습한 환경이거나 빨래건조를 자주 하면 한 단계 큰 용량이 안전해요 · 권장값은 가동 공간 기준 일반치."),
    H2("습도 목표와 배수 — 50~60%, 물통 vs 연속배수"),
    P("쾌적·곰팡이 방지의 타깃 습도는 " + B("50~60%") + "예요(40% 미만으로 과하게 말리는 건 비권장). 습도가 60%를 넘기면 곰팡이가 늘고, 70% 이상 오래가면 급증하니 그 전에 잡는 게 핵심이고요."),
    P("배수는 두 갈래예요. " + B("물통") + "은 배수구가 필요 없어 자유롭게 옮기지만 만수되면 멈춰서 자주 비워야 하고, " + B("연속배수(호스)") + "는 장시간 무인 가동에 좋지만 배수구가 가까워야 하고 호스가 본체보다 높거나 꺾이면 물이 안 빠져요. 장마철 외출이 잦으면 연속배수, 위치 이동이 잦으면 대용량 물통이 편한 편입니다."),
    H2("전기료·관리·안전"),
    P("전기료는 방식이 좌우해요. 컴프레서식은 효율이 좋아 " + B("제습효율 2L/kWh 이상(보통 1~2등급)") + "을 고르면 부담이 적고, 데시칸트식은 히터 탓에 같은 양을 빼도 전기를 더 써요. " + B("24시간 연속 가동은 전기료·과열·수명 면에서 비권장") + "이라, 목표 습도 자동운전·예약을 쓰는 게 좋아요."),
    P("물을 다루는 기기라 관리가 위생을 좌우해요. " + B("쓰고 나면 물통을 비우고 완전히 말리고") + ", 흡기 필터는 2~4주마다 세척하세요(안 그러면 냄새·곰팡이). 안전도 챙길 게 있어요 — 뒷면 먼지망을 방치하면 가연물이 되니 정기 청소가 필요하고, 빨래건조 시엔 떨어지는 물이 배출구로 들어가지 않게 빨래와 1.5~2m 거리를 두고, 좁고 닫힌 공간에서 오래 돌렸다면 환기하세요."),
    H2("사기 전 체크리스트"),
    NUMLIST(INDIGO, [
      "‘최대 OOL’의 시험 조건(27℃/60% 표준인지)을 상세페이지에서 확인했다",
      "에너지효율등급·제습효율(2L/kWh 이상이면 1~2등급)을 봤다",
      "주 사용 계절로 방식을 정했다 (여름 컴프레서 / 겨울·저온 데시칸트 / 소공간 펠티어)",
      "‘가동할 공간’ 크기로 용량을 잡았다 (집 전체 아님, 빨래건조 잦으면 한 단계↑)",
      "배수 방식(연속배수 호스·만수 자동정지)과 소음(취침모드 기준)·필터 관리 주기를 확인했다",
    ]),
  ].join("\n"),
};

/* ---------- 발행 ---------- */
const H = { apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" };
const rail = `<!--RAIL:${JSON.stringify({ summary: a.summary, callout: a.callout })}-->\n`;
const row = {
  slug: a.slug, corner: a.corner, field: a.field, title: a.title, subtitle: a.subtitle,
  excerpt: a.excerpt, read_min: a.read_min, body_html: rail + a.main.trim(), closing: a.closing,
  is_published: true, created_at: "2026-06-21T18:00:00+09:00",
};
const res = await fetch(`${URL}/rest/v1/magazine?on_conflict=slug`, {
  method: "POST",
  headers: { ...H, Prefer: "resolution=merge-duplicates,return=representation" },
  body: JSON.stringify(row),
});
console.log("publish:", res.status);
console.log((await res.text()).slice(0, 150));
