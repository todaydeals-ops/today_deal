// 근거 저장소 출처 품질 감사 — 판매사·업계지·개인블로그가 출처로 섞였는지 본다.
//
// 계기: 정맥 클리닉 블로그 한 곳이 tier="확실" 팩트 3개의 유일한 출처였다(2026-08-10).
// 재조사로 고쳤지만, 같은 패턴이 다른 파일에도 있는지 기계로 훑어야 재발을 막는다.
// 과거 이 저장소가 나무위키로 오염돼 41건을 전량 재조사한 사고가 있었다.
//
//   node scripts/magazine-srcaudit.mjs           전체 감사
//   node scripts/magazine-srcaudit.mjs --safety  안전 관련 팩트만(간독성·상호작용·금기 등)
import fs from "node:fs";
import path from "node:path";

const FACTS = path.join(process.cwd(), "content/research/facts");

// 1순위로 인정하는 도메인 — 공공기관·1차 문헌·학회
const TRUSTED = [
  "ncbi.nlm.nih.gov", "pubmed.ncbi.nlm.nih.gov", "pmc.ncbi.nlm.nih.gov", "nih.gov", "ods.od.nih.gov",
  "cochrane.org", "cochranelibrary.com", "nejm.org", "jamanetwork.com", "thelancet.com", "bmj.com",
  "msdmanuals.com", "mayoclinic.org", "mayoclinicproceedings.org", "clevelandclinic.org",
  "who.int", "cdc.gov", "fda.gov", "efsa.europa.eu", "aad.org", "aao.org", "acog.org", "thyroid.org",
  "foodsafetykorea.go.kr", "mfds.go.kr", "kdca.go.kr", "health.kdca.go.kr", "khidi.or.kr", "amc.seoul.kr",
  "sciencedirect.com", "springer.com", "link.springer.com", "nature.com", "mdpi.com", "frontiersin.org",
  "tandfonline.com", "wiley.com", "onlinelibrary.wiley.com", "jacc.org", "ahajournals.org",
  "jrnjournal.org", "dermnetnz.org", "isappscience.org", "altmedrev.com", "plos.org", "journals.plos.org",
  // 정식 학술지·공공DB — 감사 1차 실행에서 "미확인"으로 잡혔던 것들을 확인해 편입
  "ajcn.nutrition.org", "academic.oup.com", "journals.lww.com", "karger.com", "journals.physiology.org",
  "clinicaltrials.gov", "law.go.kr", "doi.org", "atherosclerosis-journal.com", "foodandnutritionresearch.net",
  "endocrine.org", "bonehealthandosteoporosis.org", "dermatologytimes.com", "cir-safety.org",
  "dailymed.nlm.nih.gov", "nedrug.mfds.go.kr", "mjh.or.kr", "kpanews.co.kr", "he01.tci-thaijo.org",
];

// 명백히 배제할 성격 — 판매·마케팅·커뮤니티
const DENY = [
  { re: /shopping|shoppinghow|coupang|11st|gmarket|smartstore|auction/i, why: "쇼핑몰" },
  { re: /namu\.wiki|namu\.moe/i, why: "나무위키" },
  { re: /blog\.naver|tistory|blogspot|medium\.com|brunch\.co\.kr/i, why: "개인 블로그" },
  { re: /betterwayhealth|seed\.com|thorne|iherb|now-?foods|swansonvitamins|vitacost|gnc\./i, why: "보충제 판매사" },
  // 영양사·전문가 개인 사이트도 1차 출처가 아니다. B12 결핍처럼 건강 직결 주장이
  // plantbasedrds.com/blog 같은 곳에서 온 사례가 있었다(2026-08-10).
  { re: /plantbasedrds|plantnutritionwellness|nutritionfacts\.org|precisionnutrition/i, why: "영양 전문가 개인 사이트" },
  { re: /dsm-firmenich|basf|nutraceuticalbusinessreview|nutraingredients|foodnavigator/i, why: "원료사·업계지" },
  // 주의: 제조사 공식 블로그(kingston.com/blog 등)는 §4 기준 1순위 출처다.
  // "/blog/" 경로만으로 배제하면 오탐이 쏟아진다 — 플랫폼형 블로그만 위에서 걸러낸다.
  { re: /droracle\.ai|medspot\.ai|healthline|verywell|webmd/i, why: "2차 요약·AI 생성 사이트" },
  { re: /typology|thedermaco|paulaschoice|theordinary|drmtlgy|clinikally|thekosmetics|loved01|sophim|gentleglow|halecosmeceuticals|skintypesolutions|hoiahomespa|besthairregrowth/i, why: "화장품 브랜드·판매처 자체 콘텐츠" },
  { re: /naturecan|livemomentous|apollohospitals|ubiehealth|prescriberpoint|todayspractitioner/i, why: "판매처·상업 헬스 사이트" },
  { re: /crnusa\.org|gssiweb\.org/i, why: "업계 협회(이해상충)" },
  { re: /researchgate\.net|auctoresonline|ijpsjournal|scienceinsights/i, why: "프리프린트·약탈적 저널 의심" },
];

