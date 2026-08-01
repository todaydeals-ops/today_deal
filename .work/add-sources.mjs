// AS셀프체크 15편 RAIL에 sources(제조사 공식 안내) 주입 — 전 URL 사전 검증(HTTP 200) 완료본
import fs from "node:fs";
(function loadEnv() {
  try {
    const t = fs.readFileSync(`${import.meta.dirname}/../.env.local`, "utf8");
    for (const l of t.split(/\r?\n/)) { const m = l.match(/^([A-Z0-9_]+)=(.*)$/); if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].trim(); }
  } catch {}
})();
const SB = process.env.NEXT_PUBLIC_SUPABASE_URL, KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const H = { apikey: KEY, Authorization: `Bearer ${KEY}` };

const SOURCES = {
  "aircon-weak-cooling-selfcheck": [
    { label: "LG전자 — 에어컨 자가점검(필터·실외기 확인)", url: "https://www.lge.co.kr/support/solutions-20153058431783" },
  ],
  "smartphone-battery-drain-selfcheck": [
    { label: "Apple — 아이폰 배터리 성능 상태 확인", url: "https://support.apple.com/en-us/101575" },
    { label: "삼성전자서비스 — 배터리가 빨리 닳을 때", url: "https://www.samsungsvc.co.kr/solution/42390" },
  ],
  "washer-drain-selfcheck": [
    { label: "삼성전자서비스 — 세탁기 배수가 안 될 때", url: "https://www.samsungsvc.co.kr/solution/110991" },
    { label: "LG전자 — 드럼세탁기 배수 안 됨(배수필터 청소)", url: "https://www.lge.co.kr/support/solutions-1780183" },
  ],
  "wifi-disconnect-selfcheck": [
    { label: "ASUS — Wi-Fi 신호가 자주 끊길 때", url: "https://www.asus.com/kr/support/faq/1030641/" },
    { label: "TP-Link — 무선 채널·채널폭 변경 방법", url: "https://www.tp-link.com/kr/support/faq/2292/" },
  ],
  "smartphone-charging-selfcheck": [
    { label: "삼성전자서비스 — 충전이 되지 않을 때", url: "https://www.samsungsvc.co.kr/solution/37809" },
    { label: "Google — Android 충전 문제 해결", url: "https://support.google.com/android/answer/7662405" },
  ],
  "account-login-selfcheck": [
    { label: "Google — 계정 복구 방법", url: "https://support.google.com/accounts/answer/7682439" },
    { label: "Apple — Apple 계정 복구", url: "https://support.apple.com/en-us/118574" },
  ],
  "fridge-cooling-selfcheck": [
    { label: "삼성전자서비스 — 냉장이 약할 때 자가점검", url: "https://www.samsungsvc.co.kr/solution/41059" },
    { label: "LG전자 — 냉장고 통풍·성에 점검", url: "https://www.lge.co.kr/support/solutions-20150310134794" },
  ],
  "smartphone-storage-slow-selfcheck": [
    { label: "Google — Android 저장용량 확보하기", url: "https://support.google.com/android/answer/7431795" },
    { label: "Samsung — 저장공간 확보 방법", url: "https://www.samsung.com/us/support/answer/ANS10002029/" },
  ],
  "dryer-not-drying-selfcheck": [
    { label: "삼성전자서비스 — 건조기 필터·열교환기 청소", url: "https://www.samsungsvc.co.kr/solution/41159" },
    { label: "LG전자 — 건조기 세탁물이 덜 말랐을 때", url: "https://www.lge.co.kr/support/solutions-20150448749964" },
  ],
  "tv-no-signal-selfcheck": [
    { label: "삼성전자서비스 — TV 화면이 나오지 않을 때", url: "https://www.samsungsvc.co.kr/solution/39238" },
    { label: "LG전자 — TV 화면·신호 문제 해결", url: "https://www.lge.co.kr/support/solutions-1777960" },
  ],
  "laptop-overheat-selfcheck": [
    { label: "ASUS — 노트북 과열·팬 소음 문제", url: "https://www.asus.com/kr/support/faq/1015064/" },
    { label: "LG전자 — 노트북 발열 점검", url: "https://www.lge.co.kr/support/solutions-20150799471967" },
  ],
  "printer-not-printing-selfcheck": [
    { label: "Microsoft — 프린터 연결·인쇄 문제 해결", url: "https://support.microsoft.com/en-us/windows/fix-printer-connection-and-printing-problems-in-windows-fb830bff-7702-6349-33cd-9443fe987f73" },
    { label: "삼성전자서비스 — 프린터 오프라인 표시 조치", url: "https://www.samsungsvc.co.kr/solution/36320" },
  ],
  "water-purifier-selfcheck": [
    { label: "LG전자 — 정수기 필터 교체주기 안내", url: "https://www.lge.co.kr/support/solutions-20150585408080" },
    { label: "삼성전자서비스 — 정수기 필터 교체", url: "https://www.samsungsvc.co.kr/solution/514700" },
  ],
  "mobile-data-call-selfcheck": [
    { label: "삼성전자서비스 — 데이터 네트워크 연결 안 됨", url: "https://www.samsungsvc.co.kr/solution/37920" },
    { label: "LG전자 — 모바일 네트워크 연결 문제", url: "https://www.lge.co.kr/support/solutions-20152672376650" },
  ],
  "car-battery-selfcheck": [
    { label: "기아 오너스매뉴얼 — 점프 스타트(케이블 연결 순서)", url: "https://ownersmanual.kia.com/docview/webhelp/Kia/16f1ac02-6c37-4173-910f-9c968f6a0540/topics/t01128.html" },
    { label: "현대 오너스매뉴얼 — 12V 배터리 점프 시동", url: "https://ownersmanual.hyundai.com/full_webhelp/NX4/2025/ko_KR/id30acfcf3cbd.html" },
  ],
};

let ok = 0, fail = 0;
for (const [slug, sources] of Object.entries(SOURCES)) {
  const r = await fetch(`${SB}/rest/v1/magazine?slug=eq.${slug}&select=body_html`, { headers: H });
  const [row] = await r.json();
  if (!row) { console.log("NOT FOUND:", slug); fail++; continue; }
  const m = row.body_html.match(/^\s*<!--RAIL:([\s\S]*?)-->\s*/);
  let rail = {}, rest = row.body_html;
  if (m) { try { rail = JSON.parse(m[1]); } catch {} rest = row.body_html.slice(m[0].length); }
  rail.sources = sources;
  const body = `<!--RAIL:${JSON.stringify(rail)}-->\n${rest}`;
  const p = await fetch(`${SB}/rest/v1/magazine?slug=eq.${slug}`, {
    method: "PATCH",
    headers: { ...H, "Content-Type": "application/json", Prefer: "return=minimal" },
    body: JSON.stringify({ body_html: body }),
  });
  if (p.status === 204) { ok++; console.log(`✓ ${slug} — 출처 ${sources.length}건`); }
  else { fail++; console.log(`✗ ${slug} — HTTP ${p.status}`); }
}
console.log(`\n출처 주입 완료: ${ok}편 성공 / ${fail}편 실패`);
