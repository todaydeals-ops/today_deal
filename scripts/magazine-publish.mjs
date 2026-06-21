// 편집국 엔진 — 1편 즉시 발행(upsert, 삭제 없음). 한 편씩 정성껏.
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

/* ============================================================ 끝장비교 · 전기레인지 */
const a = {
  slug: "induction-vs-highlight-vs-gas", corner: "compare", field: "리빙·주방",
  title: "인덕션 vs 하이라이트 vs 가스레인지, 뭘 골라야 할까", subtitle: "효율·안전·전기료, 방식마다 맞바꿈이 있어요",
  excerpt: "‘인덕션이 좋다던데’ ‘전자파는?’ ‘전기료 폭탄?’ 말이 많은데요. 세 방식은 우열이 아니라 맞바꿈(trade-off)이라, 내 주방·요리 스타일이 답을 정합니다.",
  read_min: 9,
  summary: [
    "웍·불맛은 가스, 안전·청소·맑은 공기는 인덕션, 쓰던 냄비 유지는 하이라이트예요.",
    "도시가스 단가가 싸 보여도, 인덕션 효율이 높아 평소엔 비용이 거의 비슷해요.",
    "인덕션은 자성(철) 용기만 가열돼요 — 자석으로 확인하세요.",
  ],
  callout: "인덕션 전자파, 걱정되시죠? 인덕션은 " + B("비전리(non-ionizing) 자기장") + "이라 전자레인지처럼 음식에 ‘방사선’을 쏘는 게 아니에요. 게다가 20cm만 떨어져도 노출이 급감해 국제 일반인 기준 대비 극히 일부고요. 다만 " + B("심박조율기 사용자") + "는 제조사·주치의 안내(보통 30~60cm)를 따르세요.",
  closing: "‘제일 좋은 레인지’는 없습니다. 센 불맛이 핵심이면 가스, 안전·청소·맑은 실내공기가 중요하면 인덕션, 쓰던 냄비를 그대로 쓰려면 하이라이트가 맞는 편이에요. 다만 <span style=\"color:#ff8a6f;\">인덕션은 ‘전기 용량·전용 용기’, 가스는 ‘환기’</span>를 먼저 확인하세요. 선택은 당신의 몫입니다.",
  main: [
    P0("가스레인지를 쓰다 인덕션이나 하이라이트로 바꿀까 고민되시죠. ‘인덕션이 좋다던데’ ‘전자파는 괜찮나’ ‘전기료 폭탄 아니냐’ 말이 많은데요. 결론부터 말하면 세 방식은 우열이 아니라 " + B("맞바꿈(trade-off)") + "이라, 내 주방·요리 스타일이 답을 정하는 편이에요. 미국 에너지부·한국소비자원 자료와 실제 비용 계산까지 따져봤습니다."),
    P("‘무엇이 정답이냐’는 결국 " + B("내가 어떻게 요리하고, 어떤 냄비를 쓰며, 전기 용량이 되느냐") + "가 정해요. 흐름부터 짚어볼게요."),
    DTREE({ title: "내 주방엔 어떤 레인지?", q1: "Q1. 웍질·센 불맛(볶음·중식)이 요리의 핵심인가요?", yes: "가스레인지<br><span style=\"font-weight:500; font-size:11.5px; color:#76726b;\">직화·강한 화력, 시각 조절</span>", q2: "Q2. 안전·청소를 우선하고, 자성(철) 냄비를 쓸 수 있나요?", ya: "YES<br>인덕션", na: "쓰던 냄비 유지<br>하이라이트/하이브리드" }),
    H2("세 방식, ‘열이 어디서 나는가’가 다릅니다"),
    P("" + B("인덕션") + "은 코일이 만든 자기장이 냄비 바닥에 전류를 유도해 ‘용기 자체’를 데워요(상판은 직접 안 달궈짐). " + B("하이라이트") + "는 상판 아래 발열체가 빨갛게 달아 복사·전도로 데우고, " + B("가스") + "는 불꽃이 용기와 주변 공기까지 직접 가열하죠. 이 차이가 아래 효율·안전·청소를 전부 좌우합니다."),
    WRAP(TABLE(["구분", "인덕션", "하이라이트", "가스"], [
      ["가열 원리", "자기유도(용기 발열)", "발열체 복사·전도", "직화(불꽃)"],
      ["열효율(추정)", "약 85~90%", "약 65%", "약 40%"],
      ["가열 속도", "가장 빠름", "가장 느림", "중간"],
      ["온도 조절", "즉각·정밀", "느림(잔열)", "즉각(눈으로)"],
      ["상판 화상", "낮음(용기 잔열 주의)", "높음(상판 적열)", "화염·받침"],
      ["실내공기", "깨끗(연소 없음)", "깨끗", "연소 부산물(NO₂)"],
      ["청소", "쉬움(평판)", "쉬움(평판)", "번거로움(받침 분리)"],
      ["전용 용기", "자성 용기 필수", "제약 없음", "제약 없음"],
    ])),
    SUB("효율 %는 측정기관·시험연도(미 DOE 개정시험 등)에 따라 편차가 커서 단일 정답값이 아니에요. ‘일반적으로 인덕션>하이라이트>가스 순’ 정도로 보세요."),
    H2("효율과 전기료 — 단가는 가스가 싸지만, 결과는 비슷"),
    P("에너지 ‘단가’만 보면 도시가스가 전기보다 싸요. 그런데 인덕션은 효율이 높아 실제 비용 차이는 생각보다 작은 편인데요. 물 1L를 끓이는 데 드는 비용을 계산해 보면 — " + B("인덕션 약 19원(누진 2구간)·약 29원(3구간), 가스 약 19원") + "으로, 평상시(2구간)엔 거의 같아요. 시중 후기가 ‘인덕션이 더 싸다·더 비싸다’로 엇갈리는 이유가 바로 이 효율과 누진 구간 차이예요."),
    P("그래서 진짜 변수는 " + B("우리 집 월 전기 사용량이 누진 상위 구간에 걸리느냐") + "예요. 평소 400kWh를 넘나드는 집(여름 에어컨·겨울 난방 겹칠 때)은 인덕션 추가 사용분이 3구간 단가(2구간의 약 1.4배)로 붙어 부담이 커질 수 있어요. ‘추가 kWh × 낮은 단가’로 단순 계산하면 과소평가하기 쉽습니다."),
    H2("안전과 실내공기"),
    P("안전은 방식별 약점이 달라요. " + B("하이라이트는 상판이 빨갛게 달아 꺼도 한동안 뜨거워") + " 화상 위험이 가장 크고(소비자원 인용 자료 기준 평균 85℃, 40℃까지 식는 데 26분), 인덕션은 상판이 비교적 시원하지만 ‘용기에서 전달된 잔열’이 남으니 ‘인덕션은 안 뜨겁다’고 맨손으로 만지진 마세요. 가스는 화염·달궈진 받침 화상에 더해, " + B("연소 부산물(NO₂ 등)이 나와 환기가 중요") + "해요(해외 연구에선 가스→전기 전환 시 실내 NO₂가 크게 줄었다는 보고가 있어요)."),
    H2("인덕션 전용 용기 — ‘자석 테스트’ 한 번"),
    P("인덕션의 가장 흔한 불만은 ‘쓰던 냄비가 안 돼요’예요. 인덕션은 " + B("자성(철 성분) 용기만") + " 가열되거든요. 무쇠·법랑·‘인덕션’ 표기 스테인리스는 되지만 알루미늄·양은·유리·뚝배기·도자기는 안 돼요. 확인은 간단해요 — " + B("냄비 바닥 중앙에 냉장고 자석을 붙여 ‘착’ 달라붙으면 사용 가능") + "이에요(스테인리스라도 자성 없는 건 안 되니 자석이 정확). 새로 살 냄비 비용을 미리 감안하세요."),
    H2("쓰던 냄비를 못 버리겠다면 — 하이브리드"),
    P("뚝배기·유리·알루미늄을 계속 쓰고 싶다면 " + B("‘인덕션 2구 + 하이라이트 1구’ 하이브리드") + "가 절충이에요. 인덕션의 빠른 화력·고효율에 더해, 하이라이트 화구로는 모든 용기를 쓸 수 있거든요. 단 하이라이트 화구는 효율이 낮고 잔열이 있다는 점, 화구마다 쓰는 용기가 달라 헷갈릴 수 있다는 점은 감안하세요."),
    H2("사기 전 짚을 것 — 상판·정전·전기 증설"),
    P("유리 상판은 " + B("긁힘과 ‘눌어붙음’에 약해요") + ". 특히 설탕·잼·녹은 플라스틱이 뜨거울 때 눌어붙으면 유리에 영구 자국(보증 제외)이 남으니 즉시 닦아내고, 냄비는 끌지 말고 들어서 옮기세요. 또 인덕션·하이라이트는 전기 100% 의존이라 " + B("정전이면 사용 불가") + "(가스는 수동 점화로 가능)고요. 고출력 인덕션(특히 수입·다구)은 가정용 콘센트(약 3,300W) 한계를 넘어 " + B("전용 배선·증설이 필요할 수 있으니") + ", 제품 정격(W)과 집 분전반을 미리 확인하세요(전세라면 설치·원상복구 부담 없는 이동형도 대안)."),
    H2("사기 전 체크리스트"),
    NUMLIST(INDIGO, [
      "주 요리 스타일로 방식을 정했다 (웍·불맛=가스 / 안전·청소=인덕션 / 기존 냄비=하이라이트)",
      "인덕션이면 보유 냄비를 자석으로 테스트했다 (안 붙는 건 교체 비용 감안)",
      "인덕션 고출력이면 전기 용량·전용 배선(증설) 필요 여부를 확인했다",
      "전세/월세면 설치·원상복구 부담 없는 이동형도 비교했다",
      "가스면 환기(후드·창)를, 하이라이트면 잔열 화상을 감안했다",
    ]),
  ].join("\n"),
};

/* ---------- 발행 ---------- */
const H = { apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" };
const rail = `<!--RAIL:${JSON.stringify({ summary: a.summary, callout: a.callout })}-->\n`;
const row = {
  slug: a.slug, corner: a.corner, field: a.field, title: a.title, subtitle: a.subtitle,
  excerpt: a.excerpt, read_min: a.read_min, body_html: rail + a.main.trim(), closing: a.closing,
  is_published: true, created_at: "2026-06-21T19:00:00+09:00",
};
const res = await fetch(`${URL}/rest/v1/magazine?on_conflict=slug`, {
  method: "POST",
  headers: { ...H, Prefer: "resolution=merge-duplicates,return=representation" },
  body: JSON.stringify(row),
});
console.log("publish:", res.status);
console.log((await res.text()).slice(0, 150));
