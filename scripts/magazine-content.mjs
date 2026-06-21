// 매거진 콘텐츠 — 상세 기준안(2단 그리드) 스펙에 맞춰 재작성. 레일(요약·짚고가요)은 RAIL 주석으로 분리.
// 기존 글 전체 삭제 후 4편 재삽입. 중립·정확(레인지/추정).
const URL = process.env.SUPA_URL, KEY = process.env.SUPA_KEY;

/* ---------- 메인 컬럼 헬퍼 (상세 기준안 토큰) ---------- */
const P0 = (t) => `<p style="font-size:18px; line-height:1.95; color:#2c2a24; margin:0;">${t}</p>`;
const P = (t) => `<p style="font-size:18px; line-height:1.95; color:#2c2a24; margin:18px 0 0;">${t}</p>`;
const H2 = (t) => `<h2 style="font-family:'Noto Serif KR',serif; font-weight:700; font-size:27px; letter-spacing:-0.6px; line-height:1.3; margin:44px 0 0; color:#16140f;">${t}</h2>`;
const SUB = (t) => `<p style="font-size:15px; line-height:1.8; color:#76726b; margin:10px 0 22px;">${t}</p>`;
const B = (t) => `<b style="font-weight:700;">${t}</b>`;

// 광고문구 vs 실제의미형 (2열)
const VS = (head, items) => `<div style="border:1px solid rgba(22,20,15,0.14); border-radius:12px; overflow:hidden;">
  <div style="display:grid; grid-template-columns:0.85fr 1.15fr; background:#16140f; color:#fff; font-family:'JetBrains Mono',monospace; font-size:11px; letter-spacing:.5px;"><div style="padding:13px 18px;">${head[0]}</div><div style="padding:13px 18px; border-left:1px solid rgba(255,255,255,0.14);">${head[1]}</div></div>
  ${items.map((r, i) => `<div style="display:grid; grid-template-columns:0.85fr 1.15fr; border-top:1px solid rgba(22,20,15,0.08);${i % 2 ? " background:#faf8f5;" : ""}"><div style="padding:16px 18px; font-weight:700; font-size:14px; color:#16140f;">${r[0]}</div><div style="padding:16px 18px; border-left:1px solid rgba(22,20,15,0.08); font-size:14px; line-height:1.75; color:#46433d;">${r[1]}</div></div>`).join("")}
</div>`;

// 일반 다열 표
const TABLE = (headers, rows) => {
  const gtc = headers.map((_, i) => (i === 0 ? "0.95fr" : "1fr")).join(" ");
  const head = `<div style="display:grid; grid-template-columns:${gtc}; background:#16140f; color:#fff; font-family:'JetBrains Mono',monospace; font-size:11px;">${headers.map((h) => `<div style="padding:12px 14px;">${h}</div>`).join("")}</div>`;
  const body = rows.map((row, ri) => `<div style="display:grid; grid-template-columns:${gtc}; border-top:1px solid rgba(22,20,15,0.08); font-size:13px;${ri % 2 ? " background:#faf8f5;" : ""}">${row.map((c, ci) => `<div style="padding:12px 14px; line-height:1.55;${ci === 0 ? " font-weight:700; color:#16140f;" : " color:#46433d;"}">${c}</div>`).join("")}</div>`).join("");
  return `<div style="border:1px solid rgba(22,20,15,0.14); border-radius:12px; overflow:hidden;">${head}${body}</div>`;
};

// 번호 체크리스트(코너 색 번호)
const NUMLIST = (color, items) => `<div style="margin-top:16px; border-top:1px solid rgba(22,20,15,0.12);">${items.map((t, i) => `<div style="display:flex; gap:14px; padding:15px 2px;${i < items.length - 1 ? " border-bottom:1px solid rgba(22,20,15,0.08);" : ""}"><span style="font-family:'JetBrains Mono',monospace; font-weight:700; font-size:13px; color:${color}; flex:none;">${String(i + 1).padStart(2, "0")}</span><span style="font-size:16px; line-height:1.6; color:#33312d;">${t}</span></div>`).join("")}</div>`;

