// 기존 AS셀프체크 28편에 검색 태그 소급 주입 (RAIL.tags)
// 모델명·에러코드는 실제 조사·집필에서 확인된 것만 사용(미확인 기종명은 넣지 않음)
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
  // ── 브랜드편 (모델·코드 확인됨) ──────────────────────────
  "samsung-aircon-selfdiagnosis": ["삼성에어컨", "무풍에어컨", "AF시리즈", "AR시리즈", "AI진단", "자가진단", "E101", "C101", "에어컨에러코드", "스마트리셋", "연식확인"],
  "lg-whisen-aircon-error": ["LG휘센", "휘센에어컨", "CH05", "CH237", "CH238", "CH53", "LG씽큐", "스마트진단", "에어컨에러코드", "실외기통신이상"],
  "samsung-washer-error-code": ["삼성세탁기", "그랑데세탁기", "4C에러", "5E에러", "UE에러", "dC에러", "Sud", "세탁기에러코드", "배수불량", "탈수불균형"],
  "lg-tromm-error-code": ["LG트롬", "트롬세탁기", "OE에러", "IE에러", "UE에러", "dE에러", "LE에러", "세탁기에러코드", "배수필터청소", "통돌이"],
  "samsung-dryer-error-code": ["삼성건조기", "그랑데AI건조기", "DV시리즈", "5C에러", "nC에러", "tC에러", "건조기에러코드", "먼지필터청소", "열교환기청소", "콘덴서청소"],
  "samsung-fridge-error": ["삼성냉장고", "비스포크냉장고", "21E", "22C", "84C", "OFOF", "매장모드", "냉장고에러코드", "냉각불량", "성에제거"],
  "cuckoo-ricecooker-reset": ["쿠쿠밥솥", "쿠쿠전기압력밥솥", "CRP시리즈", "밥솥초기화", "전원리셋", "버튼잠금", "패킹교체", "압력추청소"],
  "cuchen-ricecooker-reset": ["쿠첸밥솥", "쿠첸전기압력밥솥", "밥솥초기화", "전원리셋", "패킹교체", "증기배출구", "쿠첸고객센터"],
  "coway-purifier-selfcheck": ["코웨이정수기", "코웨이", "하트서비스", "정수기필터교체", "원수밸브", "플러싱", "E01", "누수", "코디", "렌탈정수기"],
  "galaxy-battery-drain": ["갤럭시배터리", "갤럭시", "OneUI", "배터리급방전", "배터리보호", "디바이스케어", "절전모드", "배터리성능"],
  "galaxy-force-restart-safemode": ["갤럭시강제재시작", "갤럭시", "안전모드", "공장초기화", "설정값초기화", "네트워크초기화", "갤럭시먹통"],
  "iphone-battery-health": ["아이폰배터리", "배터리성능상태", "최대용량", "배터리사이클", "성능관리", "충전한도", "아이폰배터리교체"],
  "iphone-force-restart": ["아이폰강제재시작", "아이폰", "복구모드", "DFU모드", "아이폰먹통", "홈버튼", "측면버튼"],
  // ── 범용 증상편 ─────────────────────────────────────────
  "aircon-weak-cooling-selfcheck": ["에어컨", "에어컨냉방약함", "필터청소", "실외기", "냉매부족", "에어컨자가점검", "전기요금절약"],
  "smartphone-battery-drain-selfcheck": ["스마트폰배터리", "배터리급방전", "배터리최적화", "백그라운드앱", "배터리팽창"],
  "smartphone-charging-selfcheck": ["스마트폰충전", "충전안됨", "충전단자청소", "무선충전", "충전케이블", "수분감지"],
  "smartphone-storage-slow-selfcheck": ["스마트폰저장공간", "휴대폰느려짐", "캐시삭제", "저장공간부족", "클리너앱주의"],
  "washer-drain-selfcheck": ["세탁기배수", "탈수불량", "배수필터청소", "배수호스", "세탁기자가점검"],
  "dryer-not-drying-selfcheck": ["건조기", "건조불량", "먼지필터", "콘덴서청소", "히트펌프건조기", "물통비우기"],
  "fridge-cooling-selfcheck": ["냉장고", "냉각불량", "도어패킹", "성에제거", "냉장고온도설정", "환기간격"],
  "tv-no-signal-selfcheck": ["TV신호없음", "TV화면안나옴", "입력소스", "HDMI", "셋톱박스", "TV자가점검"],
  "wifi-disconnect-selfcheck": ["와이파이끊김", "공유기재부팅", "인터넷끊김", "무선공유기", "5GHz", "채널변경"],
  "laptop-overheat-selfcheck": ["노트북발열", "팬소음", "노트북청소", "쓰로틀링", "흡배기구", "서멀구리스"],
  "printer-not-printing-selfcheck": ["프린터인쇄안됨", "프린터오프라인", "인쇄대기열", "기본프린터", "용지걸림", "프린터드라이버"],
  "water-purifier-selfcheck": ["정수기", "정수기필터교체", "물안나옴", "정수기누수", "렌탈정수기", "직수형정수기"],
  "account-login-selfcheck": ["계정복구", "비밀번호분실", "로그인안됨", "2단계인증", "계정해킹", "피싱주의"],
  "mobile-data-call-selfcheck": ["데이터안됨", "통화불가", "유심", "APN설정", "비행기모드", "통신장애"],
  "car-battery-selfcheck": ["자동차배터리방전", "점프스타트", "시동불량", "긴급출동", "배터리단자", "블랙박스방전"],
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
  const body = `<!--RAIL:${JSON.stringify(rail)}-->\n${rest}`;
  const p = await fetch(`${SB}/rest/v1/magazine?slug=eq.${slug}`, {
    method: "PATCH", headers: { ...H, "Content-Type": "application/json", Prefer: "return=minimal" },
    body: JSON.stringify({ body_html: body }),
  });
  if (p.status === 204) { ok++; console.log(`✓ ${slug.padEnd(34)} 태그 ${tags.length}개`); }
  else { miss++; console.log(`✗ ${slug} HTTP ${p.status}`); }
}
console.log(`\n태그 주입: ${ok}편 성공 / ${miss}편 실패`);
