// 매거진 추가 콘텐츠 3편(매트리스·식기세척기·유산균). 자료조사 9각도 반영. 기존 글 유지(upsert).
const URL = process.env.SUPA_URL, KEY = process.env.SUPA_KEY;

/* ---------- 헬퍼 (상세 기준안 토큰, content.mjs와 동일) ---------- */
const P0 = (t) => `<p style="font-size:18px; line-height:1.95; color:#2c2a24; margin:0;">${t}</p>`;
const P = (t) => `<p style="font-size:18px; line-height:1.95; color:#2c2a24; margin:18px 0 0;">${t}</p>`;
const H2 = (t) => `<h2 style="font-family:'Noto Serif KR',serif; font-weight:700; font-size:27px; letter-spacing:-0.6px; line-height:1.3; margin:44px 0 0; color:#16140f;">${t}</h2>`;
const SUB = (t) => `<p style="font-size:15px; line-height:1.8; color:#76726b; margin:10px 0 22px;">${t}</p>`;
const B = (t) => `<b style="font-weight:700;">${t}</b>`;
const VS = (head, items) => `<div style="border:1px solid rgba(22,20,15,0.14); border-radius:12px; overflow:hidden;">
  <div style="display:grid; grid-template-columns:0.85fr 1.15fr; background:#16140f; color:#fff; font-family:'JetBrains Mono',monospace; font-size:11px; letter-spacing:.5px;"><div style="padding:13px 18px;">${head[0]}</div><div style="padding:13px 18px; border-left:1px solid rgba(255,255,255,0.14);">${head[1]}</div></div>
  ${items.map((r, i) => `<div style="display:grid; grid-template-columns:0.85fr 1.15fr; border-top:1px solid rgba(22,20,15,0.08);${i % 2 ? " background:#faf8f5;" : ""}"><div style="padding:16px 18px; font-weight:700; font-size:14px; color:#16140f;">${r[0]}</div><div style="padding:16px 18px; border-left:1px solid rgba(22,20,15,0.08); font-size:14px; line-height:1.75; color:#46433d;">${r[1]}</div></div>`).join("")}
</div>`;
const TABLE = (headers, rows) => {
  const gtc = headers.map((_, i) => (i === 0 ? "0.95fr" : "1fr")).join(" ");
  const head = `<div style="display:grid; grid-template-columns:${gtc}; background:#16140f; color:#fff; font-family:'JetBrains Mono',monospace; font-size:11px;">${headers.map((h) => `<div style="padding:12px 14px;">${h}</div>`).join("")}</div>`;
  const body = rows.map((row, ri) => `<div style="display:grid; grid-template-columns:${gtc}; border-top:1px solid rgba(22,20,15,0.08); font-size:13px;${ri % 2 ? " background:#faf8f5;" : ""}">${row.map((c, ci) => `<div style="padding:12px 14px; line-height:1.55;${ci === 0 ? " font-weight:700; color:#16140f;" : " color:#46433d;"}">${c}</div>`).join("")}</div>`).join("");
  return `<div style="border:1px solid rgba(22,20,15,0.14); border-radius:12px; overflow:hidden;">${head}${body}</div>`;
};
const NUMLIST = (color, items) => `<div style="margin-top:16px; border-top:1px solid rgba(22,20,15,0.12);">${items.map((t, i) => `<div style="display:flex; gap:14px; padding:15px 2px;${i < items.length - 1 ? " border-bottom:1px solid rgba(22,20,15,0.08);" : ""}"><span style="font-family:'JetBrains Mono',monospace; font-weight:700; font-size:13px; color:${color}; flex:none;">${String(i + 1).padStart(2, "0")}</span><span style="font-size:16px; line-height:1.6; color:#33312d;">${t}</span></div>`).join("")}</div>`;
const COSTBARS = (caption, rows, maxv, legend) => `<div style="border:1px solid rgba(22,20,15,0.14); border-radius:12px; padding:20px 22px; margin:26px 0 0; background:#fcfbf9;">
  <div style="font-family:'JetBrains Mono',monospace; font-size:10.5px; letter-spacing:1.5px; color:#9a9286;">${caption}</div>
  <div style="display:flex; flex-direction:column; gap:14px; margin-top:16px;">
  ${rows.map((r) => `<div><div style="display:flex; justify-content:space-between; align-items:baseline; margin-bottom:7px;"><span style="font-size:14px; font-weight:700;">${r.label}</span><span style="font-family:'JetBrains Mono',monospace; font-size:13px; font-weight:700;${r.hi ? " color:#ff5a3c;" : ""}">${r.num}</span></div><div style="display:flex; height:18px; border-radius:5px; overflow:hidden; background:#efe9df;"><div style="width:${Math.round((r.mid / maxv) * 100)}%; background:#16140f;"></div></div></div>`).join("")}
  </div>
  ${legend ? `<p style="font-size:13px; line-height:1.7; color:#76726b; margin:14px 0 0;">${legend}</p>` : ""}