// 비용 막대 (라벨/숫자/2톤 막대) — maxv 기준 폭
const COSTBARS = (caption, rows, maxv, legend) => `<div style="border:1px solid rgba(22,20,15,0.14); border-radius:12px; padding:20px 22px; margin:26px 0 0; background:#fcfbf9;">
  <div style="font-family:'JetBrains Mono',monospace; font-size:10.5px; letter-spacing:1.5px; color:#9a9286;">${caption}</div>
  <div style="display:flex; flex-direction:column; gap:14px; margin-top:16px;">
  ${rows.map((r) => `<div><div style="display:flex; justify-content:space-between; align-items:baseline; margin-bottom:7px;"><span style="font-size:14px; font-weight:700;">${r.label}</span><span style="font-family:'JetBrains Mono',monospace; font-size:13px; font-weight:700;${r.hi ? " color:#ff5a3c;" : ""}">${r.num}</span></div><div style="display:flex; height:18px; border-radius:5px; overflow:hidden; background:#efe9df;"><div style="width:${Math.round((r.mid / maxv) * 100)}%; background:#16140f;"></div></div></div>`).join("")}
  </div>
  ${legend ? `<p style="font-size:13px; line-height:1.7; color:#76726b; margin:14px 0 0;">${legend}</p>` : ""}
</div>`;

// Decision Tree (2단 분기)
const DTREE = ({ title, q1, yes, q2, ya, na }) => `<div style="border:1px solid rgba(22,20,15,0.14); border-radius:16px; padding:24px; margin:26px 0 0; background:#fcfbf9;">
  <div style="display:flex; align-items:center; gap:8px; margin-bottom:18px;"><span style="font-family:'JetBrains Mono',monospace; font-size:11px; font-weight:700; letter-spacing:1px; color:#ff5a3c;">DECISION TREE</span><span style="font-size:13px; font-weight:700; color:#16140f;">${title}</span></div>
  <div style="background:#ff5a3c; color:#fff; border-radius:10px; padding:13px 16px; font-size:14px; font-weight:700; line-height:1.45;">${q1}</div>
  <div style="display:grid; grid-template-columns:1fr 1fr; gap:14px; margin-top:12px;">
    <div style="display:flex; flex-direction:column; align-items:center; gap:8px;"><span style="font-family:'JetBrains Mono',monospace; font-size:11px; font-weight:700; color:#6f6b64;">YES ↓</span><div style="width:100%; text-align:center; border:1.5px solid #d8d2c7; color:#16140f; background:#fff; border-radius:9px; padding:12px; font-size:13.5px; font-weight:700; line-height:1.4;">${yes}</div></div>
    <div style="display:flex; flex-direction:column; align-items:center; gap:8px;"><span style="font-family:'JetBrains Mono',monospace; font-size:11px; font-weight:700; color:#9a9286;">NO ↓</span><div style="width:100%; background:#16140f; color:#fff; border-radius:9px; padding:12px 14px; font-size:13.5px; font-weight:700; line-height:1.4;">${q2}</div><div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; width:100%; margin-top:2px;"><div style="text-align:center; border:1.5px solid #d8d2c7; color:#16140f; background:#fff; border-radius:9px; padding:10px 6px; font-size:12px; font-weight:700; line-height:1.35;">${ya}</div><div style="text-align:center; border:1.5px solid #d8d2c7; color:#16140f; background:#fff; border-radius:9px; padding:10px 6px; font-size:12px; font-weight:700; line-height:1.35;">${na}</div></div></div>
  </div>
