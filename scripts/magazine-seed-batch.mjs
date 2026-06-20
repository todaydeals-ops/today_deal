// 일회용 — 매거진 대표 카테고리 글 3편 추가(팩트체크·스마트가이드·롱런팁). 보이스 v2 + 절제 팔레트.
const URL = process.env.SUPA_URL, KEY = process.env.SUPA_KEY;

// ---- 컴포넌트 헬퍼 ----
const P0 = (t) => `<p style="font-size:16px; color:#33312d; line-height:1.85; margin:0;">${t}</p>`;
const P = (t) => `<p style="font-size:16px; color:#33312d; line-height:1.85; margin:16px 0 0;">${t}</p>`;
const H2 = (t) => `<h2 style="font-size:21px; font-weight:800; color:#1a1a1a; margin:34px 0 12px; letter-spacing:-0.4px;">${t}</h2>`;
const CALL = (label, t) => `<div style="border:1px solid #e7e2d9; background:#faf8f5; border-radius:10px; padding:16px 18px; margin:24px 0;"><div style="font-size:11px; font-weight:700; letter-spacing:1px; color:#ff5a3c; margin-bottom:6px;">짚고 가요</div><p style="margin:0; font-size:14.5px; color:#33312d; line-height:1.75;">${t}</p></div>`;
const CHECK = (rows) => `<div style="border:1px solid #e7e2d9; border-radius:12px; padding:8px 20px;">${rows.map((r, i) => `<div style="display:flex; align-items:center; gap:12px; padding:13px 0;${i < rows.length - 1 ? " border-bottom:1px solid #f1ede6;" : ""}"><span style="width:20px; height:20px; border:2px solid #ff5a3c; border-radius:5px; display:flex; align-items:center; justify-content:center; flex:none;"><svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="#ff5a3c" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg></span><span style="font-size:14px; color:#33312d;">${r}</span></div>`).join("")}</div>`;
const TABLE = (headers, rows) => {
  const gtc = "0.9fr " + "1fr ".repeat(headers.length - 1);
  const head = `<div style="display:grid; grid-template-columns:${gtc}; background:#1a1a1a; color:#fff; font-size:12px; font-weight:600;">${headers.map((h) => `<div style="padding:11px 13px;">${h}</div>`).join("")}</div>`;
  const body = rows.map((row, ri) => `<div style="display:grid; grid-template-columns:${gtc}; border-top:1px solid #efece7; font-size:12.5px;${ri % 2 ? " background:#faf8f5;" : ""}">${row.map((c, ci) => `<div style="padding:11px 13px;${ci === 0 ? " font-weight:700; color:#1a1a1a;" : " color:#46433d;"}">${c}</div>`).join("")}</div>`).join("");
  return `<div style="border:1px solid #e7e2d9; border-radius:12px; overflow:hidden;">${head}${body}</div>`;
};

// ---- 1) 팩트체크 · 공기청정기 99.9% ----
const a1 = {
  slug: "air-purifier-999-factcheck",
  corner: "factcheck",
  field: "가전",
  title: "‘초미세먼지 99.9% 제거’ 광고, 어디까지 진짜일까",
  subtitle: "숫자 뒤에 숨은 ‘시험 조건’을 봅니다",
  excerpt: "공기청정기마다 99.9%인데 왜 우리 집 공기는 그대로일까요. 그 숫자가 어디서 나온 건지부터 따져봤습니다.",
  read_min: 5,
  closing: "광고의 99.9%는 거짓이 아니지만, 우리 집 성능을 보장하지도 않습니다. 숫자에 끌리기보다 <b style=\"font-weight:800; color:#fff;\">CADR·적용면적·소음·필터비를 같이 보세요. 선택은 당신의 몫입니다.</b>",
  body_html: [
    P0("공기청정기 광고마다 ‘초미세먼지 99.9% 제거’가 붙어 있는데요. 정작 우리 집 공기는 별로 달라진 것 같지 않아 의아하셨던 분들 많으실 텐데요. 결론부터 말하면 그 숫자는 <b style=\"font-weight:700;\">거짓은 아니지만, ‘우리 집 성능’도 아닌</b> 편이에요. 어디서 나온 숫자인지부터 보면 이유가 보입니다."),
    H2("광고 문구 vs 실제 의미"),
    TABLE(["광고 문구", "실제 의미"], [
      ["“초미세먼지 99.9% 제거”", "밀폐 시험 챔버에서 필터를 1회 통과할 때의 포집률이에요. 생활 공간은 챔버와 달라서, 그대로 체감되진 않는 편입니다."],
      ["“헤파 H13 등급”", "0.3㎛ 입자를 99.95% 이상 거르는 ‘필터 자체’ 성능인데요. 기기가 공기를 얼마나 빨리 순환시키는지는 별개예요."],
      ["“최대 ○○㎡ 적용”", "표준 조건(천장고 약 2.4m) 기준이라, 실제는 더 좁게 보는 게 안전한 수준이에요."],
    ]),
    H2("그럼 뭘 봐야 할까요"),
    P0("광고 숫자 대신, 실사용 체감을 좌우하는 건 따로 있는 편인데요."),
    `<div style="margin:16px 0 0; font-size:15.5px; color:#33312d; line-height:1.9;"><b style="font-weight:700; color:#1a1a1a;">CADR</b> : 청정공기공급률인데요. 1분에 깨끗한 공기를 얼마나 내보내는지를 나타내는 핵심 수치예요. 적용면적보다 이 숫자가 체감을 좌우하는 편입니다.<br><b style="font-weight:700; color:#1a1a1a;">적용면적 여유</b> : 실평수의 1.3~1.5배 모델을 고르면 공기 순환에 여유가 생기는 수준이에요.<br><b style="font-weight:700; color:#1a1a1a;">취침 소음</b> : 침실용이라면 가장 조용한 단계의 dB을 확인하세요. 광고 소음은 보통 최저 풍량 기준이에요.<br><b style="font-weight:700; color:#1a1a1a;">필터 교체비</b> : 헤파 필터는 보통 6개월~1년마다 갈아요. 연간 비용을 미리 더해보는 게 좋은 편입니다.</div>`,
    CALL("99.9%·H13 같은 숫자는 <b style=\"font-weight:700;\">필터 성능</b>이지, ‘방 전체를 그만큼 깨끗하게 만든다’는 뜻이 아닌 편이에요. 같은 필터라도 풍량(CADR)이 낮으면 체감은 달라집니다."),
  ].join("\n"),
};

// ---- 2) 스마트가이드 · 노트북 몇 인치 ----
const tree = `
<div style="border:1px solid #e7e2d9; border-radius:16px; padding:24px; margin:28px 0; background:#fcfbf9;">
  <div style="display:flex; align-items:center; gap:8px; margin-bottom:18px;"><span style="font-size:11px; font-weight:700; letter-spacing:1px; color:#ff5a3c;">DECISION TREE</span><span style="font-size:13px; font-weight:700; color:#1a1a1a;">내 작업엔 몇 인치?</span></div>
  <div style="background:#ff5a3c; color:#fff; border-radius:10px; padding:13px 16px; font-size:14px; font-weight:700;">Q1. 노트북을 거의 매일 들고 다니시나요? (카페·강의·외근 잦음)</div>
  <div style="display:grid; grid-template-columns:1fr 1fr; gap:14px; margin-top:12px;">
    <div style="display:flex; flex-direction:column; align-items:center; gap:8px;">
      <span style="font-size:11px; font-weight:700; color:#9a958c;">YES ↓</span>
      <div style="width:100%; background:#1a1a1a; color:#fff; border-radius:9px; padding:12px 14px; font-size:13.5px; font-weight:700;">Q2. 주로 문서·웹·강의 위주인가요?</div>
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; width:100%; margin-top:2px;">
        <div style="text-align:center; border:1.5px solid #d8d2c7; color:#1a1a1a; background:#faf8f5; border-radius:9px; padding:10px 6px; font-size:12px; font-weight:700;">YES<br>13~14형</div>
        <div style="text-align:center; border:1.5px solid #d8d2c7; color:#1a1a1a; background:#faf8f5; border-radius:9px; padding:10px 6px; font-size:12px; font-weight:700;">코딩·편집<br>14형 고해상</div>
      </div>
    </div>
    <div style="display:flex; flex-direction:column; align-items:center; gap:8px;">
      <span style="font-size:11px; font-weight:700; color:#6f6b64;">NO ↓</span>
      <div style="width:100%; text-align:center; border:1.5px solid #d8d2c7; color:#1a1a1a; background:#faf8f5; border-radius:9px; padding:12px; font-size:13.5px; font-weight:700;">15.6~16형<br><span style="font-weight:500; font-size:11.5px; color:#76726b;">넓은 화면, 멀티작업</span></div>
    </div>
  </div>
</div>`;
const a2 = {
  slug: "laptop-screen-size-guide",
  corner: "smartguide",
  field: "디지털·IT",
  title: "노트북, 내 작업엔 몇 인치가 맞을까",
  subtitle: "휴대성 vs 화면, 그 사이를 정하는 법",
  excerpt: "화면 큰 게 좋아 보이지만 막상 들고 다니면 무게가 발목을 잡죠. ‘몇 인치냐’는 결국 내가 어디서 무슨 작업을 하느냐가 정하는 편입니다.",
  read_min: 5,
  closing: "큰 화면과 가벼움을 동시에 갖긴 어려운 편이에요. 매일 들고 다닌다면 14인치 이하, 자리를 잡고 쓴다면 15.6~16인치가 합리적입니다. <b style=\"font-weight:800; color:#fff;\">선택은 당신의 몫입니다.</b>",
  body_html: [
    P0("노트북을 사려고 보면 13인치부터 16인치까지 선택지가 넓은데요. 화면 큰 게 좋아 보이지만, 막상 매일 들고 다니면 무게가 발목을 잡는 딜레마가 생기기 마련이에요. ‘몇 인치가 정답이냐’는 결국 <b style=\"font-weight:700;\">내가 노트북을 어디서, 무슨 작업에 쓰느냐</b>가 정하는 편인데요. 흐름부터 짚어볼게요."),
    tree,
    H2("인치별로 이렇게 갈립니다"),
    TABLE(["구분", "무게(대략)", "추천 용도"], [
      ["13~14형", "1.0~1.4kg", "휴대 최우선 · 문서·웹·강의"],
      ["14형(고해상)", "1.3~1.6kg", "휴대+작업 절충 · 코딩·편집 입문"],
      ["15.6~16형", "1.6~1.9kg", "한자리 작업 · 멀티태스킹·영상"],
    ]),
    P("무게 200~300g 차이가 별것 아닌 것 같아도, 매일 가방에 넣으면 체감이 꽤 다른 편이에요. 반대로 영상 편집이나 표 작업이 많다면 화면 1~2인치가 작업 속도를 바꾸기도 하고요."),
    CALL("인치만큼 중요한 게 <b style=\"font-weight:700;\">무게와 해상도</b>인데요. 같은 15.6인치라도 1.6kg과 1.9kg은 휴대감이 전혀 다른 수준이에요. 스펙표에서 무게(kg)를 꼭 같이 확인하세요."),
  ].join("\n"),
};

// ---- 3) 롱런팁 · 로봇청소기 관리 ----
const a3 = {
  slug: "robot-vacuum-longrun-care",
  corner: "longrun",
  field: "가전",
  title: "로봇청소기, 3년 멀쩡히 쓰는 관리 루틴",
  subtitle: "고장의 상당수는 ‘소모품 방치’에서 옵니다",
  excerpt: "1년 만에 흡입력이 뚝 떨어졌다면, 기계 수명이 아니라 관리 문제일 수 있어요. 주기별 루틴만 잡아도 체감 수명이 길어지는 편입니다.",
  read_min: 5,
  closing: "로봇청소기 수명은 가격표가 아니라 ‘루틴’이 정하는 편이에요. 위 항목의 절반만 지켜도 흡입력과 맵핑 체감이 달라집니다. <b style=\"font-weight:800; color:#fff;\">오래 쓰는 건 비싼 모델이 아니라, 관리하는 사람입니다.</b>",
  body_html: [
    P0("큰맘 먹고 산 로봇청소기, 1년쯤 지나니 흡입력이 예전 같지 않다고 느끼셨던 분 많으실 텐데요. 사실 성능 저하의 상당수는 기계 수명이 아니라 <b style=\"font-weight:700;\">소모품 방치</b>에서 오는 편이에요. 관리 루틴만 잡아도 체감 수명이 꽤 길어집니다."),
    H2("주기별 관리 루틴"),
    CHECK([
      "<b style=\"font-weight:700;\">매주</b> — 먼지통 비우기 + 메인 브러시에 감긴 머리카락 제거",
      "<b style=\"font-weight:700;\">2주</b> — 흡입구 필터 털기, 바퀴·센서 주변 먼지 제거",
      "<b style=\"font-weight:700;\">1~2개월</b> — 헤파 필터 교체, 센서·낙하방지 렌즈 부드러운 천으로 닦기",
      "<b style=\"font-weight:700;\">3~6개월</b> — 사이드 브러시·메인 브러시 교체, 물걸레 패드 교체",
    ]),
    H2("소모품 교체 주기 한눈에"),
    TABLE(["소모품", "교체 주기", "안 하면"], [
      ["먼지통·필터 청소", "1~2주", "흡입력 저하"],
      ["헤파 필터", "1~2개월", "미세먼지 재배출"],
      ["사이드 브러시", "3~6개월", "구석 청소력 저하"],
      ["메인 브러시", "6~12개월", "머리카락 엉킴·소음"],
      ["배터리", "2~3년", "주행 시간 단축"],
    ]),
    CALL("센서 렌즈에 먼지가 끼면 ‘맵핑’이 흐트러져 같은 곳을 반복하거나 충전독을 못 찾는 일이 생기는 편이에요. 흡입력만큼 <b style=\"font-weight:700;\">센서 청소</b>도 중요한 수준입니다."),
  ].join("\n"),
};

const articles = [a1, a2, a3].map((a) => ({ ...a, is_published: true }));

const res = await fetch(`${URL}/rest/v1/magazine?on_conflict=slug`, {
  method: "POST",
  headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": "application/json", Prefer: "resolution=merge-duplicates,return=representation" },
  body: JSON.stringify(articles),
});
console.log("status:", res.status);
const t = await res.text();
console.log(t.slice(0, 220));
