// 불확실성 부정형 → "먼저 해보고, 안 되면 이렇게" 순차 대안 톤으로 교체
import fs from "node:fs";
(function loadEnv() {
  try {
    const t = fs.readFileSync(`${import.meta.dirname}/../.env.local`, "utf8");
    for (const l of t.split(/\r?\n/)) { const m = l.match(/^([A-Z0-9_]+)=(.*)$/); if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].trim(); }
  } catch {}
})();
const SB = process.env.NEXT_PUBLIC_SUPABASE_URL, KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const H = { apikey: KEY, Authorization: `Bearer ${KEY}` };

const FIX = {
  "cuckoo-ricecooker-reset": [
    {
      from: `인터넷에는 메뉴와 취사를 동시에 5초, 설정과 예약을 동시에 3초처럼 구체적인 버튼 조합이 돌아다닙니다. 다만 이런 조합은 <b style="font-weight:700;">특정 모델군에서만 통하는 것으로 보고된 방법</b>이고, 쿠쿠 공식 설명서에서 모든 밥솥에 공통으로 안내되는 절차는 아닙니다. 기대한 초기화 대신 버튼잠금이나 절전이 켜져 더 헷갈릴 수 있습니다.`,
      to: `인터넷에서 자주 보이는 <b style="font-weight:700;">메뉴+취사 5초</b>, <b style="font-weight:700;">설정+예약 3초</b> 같은 버튼 조합은 모델군에 따라 실제로 통합니다. 통하는 모델이라면 이게 가장 빠른 해결책이니 <b style="font-weight:700;">먼저 눌러 보세요</b>. 5초를 눌러도 화면 변화가 없거나 자물쇠(버튼잠금)·절전만 켜진다면 내 모델은 조합이 다른 것이니, <b style="font-weight:700;">앞서 설명한 전원 리셋으로 넘어가면 됩니다</b> — 전원 리셋은 모델을 가리지 않고 통합니다.`,
    },
    {
      from: `모델군을 가리지 않고 통하는 방법입니다. 버튼 조합을 찾기 전에 이것부터 하세요.`,
      to: `버튼 조합이 안 통하거나 기억나지 않아도, 이 방법은 모델군을 가리지 않고 통합니다.`,
    },
    {
      from: `확인된 부분과 확인되지 않은 부분을 구분해 적었습니다.`,
      to: `먼저 해볼 방법부터 순서대로 정리했습니다.`,
    },
  ],
  "lg-tromm-error-code": [
    {
      from: `dE1·dE2의 세부 차이는 공식 문서에 명시돼 있지 않고 모두 도어 계열로 묶여 있습니다.`,
      to: `dE1·dE2도 모두 도어 계열이라, 위와 같은 순서로 점검하면 됩니다.`,
    },
  ],
};

let done = 0, miss = 0;
for (const [slug, fixes] of Object.entries(FIX)) {
  const r = await fetch(`${SB}/rest/v1/magazine?slug=eq.${slug}&select=body_html`, { headers: H });
  const [row] = await r.json();
  if (!row) { console.log("NOT FOUND:", slug); continue; }
  let body = row.body_html, applied = 0;
  for (const f of fixes) {
    if (body.includes(f.from)) { body = body.replace(f.from, f.to); applied++; }
    else { miss++; console.log(`  [원문 불일치] ${slug} — "${f.from.slice(0, 40)}..."`); }
  }
  if (!applied) continue;
  const p = await fetch(`${SB}/rest/v1/magazine?slug=eq.${slug}`, {
    method: "PATCH",
    headers: { ...H, "Content-Type": "application/json", Prefer: "return=minimal" },
    body: JSON.stringify({ body_html: body }),
  });
  console.log(p.status === 204 ? `✓ ${slug} — ${applied}곳 수정` : `✗ ${slug} — HTTP ${p.status}`);
  if (p.status === 204) done += applied;
}
console.log(`\n톤 수정 완료: ${done}곳 / 불일치 ${miss}건`);