</div>`;
const DTREE = ({ title, q1, yes, q2, ya, na }) => `<div style="border:1px solid rgba(22,20,15,0.14); border-radius:16px; padding:24px; margin:26px 0 0; background:#fcfbf9;">
  <div style="display:flex; align-items:center; gap:8px; margin-bottom:18px;"><span style="font-family:'JetBrains Mono',monospace; font-size:11px; font-weight:700; letter-spacing:1px; color:#ff5a3c;">DECISION TREE</span><span style="font-size:13px; font-weight:700; color:#16140f;">${title}</span></div>
  <div style="background:#ff5a3c; color:#fff; border-radius:10px; padding:13px 16px; font-size:14px; font-weight:700; line-height:1.45;">${q1}</div>
  <div style="display:grid; grid-template-columns:1fr 1fr; gap:14px; margin-top:12px;">
    <div style="display:flex; flex-direction:column; align-items:center; gap:8px;"><span style="font-family:'JetBrains Mono',monospace; font-size:11px; font-weight:700; color:#6f6b64;">YES ↓</span><div style="width:100%; text-align:center; border:1.5px solid #d8d2c7; color:#16140f; background:#fff; border-radius:9px; padding:12px; font-size:13.5px; font-weight:700; line-height:1.4;">${yes}</div></div>
    <div style="display:flex; flex-direction:column; align-items:center; gap:8px;"><span style="font-family:'JetBrains Mono',monospace; font-size:11px; font-weight:700; color:#9a9286;">NO ↓</span><div style="width:100%; background:#16140f; color:#fff; border-radius:9px; padding:12px 14px; font-size:13.5px; font-weight:700; line-height:1.4;">${q2}</div><div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; width:100%; margin-top:2px;"><div style="text-align:center; border:1.5px solid #d8d2c7; color:#16140f; background:#fff; border-radius:9px; padding:10px 6px; font-size:12px; font-weight:700; line-height:1.35;">${ya}</div><div style="text-align:center; border:1.5px solid #d8d2c7; color:#16140f; background:#fff; border-radius:9px; padding:10px 6px; font-size:12px; font-weight:700; line-height:1.35;">${na}</div></div></div>
  </div>