const safetyRe = /간독성|독성|상호작용|금기|임신|수유|부작용|출혈|중단|과다|상한|toxicity|interaction|contraindicat|bleeding|pregnan|adverse|overdose|upper-limit/i;
const onlySafety = process.argv.includes("--safety");

// --scope=영양,뷰티 처럼 파일 접두어로 범위를 좁힌다(기본 전체)
const scopeArg = process.argv.find((a) => a.startsWith("--scope="));
const scopes = scopeArg ? scopeArg.slice(8).split(",") : null;

const rows = [];
for (const f of fs.readdirSync(FACTS).filter((x) => x.endsWith(".json"))) {
  if (scopes && !scopes.some((s) => f.startsWith(s))) continue;
  let j;
  try { j = JSON.parse(fs.readFileSync(path.join(FACTS, f), "utf8")); } catch { console.log(`✗ JSON 깨짐: ${f}`); continue; }
  for (const fact of j.facts || []) {
    // "URL ; URL" 다중 인용을 분리해서 각각 본다
    const urls = String(fact.source_url || "").split(/\s*;\s*/).map((s) => s.trim()).filter(Boolean);
    if (!urls.length) { rows.push({ f, id: fact.id, tier: fact.tier, url: "(없음)", why: "출처 없음" }); continue; }
    for (const u of urls) {
      let host = "";
      try { host = new URL(u).hostname.replace(/^www\./, ""); } catch { rows.push({ f, id: fact.id, tier: fact.tier, url: u, why: "URL 형식 아님" }); continue; }
      const deny = DENY.find((d) => d.re.test(u));
      if (deny) { rows.push({ f, id: fact.id, tier: fact.tier, url: u, why: deny.why }); continue; }
      if (!TRUSTED.some((t) => host === t || host.endsWith("." + t))) {
        rows.push({ f, id: fact.id, tier: fact.tier, url: u, why: `미확인 도메인(${host})` });
      }
    }
  }
}

const shown = onlySafety ? rows.filter((r) => safetyRe.test(r.id)) : rows;
const deny = shown.filter((r) => !/미확인 도메인/.test(r.why));
const unknown = shown.filter((r) => /미확인 도메인/.test(r.why));

console.log(`\n■ 배제 대상 ${deny.length}건 ${onlySafety ? "(안전 관련만)" : ""}`);
for (const r of deny) console.log(`  [${r.tier}] ${r.f}\n      ${r.id}\n      ${r.why} · ${r.url.slice(0, 90)}`);

console.log(`\n■ 미확인 도메인 ${unknown.length}건 — 사람이 판단 필요`);
const byHost = {};
for (const r of unknown) { const h = r.why.match(/\((.+)\)/)[1]; (byHost[h] ||= []).push(r); }
for (const [h, list] of Object.entries(byHost).sort((a, b) => b[1].length - a[1].length)) {
  console.log(`  ${String(list.length).padStart(3)}건  ${h}`);
}

// 안전 관련인데 배제 대상 출처면 즉시 실패로 본다(사람이 다치는 주장이라 등급 유지 불가)
const fatal = rows.filter((r) => safetyRe.test(r.id) && !/미확인 도메인/.test(r.why) && r.tier === "확실");
if (fatal.length) {
  console.log(`\n★★ 안전 관련 팩트가 배제 대상 출처로 tier="확실" — ${fatal.length}건. 재조사하거나 등급을 내려야 한다.`);
  for (const r of fatal) console.log(`  ${r.f} :: ${r.id}`);
  process.exit(1);
}