</div>`;

const TEAL = "#1f6b66", ORANGE = "#e0481f", INDIGO = "#38539a", OLIVE = "#7a5f2e";

/* ============================================================ 1) 팩트체크 · 공기청정기 (피처드) */
const a1 = {
  slug: "air-purifier-999-factcheck", corner: "factcheck", field: "가전",
  title: "‘초미세먼지 99.9% 제거’ 광고, 어디까지 진짜일까", subtitle: "숫자 뒤에 숨은 ‘시험 조건’을 봅니다",
  excerpt: "99.9%는 거짓이 아니지만 ‘우리 집 성능’도 아닌데요. 그 숫자가 어디서 나온 건지, HEPA 등급과 CADR까지 시험 조건부터 따져봤습니다.",
  read_min: 7,
  summary: ["99.9%는 챔버 1회 통과 효율 — 방 전체 성능이 아니에요.", "‘HEPA급’이 아니라 H13 이상 등급을 보세요.", "체감을 좌우하는 핵심 수치는 CADR입니다."],
  callout: "‘H11=99.5%, H12=99.95%’는 틀린 표기예요. 국제 등급(EN 1822)에 " + B("H11·H12 등급은 없고") + ", 정식 HEPA는 " + B("H13(0.3㎛ 99.95%)") + "부터 시작합니다.",
  closing: "광고의 99.9%는 거짓이 아니라 ‘특정 조건의 진실’입니다. 숫자가 아니라 <span style=\"color:#ff8a6f;\">그 숫자가 측정된 조건</span>을 보세요. 선택은 당신의 몫입니다.",
  main: [
    P0("공기청정기 광고마다 ‘초미세먼지 99.9% 제거’가 붙어 있는데요. 정작 우리 집 공기는 별로 달라진 것 같지 않아 의아하셨던 분 많으실 텐데요. 결론부터 말하면 그 숫자는 " + B("거짓은 아니지만, ‘우리 집 성능’도 아닌") + " 편이에요. 어디서 나온 숫자인지부터 보면 이유가 보입니다."),
    H2("광고 문구 vs 실제 의미"), SUB("자주 보이는 광고 표현과, 그 숫자가 실제로 무엇을 뜻하는지 정리했습니다."),
    VS(["광고 문구", "실제 의미"], [
      ["“초미세먼지 99.9% 제거”", "밀폐 시험 챔버에서 필터를 1회 통과할 때의 집진효율이에요. 풍량·방 크기·환기 누설은 반영 안 돼, 방 전체를 그만큼 깨끗하게 만든다는 뜻이 아닌 편입니다."],
      ["“HEPA급 / HEPA-타입”", "규제·시험 없는 마케팅 용어일 수 있어요. 정식 HEPA는 H13(99.95%)부터예요. ‘급/타입’은 90% 이하만 거르기도 합니다."],
      ["“최대 ◯◯㎡ 적용”", "천장 2.4m·약한 조건(10분·50% 감소) 기준이라, 미세먼지 목적엔 실효 면적이 더 좁은 편이에요."],
      ["“도서관처럼 조용”", "대개 취침·약풍 단계 기준이에요. 정작 공기를 빨리 정화하는 터보는 50~60dB로 시끄러운 편입니다."],
      ["“필터 1년 사용”", "표준 경부하 가정이에요. 반려·흡연·고농도·24시간 가동이면 더 짧아지고, 헤파·탈취는 매년 비용이 드는 소모품이에요."],
    ]),
    H2("그럼 뭘 봐야 할까요"),
    P("" + B("CADR(청정공기공급률)") + " · 1분에 깨끗한 공기를 얼마나 내보내는지를 나타내는 핵심 수치예요(풍량×필터효율). 적용면적보다 이 숫자가 체감을 좌우하고, 표준화돼 있어 브랜드 간 비교가 되는 편입니다."),
    P("" + B("필터 등급(H13 이상)") + " · ‘HEPA급’이 아니라 등급 표기를 확인하세요. 같은 평수라도 등급과 CADR이 다르면 체감이 크게 갈립니다."),
    H2("면적 표기를 그대로 믿으면 안 되는 이유"),
    P("‘최대 ◯◯㎡’는 대개 천장 2.4m 기준에, 짧은 시간 약한 조건에서 산출됩니다. 그런데 미세먼지를 ‘빠르게’ 잡으려면 시간당 환기 횟수가 더 필요한 편이에요. 그래서 실전에서는 " + B("표기 면적의 1.5~2배 성능") + "을 고르라는 말이 나옵니다. 20평 거실이라면 30~40평형을 보는 식이죠."),
    P("계산은 의외로 단순합니다. 필요한 CADR ≈ 바닥면적(㎡) × 천장높이(m) × 목표 환기횟수 ÷ 60. 목표 환기를 시간당 4~5회로 두면, 같은 평수라도 필요한 숫자가 또렷하게 나옵니다. 광고의 ‘최대 면적’ 한 줄보다 이 계산 한 번이 더 정직해요."),
    H2("소음과 유지비, 광고가 잘 안 보여주는 두 가지"),
    P("‘도서관처럼 조용’은 대개 취침·약풍 단계 수치입니다. 정작 미세먼지가 높을 때 돌리는 터보는 50~60dB로, 일반 대화 소리에 가깝게 시끄러운 편이에요. 침실용이라면 " + B("약풍에서의 소음과 그때의 CADR") + "을 함께 보는 게 현실적입니다."),
    P("유지비도 빼놓을 수 없어요. 헤파·탈취 필터는 매년 갈아야 하는 소모품이고, 반려동물·흡연·고농도 환경에서는 교체 주기가 더 짧아집니다. 본체 가격이 싸도 필터가 비싸면 3년 총비용이 역전되기도 합니다. ‘필터 1년’이라는 표기보다, " + B("정품 필터의 개당 가격과 권장 주기") + "를 먼저 확인하세요."),
    COSTBARS("3년 체감 비용 — 예시(공개 스펙 기준 추정)", [
      { label: "본체 A · 필터 저가", num: "약 28만원", mid: 28 },
      { label: "본체 B · 필터 고가", num: "약 41만원", mid: 41, hi: true },
    ], 41, "본체가 13만원 싸도 필터가 비싸면 3년 총비용은 더 들 수 있어요. 숫자는 제품마다 다르니, 구매 전 정품 필터 가격을 직접 더해보세요."),
    H2("사기 전, 이 다섯 줄만 확인하세요"),
    NUMLIST(TEAL, [
      "필터 등급이 " + B("H13 이상") + "으로 표기돼 있는가",
      B("CADR(㎥/h)") + " 수치가 공개돼 있고, 내 방 계산값보다 큰가",
      "표기 면적이 내 공간의 " + B("1.5배 이상") + "인가",
      B("약풍 소음") + "과 그때의 정화 성능을 함께 확인했는가",
      "정품 필터 " + B("개당 가격 × 3년") + "을 더해봤는가",
    ]),
  ].join("\n"),
};

/* ============================================================ 2) 끝장비교 · 음식물처리기 */
const a2 = {
  slug: "food-waste-disposer-compare", corner: "compare", field: "리빙·주방",
  title: "음식물처리기, 미생물 vs 건조분쇄 vs 건조", subtitle: "3년을 쓰면 뭐가 진짜 쌀까",
  excerpt: "방식마다 처리 원리도, 3년 총비용도 다른데요. ‘방식 안에서도 모델 간 4배 차’와 디스포저 규제까지 따져봤습니다.",
  read_min: 9,
  summary: ["방식보다 ‘그 방식 안 어떤 모델이냐’가 유지비를 더 좌우해요(최대 4배).", "소음 dB은 카탈로그 변별력이 거의 없어요 — 후기로 판단.", "싱크대 직결 디스포저는 인증제품만 합법입니다."],
  callout: "소음 dB는 카탈로그 변별력이 거의 없는 편이에요. 소비자원 측정상 시판 제품이 사실상 30~40dB대로 수렴하거든요. ‘19.9dB’ 같은 특정 광고 수치보다 " + B("실사용 후기의 ‘분쇄 시 마찰음’ 같은 반복 불만") + "을 확인하세요.",
  closing: "‘최고의 방식’은 없습니다. 집밥이 잦고 소멸·저소음이 중요하면 미생물, 빠른 처리가 우선이면 건조·분쇄, 음식 종류 제한 없이 단순하게면 건조 쪽이 합리적인 편이에요. 다만 <span style=\"color:#ff8a6f;\">같은 방식 안에서도 유지비가 최대 4배까지</span> 갈리니, 본체값보다 ‘3년 유지비’를 보세요. 선택은 당신의 몫입니다.",
  main: [
    P0("음식물 쓰레기통 옆을 지날 때마다 훅 끼치는 냄새, 여름이면 더 신경 쓰이죠. 그래서 처리기를 알아보지만, 막상 검색하면 ‘미생물·건조분쇄·건조’ 방식이 뒤섞여 더 헷갈리는데요. 광고는 저마다 ‘최고’라는데, 정작 " + B("3년을 쓰는 총비용") + "은 아무도 알려주지 않죠. 한국소비자원 비교시험과 공개 스펙, 전기요금 단가를 대입해 따져봤습니다."),
    P("‘어떤 방식이 정답이냐’는 특정 제품이 아니라 " + B("내 상황") + "이 정하는 편이에요. 음식물 양, 자주 버리는 음식 종류, 소음·설치 제약에 따라 답이 갈리거든요."),
    DTREE({ title: "내 상황엔 어떤 방식?", q1: "Q1. 3~4인 이상이라 음식물이 많고, 잔여물까지 ‘소멸’시키고 싶나요?", yes: "미생물식<br><span style=\"font-weight:500; font-size:11.5px; color:#76726b;\">90%↑ 소멸·저소음·배관 불필요</span>", q2: "Q2. 한 번에 빠르게(3~5시간) 끝내는 게 더 중요한가요?", ya: "YES<br>건조·분쇄식", na: "NO·종류제한 싫음<br>단순 건조식" }),
    H2("세 방식, 원리부터 다릅니다"),
    P("" + B("미생물식") + "은 호기성 미생물이 음식물을 분해해 사실상 ‘소멸’시키는 구조예요. " + B("건조·분쇄식") + "은 고온으로 말린 뒤 칼날로 갈아 부피를 크게 줄이고요(소비자원 무게감소율 약 76~78%). " + B("단순 건조식") + "은 열풍으로 수분만 날려, 처리는 느리지만 음식 종류 제한이 없는 편입니다."),
    `<div style="margin-top:22px;">${TABLE(["구분", "미생물", "건조·분쇄", "단순 건조"], [
      ["처리 원리", "미생물 분해·소멸", "건조 후 분쇄", "열풍 건조"],
      ["처리 시간", "24~48h(연속)", "3~5시간", "6~20시간"],
      ["부피 감소", "90~95%↑", "80~90%↑", "50~70%"],
      ["소음(통설)", "25~35dB", "35~50dB", "30~36dB"],
      ["설치", "배관 불필요", "배수 권장", "배기·배수 권장"],
      ["핵심 소모품", "미생물제+필터", "필터+칼날", "필터"],
    ])}</div>`,
    H2("광고가 안 알려주는 ‘3년 유지비’"),
    SUB("본체 제외, 전기료+소모품 기준 추정치 · 일 1회·4인 보통 사용 가정 · 모델에 따라 크게 달라집니다."),
    COSTBARS("3년 유지비(추정) — 본체 제외", [
      { label: "미생물", num: "약 10~53만원", mid: 30 },
      { label: "건조·분쇄", num: "약 33~96만원", mid: 64, hi: true },
      { label: "단순 건조", num: "약 36~90만원", mid: 62 },
    ], 96, "건조 계열이 히터 전기료+필터비로 상위권이에요. 다만 더 중요한 건, 소비자원 시험에서 " + B("같은 ‘건조·분쇄’ 방식 안에서도 연 전기료가 모델 간 약 4배(6천원~24,300원)") + "까지 벌어졌다는 점이에요."),
    H2("두 가지만 더 — 보조금과 디스포저"),
    P("" + B("지자체 보조금") + "은 구매가의 약 30~50%·한도 10~50만원 수준이 일반적이지만, 지역마다 시행 여부·금액이 다르고 예산 소진 시 마감되는 편이에요. 보통 인증제품이어야 하니, 사기 전 거주지 지자체(자원순환과) 공고를 꼭 확인하세요."),
    P("싱크대에 직결해 갈아 흘려보내는 " + B("디스포저는 별개 범주") + "인데요. 한국에선 분쇄물을 80% 이상 회수하는 인증제품만 허용되고, 전량 하수로 흘리는 완전분쇄형은 불법(사용자 과태료 대상)이에요. 거치형 3방식과 혼동하지 마세요."),
    H2("사기 전 체크리스트"),
    NUMLIST(INDIGO, [
      "우리 집 하루 음식물 양을 확인했다 (1인 약 0.31kg/일 — 환경부 통계)",
      "자주 버리는 음식 종류를 점검했다 (닭뼈·국물·유분은 처리 제한·악취의 주범)",
      "본체값이 아니라 ‘3년 유지비(전기+소모품)’를 모델별로 더해봤다",
      "소음은 카탈로그 dB이 아니라 실사용 후기의 반복 불만으로 확인했다",
      "거주지 지자체 보조금 시행 여부·인증 조건을 구매 전 확인했다",
    ]),
  ].join("\n"),
};

/* ============================================================ 3) 스마트가이드 · 노트북 인치 */
const a3 = {
  slug: "laptop-screen-size-guide", corner: "smartguide", field: "디지털·IT",
  title: "노트북, 내 작업엔 몇 인치가 맞을까", subtitle: "휴대성 vs 화면, 그 사이를 정하는 법",
  excerpt: "화면 큰 게 좋아 보이지만 매일 들고 다니면 무게가 발목을 잡죠. 인치·무게·해상도·화면비를 내 작업 기준으로 정리했습니다.",
  read_min: 8,
  summary: ["매일 휴대면 14형·1.3kg 안팎, 자리 고정이면 15.6~16형.", "16:10은 16:9보다 세로가 약 11% 넓어요.", "인치보다 ‘본체 실측 + 충전기 포함 총무게’를 보세요."],
  callout: "‘1.3kg이라 가볍다’에 속지 마세요. " + B("충전기까지 넣은 총 무게") + "로 봐야 정확해요. 그리고 요즘은 베젤이 얇아 ‘14형인데 옛 13형 부피’도 많으니, 인치보다 " + B("본체 실측") + "을 가방과 비교하세요.",
  closing: "큰 화면과 가벼움을 동시에 갖긴 어려운 편이에요. 매일 들고 다니면 14인치·1.3kg 안팎, 자리를 잡고 쓴다면 15.6~16인치가 합리적입니다. 다만 <span style=\"color:#ff8a6f;\">인치보다 본체 실측·화면비·총무게</span>가 실제 만족을 좌우해요. 선택은 당신의 몫입니다.",
  main: [
    P0("노트북을 사려고 보면 13인치부터 17인치까지 선택지가 넓은데요. 화면 큰 게 좋아 보이지만, 막상 매일 들고 다니면 무게가 발목을 잡는 딜레마가 생기기 마련이에요. ‘몇 인치가 정답이냐’는 결국 " + B("내가 어디서, 무슨 작업에 쓰느냐") + "가 정하는 편입니다."),
    DTREE({ title: "내 작업엔 몇 인치?", q1: "Q1. 노트북을 거의 매일 들고 다니시나요? (카페·강의·외근 잦음)", yes: "13~14형 · 1.3kg 안팎<br><span style=\"font-weight:500; font-size:11.5px; color:#76726b;\">휴대 최우선</span>", q2: "Q2. 주로 문서·웹·강의 위주인가요?", ya: "YES<br>13~14형 / FHD급", na: "코딩·편집<br>14형 고해상·16:10" }),
    H2("인치별로 이렇게 갈립니다"),
    `<div style="margin-top:22px;">${TABLE(["구분", "일반 무게", "추천 용도", "유의점"], [
      ["13~14형", "1.0~1.4kg", "휴대 최우선 · 문서·웹·코딩", "영상·그래픽 대작업엔 다소 좁음"],
      ["15.6형", "1.7~2.5kg", "가정·사무 메인 · 멀티미디어", "매일 휴대엔 무거운 편"],
      ["16형", "1.9~2.5kg", "영상·그래픽 · 고정 데스크", "부피 큼, 휴대 부담"],
    ])}</div>`,
    SUB("앵커 예시(제조사 스펙): MacBook Air 13형 1.24kg, MacBook Pro 16형 약 2.15kg · 같은 인치라도 슬림/게이밍에 따라 0.5~1kg 차이."),
    H2("인치보다 ‘화면비’를 보세요"),
    P("가로 해상도가 같을 때 " + B("16:10은 16:9보다 세로가 정확히 약 11% 넓어요.") + " 문서·코딩·표 작업에서 한 줄이라도 더 보이고 스크롤이 줄죠. 그래서 같은 14형이라도 1920×1200(16:10)이 1920×1080(16:9)보다 일하기 편한 편입니다."),
    P("해상도는 인치에 맞춰 보면 돼요. 13~14형은 2.5K면 충분하고 4K는 사실상 과잉(배터리만 더 먹어요), 15.6~16형은 FHD가 하한·2.5K가 실용적인 스위트스폿이에요."),
    H2("사기 전 체크리스트"),
    NUMLIST(ORANGE, [
      "매일 휴대면 1.3~1.5kg 이하인지, ‘노트북+충전기’ 총 무게를 계산했다",
      "인치만 보지 않고 본체 실측(mm)을 내 가방과 비교했다",
      "화면비가 16:10/3:2인지 확인했다 (16:9 대비 세로 약 11% 이득)",
      "인치에 맞는 해상도인지 봤다 (13~14형 2.5K면 충분 / 15.6~16형 FHD 하한)",
      "데스크에서 외장 모니터를 병행할 수 있다면 ‘작은 휴대형+모니터’도 비교했다",
    ]),
  ].join("\n"),
};

/* ============================================================ 4) 롱런팁 · 로봇청소기 */
const a4 = {
  slug: "robot-vacuum-longrun-care", corner: "longrun", field: "가전",
  title: "로봇청소기, 3년 멀쩡히 쓰는 관리 루틴", subtitle: "고장의 상당수는 ‘소모품 방치’에서 옵니다",
  excerpt: "1년 만에 흡입력이 뚝 떨어졌다면 기계 수명이 아니라 관리 문제일 수 있어요. 제조사 문서·배터리 자료로 ‘오래 쓰는 루틴’을 정리했습니다.",
  read_min: 7,
  summary: ["흡입력 저하 1순위는 ‘필터 막힘’이에요.", "센서 렌즈 먼지는 맵핑을 망가뜨려요 — 닦기는 ‘시력 회복’.", "배터리는 상시 도크 거치 OK, 깊은 방전·고온만 피하세요."],
  callout: "흡입력 저하의 1순위는 " + B("필터 막힘") + "이에요. 센서 렌즈에 먼지가 끼면 맵핑이 흐트러져 같은 곳을 반복하기도 하죠. " + B("센서 닦기는 미용이 아니라 ‘시력 회복’") + "이라고 보세요(세제·알코올 금지).",
  closing: "로봇청소기는 사실 ‘소모품 덩어리’예요. 본체 모터·내비는 멀쩡한데 필터·브러시·센서 방치로 ‘새로 사야겠다’가 되는 경우가 많죠. <span style=\"color:#ff8a6f;\">위 루틴의 절반만 지켜도</span> 흡입력과 맵핑 체감이 달라집니다. 오래 쓰는 건 비싼 모델이 아니라, 관리하는 사람이에요.",
  main: [
    P0("큰맘 먹고 산 로봇청소기, 1년쯤 지나니 흡입력이 예전 같지 않다고 느끼셨던 분 많으실 텐데요. 사실 성능 저하의 상당수는 기계 수명이 아니라 " + B("소모품 방치") + "에서 오는 편이에요. 제조사 공식 문서와 배터리 자료(Battery University)를 근거로 추렸습니다."),
    H2("주기별 관리 루틴"),
    P("흡입은 ‘좁은 공기길을 통과하는 흐름’이라, 필터·먼지통·브러시 한 곳만 막혀도 전체 성능이 무너지는 편이에요. 주기별로 이것만 지켜도 충분합니다."),
    NUMLIST(OLIVE, [
      B("매주") + " — 먼지통 비우기 + 메인브러시 양끝에 감긴 머리카락 제거 + 필터 털기(세척 아님) · 반려동물 가정은 주 2회",
      B("2주") + " — 센서(낙하방지·카메라·라이다) 마른 천으로 닦기, 메인브러시 청소",
      B("1~2개월") + " — 사이드브러시·바퀴 심층 청소, 충전 단자 닦기, 물걸레 패드 세탁·완전 건조, 도크 먼지봉투 교체(약 8주)",
      B("3~6개월") + " — 필터 교체, 사이드브러시 교체 (앱의 소모품 잔량 표시가 가장 정확)",
      B("6~12개월") + " — 메인브러시(롤러) 교체",
    ]),
    H2("소모품 교체 주기와 연간 유지비"),
    `<div style="margin-top:22px;">${TABLE(["소모품", "교체 주기", "방치하면"], [
      ["먼지통·필터 청소", "1~2주", "흡입력 저하 (80% 차면 약 25%↓)"],
      ["헤파 필터", "2~6개월", "흡입 저하·악취·모터로 미세먼지 유입"],
      ["사이드브러시", "3~6개월", "벽·모서리 미청소 구간 발생"],
      ["메인브러시", "6~12개월", "엉킴·마모로 쓸기 효율↓·모터 부하"],
      ["배터리", "2~4년", "주행시간 급감·도킹 전 방전"],
    ])}</div>`,
    SUB("국내 언론 집계 기준 연간 소모품비는 약 16만~33만원(브랜드 간 약 2배 차, 배터리 제외) · 일부 단품가는 추정."),
    H2("배터리는 이렇게 오래 씁니다"),
    P("" + B("상시 도크 거치는 안전한 편") + "이에요. BMS가 만충 시 회로를 차단하고, 오히려 깊은 방전을 막아 수명에 유리하거든요. 대신 자주 20% 이하로 떨구거나 베란다·보일러실 같은 더운 곳에 두는 게 가장 나빠요(리튬이온은 ‘만충+고온’ 보관이 최악)."),
    P("휴가·이사로 오래 안 쓸 땐 " + B("충전 40~50%로, 서늘한 실온") + "에 두세요. 런타임이 신품 절반 이하·충전 후 곧 정지·부풀음이면 교체 시점이고, 부풀면 즉시 사용을 멈추세요(화재 위험)."),
    H2("사기 전 체크리스트"),
    NUMLIST(OLIVE, [
      "소모품 단가·구입처를 확인했다 (정품 + 고평점 호환 둘 다 구할 수 있는지)",
      "물걸레 방식을 봤다 (롤러형은 패드 단가가 높아 유지비↑)",
      "어두운 집·검은 바닥이면 라이다, 카메라(vSLAM)는 조명이 필요한 점을 고려했다",
      "배터리 교체가 사용자 가능 모델인지·가격(약 5만~19만원)을 확인했다",
      "앱에 소모품 잔량 표시가 있는지 확인했다 (교체 시점 관리에 가장 정확)",
    ]),
  ].join("\n"),
};

/* ---------- 실행 ---------- */
const H = { apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" };
const DATE = {
  "air-purifier-999-factcheck": "2026-06-21T09:00:00+09:00",
  "food-waste-disposer-compare": "2026-06-20T09:00:00+09:00",
  "laptop-screen-size-guide": "2026-06-19T09:00:00+09:00",
  "robot-vacuum-longrun-care": "2026-06-18T09:00:00+09:00",
};
const rail = (a) => `<!--RAIL:${JSON.stringify({ summary: a.summary, callout: a.callout })}-->\n`;
const articles = [a1, a2, a3, a4].map((a) => ({
  slug: a.slug, corner: a.corner, field: a.field, title: a.title, subtitle: a.subtitle,
  excerpt: a.excerpt, read_min: a.read_min, body_html: rail(a) + a.main.trim(), closing: a.closing,
  is_published: true, created_at: DATE[a.slug],
}));

const del = await fetch(`${URL}/rest/v1/magazine?created_at=gte.2000-01-01`, { method: "DELETE", headers: { ...H, Prefer: "return=minimal" } });
console.log("delete:", del.status);
const ins = await fetch(`${URL}/rest/v1/magazine`, { method: "POST", headers: { ...H, Prefer: "return=representation" }, body: JSON.stringify(articles) });
console.log("insert:", ins.status);
console.log((await ins.text()).slice(0, 160));