</div>`;
const WRAP = (h) => `<div style="margin-top:22px;">${h}</div>`;
const TEAL = "#1f6b66", SMART = "#e0481f", PURPLE = "#6e4690";

/* ============================================================ 5) 스마트가이드 · 매트리스 */
const m1 = {
  slug: "mattress-firmness-guide", corner: "smartguide", field: "리빙·주방",
  title: "매트리스, 내 잠엔 어떤 경도가 맞을까", subtitle: "자세 → 체중 → 고민, 순서대로 좁혀요",
  excerpt: "경도(딱딱함)는 절대값이 아니라 내 자세·체중에 따라 달라지는데요. ‘몇 점짜리’가 아니라 매칭 순서로 좁히는 법을 정리했습니다.",
  read_min: 8,
  summary: ["경도(느낌)와 지지력(척추 정렬)은 다른 거예요.", "같은 매트리스도 체중·자세에 따라 다르게 느껴져요.", "꺼진 매트리스는 토퍼로 못 살립니다 — 교체 신호."],
  callout: "‘medium-firm이 정답’이라는 말, 절반만 맞아요. 요통 연구(Lancet 2003)에서 firm보다 medium-firm이 나았지만 그건 출발점일 뿐, " + B("내 자세·체중") + "에 따라 체감 경도가 달라지니 가능하면 체험(트라이얼)으로 확인하세요.",
  closing: "‘몇 점짜리를 사라’는 정답은 없습니다. 자세로 큰 골격을 잡고, 체중으로 ±보정하고, 고민으로 소재를 미세조정하세요. <span style=\"color:#ff8a6f;\">단단함보다 ‘척추가 일자로 받쳐지는가(지지력)’</span>가 본질입니다. 선택은 당신의 몫입니다.",
  main: [
    P0("매트리스는 10년 가까이 매일 자는 물건인데요. 막상 고르려면 ‘soft·medium·firm’에 ‘메모리폼·라텍스·하이브리드’까지 뒤섞여 막막하죠. 동료심사 연구와 Sleep Foundation 자료로, ‘몇 점’이 아니라 매칭 순서를 정리했습니다."),
    H2("먼저 — 경도 ≠ 지지력, 그리고 사람마다 다르다"),
    P("경도(firmness)는 ‘누웠을 때 첫 느낌’, 지지력(support)은 ‘척추를 일자로 받쳐주는 성능’이에요. " + B("부드러운데 잘 받쳐주는 매트리스도, 단단한데 안 받쳐주는 매트리스도") + " 있어요. 게다가 같은 ‘medium’도 가벼운 사람에겐 firm, 무거운 사람에겐 soft로 느껴지는 편이라 — 숫자를 절대값으로 믿으면 안 됩니다."),
    DTREE({ title: "내 잠엔 어떤 경도?", q1: "Q1. 주로 옆으로(모로) 누워 주무시나요?", yes: "옆잠 → medium 5~6<br><span style=\"font-weight:500; font-size:11.5px; color:#76726b;\">어깨·엉덩이 쿠셔닝 우선</span>", q2: "Q2. 엎드려 자는 편인가요?", ya: "엎드림<br>firm 6~8", na: "등·혼합<br>medium-firm 5~7" }),
    P("여기에 " + B("체중으로 ±보정") + "해요. 가벼우면(약 59kg 미만) 한 단계 부드럽게(firm이 널빤지처럼 느껴짐), 무거우면(약 104kg 초과) 한 단계 단단하게 + 침강을 막아줄 하이브리드·스프링 코어가 유리한 편입니다."),
    H2("소재별로 이렇게 갈립니다"),
    WRAP(TABLE(["구분", "메모리폼", "라텍스", "하이브리드", "스프링"], [
      ["느낌", "밀착·압력분산", "탄력·반응", "폼+코일 균형", "탄탄·통기"],
      ["열축적", "갇히는 편", "시원한 편", "중간", "시원"],
      ["모션 분리", "우수", "중상", "중상", "약함"],
      ["평균 수명(추정)", "6~7년", "7.5~8.5년", "6.5~7.5년", "5.5~6.5년"],
    ])),
    SUB("수명은 Sleep Foundation 내구성 데이터 기준 추정 · 라텍스를 10년 이상으로 보는 판매자 출처도 있으나 보수적 수치를 채택했습니다."),
    H2("스펙 읽는 법 — 숫자에 안 속기"),
    P0("소재를 좁혔다면 라벨의 숫자도 읽을 줄 알면 좋은데요. 세 가지만 기억하세요."),
    `<div style="margin:18px 0 0; font-size:15.5px; color:#2c2a24; line-height:1.95;"><b style="font-weight:700; color:#16140f;">폼 밀도(kg/m³)</b> · 내구성을 좌우해요. 메모리폼은 약 40 이상이 내구 하한, 50~60이 적정 쿠션감이에요(저밀도 저가폼은 1~2년 내 꺼지기도). 단 ‘밀도 = 단단함’은 아니에요 — 단단함은 ILD가 정해요.<br><b style="font-weight:700; color:#16140f;">라텍스 던롭 vs 탈라레이</b> · 던롭은 고밀도라 더 단단·오래가고, 탈라레이는 더 부드럽고 시원한 편이에요. 천연/합성 혼합비도 라벨로 확인하세요.<br><b style="font-weight:700; color:#16140f;">스프링 게이지·코일수</b> · 게이지는 숫자가 낮을수록 굵고 단단해요(13~15가 무난). 포켓스프링은 퀸 코일 400개 이상이면 무난하지만, 숫자만으로 품질을 단정하진 마세요.</div>`,
    H2("사기 전, 함정 피하는 법"),
    P("경도 숫자는 표준이 없어 " + B("브랜드마다 6/10이 다른") + " 편이에요. 그래서 ‘직접 누워보기·체험(트라이얼)’이 중요하고요. 또 토퍼는 ‘딱딱→부드럽게’만 가능하지, 이미 꺼진 매트리스는 못 살려요. " + B("빈 상태에서 1.5인치 이상 꺼지거나 7~10년이 지났으면 교체 신호") + "예요."),
    P("‘100일 체험’도 잔글씨를 보세요. 적응기간(보통 2주~1개월)이 차감되고, ‘무료’라도 회수비가 붙기도 해요. 얼룩·냄새가 있으면 반품이 거절되니 " + B("방수 프로텍터는 사실상 필수") + "고요. (참고: 국내는 법정 7일 청약철회권이 별도로 살아 있어, 불리한 반품 약관은 무효예요.)"),
    H2("커플·위생까지 — 오래 잘 쓰는 법"),
    P0("둘이 쓴다면 " + B("뒤척임이 전달되는 정도(모션 분리)") + "가 중요해요. 메모리폼·포켓스프링이 본넬보다 유리하고요. 선호 경도가 다르면 양쪽을 다르게 구성한 모델이나 한쪽에만 토퍼를 까는 방법이 있어요. 가장자리에 앉거나 자는 일이 많으면 모서리 지지(edge support)가 좋은 하이브리드·스프링이 편한 편입니다."),
    P("토퍼는 ‘보정 도구’지 ‘회생 도구’가 아니에요. " + B("딱딱한 걸 부드럽게는 가능") + "하고 보통 3인치 두께부터 체감이 뚜렷해지는데요. 하지만 이미 꺼진 매트리스는 토퍼가 그 골을 그대로 따라가서 못 살려요. 그건 교체 신호입니다."),
    P("위생은 의외로 빨라요. 새 매트리스도 " + B("약 4개월이면 집먼지진드기 알레르겐이 유의미하게 쌓인다는") + " 연구가 있어요. 본체는 빨 수 없으니 방수 프로텍터로 막고, 침구는 주 1회 약 54℃ 이상 온수로 세탁하는 게 핵심이에요. 바닥에 직접 두면 결로로 밑면에 곰팡이가 피기 쉬우니 프레임을 쓰거나 자주 세워 환기하세요."),
    H2("사기 전 체크리스트"),
    NUMLIST(SMART, [
      "내 수면 자세로 경도 범위를 먼저 잡았다 (옆 5~6 / 등·혼합 5~7 / 엎드림 6~8)",
      "체중으로 ±보정했다 (가벼우면 더 부드럽게, 무거우면 더 단단·하이브리드)",
      "‘단단함’이 아니라 ‘척추가 일자로 받쳐지는가(지지력)’를 봤다",
      "방수 프로텍터를 함께 챙겼다 (위생 + 반품 자격 보존)",
      "체험·반품 잔글씨(적응기간·회수비·위생 조건)를 캡처해뒀다",
    ]),
  ].join("\n"),
};

/* ============================================================ 6) 트렌드랩 · 식기세척기 */
const m2 = {
  slug: "dishwasher-worth-it", corner: "trendlab", field: "가전",
  title: "식기세척기, 정말 살 가치 있을까", subtitle: "물·전기·시간으로 따져본 손익",
  excerpt: "물은 손설거지의 약 1/6로 확실히 아끼는데요. 다만 ‘평균 손설거지’ 대비일 때 얘기고, 승패를 가르는 건 기계가 아니라 습관이에요.",
  read_min: 8,
  summary: ["물은 손설거지의 약 1/6(16.6L vs 101.2L) — 확실히 아껴요.", "전기·물·세제 합쳐 연 약 11~24만원 운영비가 들어요.", "승패를 가르는 건 기계가 아니라 ‘어떻게 씻느냐’예요."],
  callout: "‘돌리면 끝’이 아니에요. 안 닦임의 상당수는 기계가 아니라 " + B("과적·분사암 막힘·필터 방치") + "에서 와요. 밥풀·계란·기름은 본래 난세척이라, 제조사도 ‘긁어내되 헹구지는 말라’고 합니다.",
  closing: "물·시간·위생 면에선 분명 이득이 큰 편이에요. 다만 <span style=\"color:#ff8a6f;\">1~2인이고 이미 찬물·두 대야로 빠르게 씻는다면</span> 이득이 작아져요. ‘기계가 친환경’이 아니라 풀로드·애벌금지 같은 ‘습관’이 더 큰 지렛대입니다. 선택은 당신의 몫입니다.",
  main: [
    P0("식기세척기, ‘이제 필수가전’이라는데 정작 ‘우리 집엔 이득일까’가 헷갈리죠. 한국소비자원·독일 본대학교 시험과 전기·수도 단가를 대입해, 자원과 비용으로 따져봤습니다."),
    H2("물은 확실히 아낍니다 — 단, 조건부"),
    P("1회 물 사용량은 식기세척기 약 13~17L, 손설거지 평균 약 100L예요(소비자원 16.6L vs 101.2L). 약 " + B("6~8배 절수") + "죠. 다만 ‘평균 손설거지’ 대비예요. 찬물로 두 대야에 30~40L로 끝내는 사람이라면 격차가 2배 안팎으로 좁혀지고, 흐르는 물을 오래 쓰면 손설거지가 440L까지 치솟기도 해요(본대학교 실측 33~440L, 13배 차)."),
    COSTBARS("월 설거지 비용 — 예시(흐르는 물·온수 손설거지 vs 평균 식기세척기, 추정)", [
      { label: "손설거지(온수)", num: "약 6,000원", mid: 6000 },
      { label: "식기세척기", num: "약 5,500원", mid: 5500 },
    ], 6500, "찬물·두 대야로 빠르게 씻으면 손설거지가 더 싸질 수 있어요. 식기세척기 에너지의 약 80%가 ‘물 데우기’라, 에코모드·찬물 헹굼이 절약의 거의 전부입니다."),
    H2("전기료는 생각보다 작아요"),
    P("연간 전기료는 약 2.6만~7.5만원(추정)인데, " + B("우리 집 기존 전기 사용량이 누진 몇 단계냐") + "가 비용을 좌우해요. 식기세척기 에너지의 약 80%가 물 데우는 데 쓰여, 에코모드·낮은 수온이 절전의 거의 전부고요. 세제·린스·(경수면)소금까지 합치면 연 운영비는 대략 11만~24만원(추정)이에요."),
    H2("그래서, 누구에게 이득일까"),
    WRAP(TABLE(["식기세척기 이득 ↑", "이득 작거나 손해"], [
      ["풀로드로 돌릴 수 있다 (다인 가구)", "1~2인, 반쪽으로 자주 돌린다"],
      ["에코 모드를 주로 쓴다", "쾌속을 즐겨 쓴다 (물·전기↑)"],
      ["흐르는 물로 애벌하던 습관", "이미 찬물·두 대야로 30L에 끝낸다"],
      ["온수 손설거지라 가스비가 숨어 있었다", "전기 사용량이 누진 3단계다"],
    ])),
    H2("안 닦임·물기·냄새 — 대부분 세팅과 관리"),
    P0("‘안 닦인다’의 상당수는 기계가 아니라 " + B("세팅") + "이에요. 그릇을 빽빽이 채우면 분사수가 못 돌고, 키 큰 냄비가 분사암 회전을 막으면 전체 세척력이 떨어져요. 오목한 그릇은 엎어서, 더러운 면은 분사암 쪽으로 두는 게 기본이고요. 밥풀·계란·기름은 본래 난세척이라 긁어내거나 살짝 불리면 좋아집니다."),
    P("물기 불만은 " + B("건조 방식") + " 때문인 경우가 많아요. 히터(열풍)는 빠르지만 전기를 더 먹고, 응축·여열식은 효율은 좋은데 플라스틱에 물기가 남기 쉬워요(플라스틱은 친수성이 약해 잘 안 말라요). 보쉬·밀레 등의 제올라이트 방식은 고효율이지만 특정 브랜드에 한정되고요. 물자국이 신경 쓰이면 린스를 쓰는 게 가장 간단합니다."),
    P("냄새와 하얀 자국도 관리의 영역이에요. 냄새는 대개 " + B("필터에 낀 잔반과 배수구 기름때") + "에서 오니 필터는 주 1회 비우고 통 청소를 월 1회 하세요. 하얀 막은 경수의 미네랄(린스·소금으로 예방)이고, 세제를 많이 넣을수록 오히려 잔여물이 늘어요. 참고로 최신 제품 소음은 34~38dB로 조용한 편이지만, 세척은 즉시가 아니라 표준 1~2시간·자동 2~3시간이 걸린다는 점은 알고 사세요."),
    H2("사기 전 체크리스트"),
    NUMLIST(PURPLE, [
      "설치 3요소(급수·배수·220V 접지 콘센트)와 공간 치수를 실측했다",
      "가구·식기량에 맞는 용량인지 봤다 (인원×3이 출발선, 냄비까지면 한 단계 크게)",
      "애벌은 ‘긁어내되 헹구지 않기’가 기본임을 안다",
      "손세척 권장 품목(코팅팬·나무·칼·알루미늄·놋)을 가렸다",
      "에너지효율등급과 1회 물·전기 사용량 스펙을 비교했다",
    ]),
  ].join("\n"),
};

/* ============================================================ 7) 팩트체크 · 프로바이오틱스 */
const m3 = {
  slug: "probiotics-cfu-factcheck", corner: "factcheck", field: "식품·건강",
  title: "‘유산균 100억 보장’ 광고, 진짜 효과일까", subtitle: "보장균수·균주·인정 기능성을 봅니다",
  excerpt: "‘100억·4500억’ 같은 큰 숫자가 곧 효과는 아닌데요. 식약처가 인정한 기능성과 ‘보장균수 vs 투입균수’의 차이부터 따져봤습니다.",
  read_min: 8,
  summary: ["유산균이 공식적으로 말할 수 있는 건 ‘장 건강’ 정도예요.", "큰 숫자보다 ‘보장균수·균종·인증마크’를 보세요.", "효과는 균‘주(strain)’가 정해요 — 종만 같다고 같지 않아요."],
  callout: "‘면역력·다이어트·피부’를 내세우면 과장 신호예요. 고시형 유산균이 인정받은 기능성은 " + B("‘유산균 증식·유해균 억제·배변활동 원활·장 건강’") + " 정도뿐이고, 일부 표현은 식약처가 부당광고로 적발했어요.",
  closing: "‘100억’이 ‘2배 효과’는 아닙니다. 식약처 일일 권장은 1억~100억 CFU이고, 효과는 숫자가 아니라 <span style=\"color:#ff8a6f;\">내 목적에 맞는 ‘균주’와 보장균수·표시 정직성</span>이 좌우해요. 선택은 당신의 몫입니다.",
  main: [
    P0("유산균 광고마다 ‘100억·4500억 보장’에 ‘면역·다이어트·피부’까지 붙는데요. 큰 숫자가 곧 효과일 것 같지만, 식약처 기준과 한국소비자원 비교시험을 보면 봐야 할 건 따로 있어요."),
    H2("광고 문구 vs 실제 의미"),
    SUB("자주 보이는 표현과, 그 숫자가 실제로 무엇을 뜻하는지 정리했습니다."),
    VS(["광고 문구", "실제 의미"], [
      ["“유산균 100억·4500억 보장”", "식약처 일일 권장은 1억~100억 CFU예요. 그 이상이 효과를 비례적으로 더 준다는 건 인정된 사항이 아니에요. 봐야 할 건 숫자 크기보다 균종·보장균수입니다."],
      ["“면역력 / 다이어트 / 피부”", "고시형 유산균의 인정 기능성이 아니에요. 일부는 식약처 부당광고 적발 표현이고요. 체지방·피부는 특정 ‘개별인정’ 균주에만 해당해요."],
      ["“장까지 살아서 도달 / 코팅”", "코팅은 시험관(모사 위장) 생존을 높이는 거지, 임상 효과 우월을 뜻하진 않아요. 가장 많이 연구된 균주들은 코팅 없이 효능이 입증됐어요."],
      ["“○종 복합 유산균”", "종 수보다 균‘주(strain)’가 효능을 정해요. 소비자원 시험에선 ‘19종’ 표시인데 실측은 1종에 편중, ‘13종’ 표시인데 1종만 실질 함유한 사례가 드러났어요. 가짓수가 아니라 균주를 보세요."],
    ]),
    H2("그래서 뭘 봐야 할까요"),
    `<div style="margin:18px 0 0; font-size:15.5px; color:#2c2a24; line-height:1.95;"><b style="font-weight:700; color:#16140f;">인증마크</b> · 건강기능식품 도안이 있는지부터 보세요. 없으면 식약처 기능성 인정 제품이 아니에요.<br><b style="font-weight:700; color:#16140f;">보장균수</b> · ‘소비기한까지 살아있는 수’인지 확인하세요. ‘투입균수(제조 시)’만 크게 적힌 경우, 다 먹을 땐 줄어 있을 수 있어요(소비자원: 1,000억 표시인데 실측 125억 사례).<br><b style="font-weight:700; color:#16140f;">균주 표시</b> · 속·종·균주(예: L. rhamnosus GG)까지 적혀 있고, 내 목적에 시험된 균주인지.<br><b style="font-weight:700; color:#16140f;">보관</b> · 균은 생명체라 시간·온도·습기로 줄어요. 냉장 보관 권장인지 확인하세요.<br><b style="font-weight:700; color:#16140f;">제품 종류</b> · ‘건강기능식품’ 마크가 있는 건기식인지, ‘발효유’ 같은 일반식품인지 보세요. 일반식품은 기능성 표시를 못 해요.</div>`,
    H2("효과, 어디까지 근거가 있나"),
    WRAP(TABLE(["상황", "근거 수준"], [
      ["항생제 연관 설사 예방(소아)", "비교적 근거 있음 (특정 균주·용량)"],
      ["과민성장증후군(IBS) 일부 증상", "제한적·균주 특이적"],
      ["면역 증진·체중 감소·피부", "근거 약함/불충분"],
    ])),
    SUB("국제 과학(Cochrane/NIH) 기준이며 균주·용량 특이적 · 한국 건기식의 법적 인정 기능성과는 별개예요. 면역저하·중증·영유아는 섭취 전 주의가 필요합니다."),
    H2("‘장에 평생 산다’? 대부분 통과합니다"),
    P0("광고가 즐겨 쓰는 ‘장에 살아서 정착’이라는 말, 성인에겐 대체로 과장이에요. 연구를 보면 " + B("외부에서 먹은 균은 성인 장에 거의 정착하지 못하고 대부분 통과(transient)") + "해요. 그래서 효과는 ‘먹는 동안’ 위주이고, 끊으면 수일~수주 안에 씻겨 나가는 편이라 — 꾸준한 섭취가 전제입니다."),
    P("효과를 정하는 건 ‘유산균’이라는 종이 아니라 " + B("균‘주(strain)’") + "예요. 같은 종이라도 균주가 다르면 결과가 갈려서, 228건의 임상을 모은 분석도 ‘균주·질환마다 다르다’가 결론이었어요. 참고로 2020년 락토바실러스 속이 여러 속으로 재분류돼 학명이 바뀌었지만, 종·균주 표시와 기존 근거는 그대로예요(이름만 바뀐 것)."),
    P("‘여러 균주가 들었으니 더 좋다’도 자동으로 맞는 말은 아니에요. 직접 비교한 연구들에서 " + B("다균주가 단일균주보다 일관되게 낫지는 않았고") + ", 핵심은 가짓수가 아니라 ‘내 목적에 맞는 균주가 검증된 용량으로 들었는가’였어요. 숫자·가짓수 경쟁에 휘둘리지 마세요."),
    H2("사기 전 체크리스트"),
    NUMLIST(TEAL, [
      "건강기능식품 인증마크가 있는가",
      "‘보장균수(소비기한 기준)’로 표기됐는가 (투입균수 아님)",
      "균종(strain)이 명시됐고, 내 목적에 맞는 균주인가",
      "인정 기능성 문구(장 건강)인가, ‘면역·다이어트·피부’식 과장인가",
      "가격에 현혹되지 않았는가 (소비자원 시험 1회분 최대 약 7배 차, 가격≠품질)",
    ]),
  ].join("\n"),
};

/* ---------- 실행: 추가 삽입(upsert, 삭제 없음) ---------- */
const H = { apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" };
const DATE = {
  "dishwasher-worth-it": "2026-06-21T15:00:00+09:00",
  "mattress-firmness-guide": "2026-06-21T14:00:00+09:00",
  "probiotics-cfu-factcheck": "2026-06-21T13:00:00+09:00",
};
const rail = (a) => `<!--RAIL:${JSON.stringify({ summary: a.summary, callout: a.callout })}-->\n`;
const articles = [m1, m2, m3].map((a) => ({
  slug: a.slug, corner: a.corner, field: a.field, title: a.title, subtitle: a.subtitle,
  excerpt: a.excerpt, read_min: a.read_min, body_html: rail(a) + a.main.trim(), closing: a.closing,
  is_published: true, created_at: DATE[a.slug],
}));

const res = await fetch(`${URL}/rest/v1/magazine?on_conflict=slug`, {
  method: "POST",
  headers: { ...H, Prefer: "resolution=merge-duplicates,return=representation" },
  body: JSON.stringify(articles),
});
console.log("upsert:", res.status);
console.log((await res.text()).slice(0, 200));
