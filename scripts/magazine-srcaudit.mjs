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
  "usp.org", "dailymed.nlm.nih.gov", "nedrug.mfds.go.kr", "mjh.or.kr", "kpanews.co.kr", "he01.tci-thaijo.org",
  // 2차 확장 — 감사 실행에서 "미확인"으로 잡힌 것 중 정식 학술지·공공기관만 확인해 편입
  "cambridge.org", "cell.com", "jaad.org", "thieme-connect.com", "ovid.com", "imrpress.com",
  "easylaw.go.kr", "fmis.kr", "synapse.koreamed.org", "e-jnh.org", "mjrheum.org",
  "lpi.oregonstate.edu", "uchealth.com", "northwell.edu", "webstore.ansi.org", "iso.org",
  "vcahospitals.com", // 반려동물 독성은 임상 수의 정보원이 실질 1차에 가깝다
  // 기기·통신 공식(AS연구소·공통 파일용)
  "samsungsvc.co.kr", "samsung.com", "lge.co.kr", "lg.com", "kt.com", "help.kt.com",
  "skbroadband.com", "bworld.co.kr", "lguplus.com", "iptime.com", "efm.co.kr",
  "tp-link.com", "asus.com", "netgear.com", "netflix.com", "help.netflix.com",
  "support.google.com", "support.apple.com", "support.microsoft.com",
  "coway.co.kr", "chungho.co.kr", "skmagic.com", "cuckoo.co.kr", "cuchen.com",
  "rinnai.co.kr", "kdnavien.co.kr", "winix.com", "dyson.co.kr", "philips.co.kr",
  "speed.nia.or.kr", "kisa.or.kr", "safetykorea.kr", "msit.go.kr",
  // 3차 확장 — 학회·정부·대학병원·정식 저널
  "health.harvard.edu", "aafp.org", "cancer.org", "jkms.org", "korea.kr", "healthychildren.org",
  "aoa.org", "auanet.org", "ccjm.org", "amjmed.com", "clinicalnutritionjournal.com",
  "clinicalnutritionespen.com", "healio.com", "medicalguidelines.msf.org", "mcgill.ca",
  "fredhutch.org", "healthcare.utah.edu", "health.gov", "hsis.org", "brightfocus.org",
  "elabp.org", "foodinfo.or.kr", "bioin.or.kr", "food-safety.com", "kati.net",
  // 4차 확장 — 2026-08-11 감사에서 "미확인"으로 잡혔으나 확인 결과 1차에 해당
  "epa.gov",              // 미국 환경보호청(실내 습도·곰팡이 기준의 원 출처)
  "merckmanuals.com",     // MSD 매뉴얼 미국판. msdmanuals.com 과 같은 문서다
  "mothertobaby.org",     // MotherToBaby(OTIS) — 기형유발물질 정보의 표준 창구
  "medlineplus.gov",      // NLM 소비자 의학정보
  "jacionline.org", "jcadonline.org", "annals.org", "ajmc.com",
  // 5차 확장 — 대학병원·정부 보건포털·대학 영양학과·정식 학술 출판사
  "snuh.org", "samsunghospital.com", "yalemedicine.org", "hopkinsmedicine.org",
  "betterhealth.vic.gov.au", "nhs.uk", "healthdirect.gov.au", "canada.ca",
  "ucdavis.edu", "nutrition.ucdavis.edu", "dovepress.com", "tandfonline.com",
  // 6차 — 대학병원 환자정보·소아 전문 비영리·의사용 임상 레퍼런스
  "nyp.org",                    // NewYork-Presbyterian(컬럼비아·코넬)
  "kidshealth.org",             // Nemours Children's Health
  "emedicine.medscape.com",     // 의사 집필 임상 레퍼런스. webmd.com 소비자 콘텐츠와 다르다
];

// 명백히 배제할 성격 — 판매·마케팅·커뮤니티
const DENY = [
  { re: /shopping|shoppinghow|coupang|11st|gmarket|smartstore|auction/i, why: "쇼핑몰" },
  { re: /namu\.wiki|namu\.moe/i, why: "나무위키" },
  { re: /blog\.naver|tistory|blogspot|medium\.com|brunch\.co\.kr/i, why: "개인 블로그" },
  { re: /betterwayhealth|seed\.com|thorne|iherb|now-?foods|swansonvitamins|vitacost|gnc\./i, why: "보충제 판매사" },
  // 영양제 보관 조사에서 tier="확실" 3건이 Nature's Way(보충제 브랜드) 한 곳에서 나왔다(2026-08-11).
  // "냉장 보관이 필요한가"를 보충제 파는 곳에 물으면 답이 한쪽으로 기운다.
  { re: /naturesway|greencirclecap|ipa-biotics|nutraceuticalsworld|vitaminshoppe|puritan/i, why: "보충제 브랜드·캡슐 제조사·업계 협회" },
  // 노화·흰머리·콜라겐 주제는 안티에이징 보충제 브랜드가 검색을 뒤덮는다(2026-08-11).
  { re: /novoslabs|moonjuice|rhonutrition|innerbalance|mitohealth|weleda|bareskincare|endocrinecenter/i, why: "안티에이징 보충제·화장품 브랜드·개인 클리닉" },
  { re: /innovareacademics|scirp\.org|omicsonline|hindawi\.com\/journals\/(?!.)/i, why: "약탈적 저널 의심" },
  // 영양사·전문가 개인 사이트도 1차 출처가 아니다. B12 결핍처럼 건강 직결 주장이
  // plantbasedrds.com/blog 같은 곳에서 온 사례가 있었다(2026-08-10).
  { re: /plantbasedrds|plantnutritionwellness|nutritionfacts\.org|precisionnutrition/i, why: "영양 전문가 개인 사이트" },
  { re: /dsm-firmenich|basf|nutraceuticalbusinessreview|nutraingredients|foodnavigator/i, why: "원료사·업계지" },
  // 주의: 제조사 공식 블로그(kingston.com/blog 등)는 §4 기준 1순위 출처다.
  // "/blog/" 경로만으로 배제하면 오탐이 쏟아진다 — 플랫폼형 블로그만 위에서 걸러낸다.
  { re: /droracle\.ai|medspot\.ai|healthline|verywell|webmd/i, why: "2차 요약·AI 생성 사이트" },
  { re: /typology|thedermaco|paulaschoice|theordinary|drmtlgy|clinikally|thekosmetics|loved01|sophim|gentleglow|halecosmeceuticals|skintypesolutions|hoiahomespa|besthairregrowth/i, why: "화장품 브랜드·판매처 자체 콘텐츠" },
  { re: /naturecan|livemomentous|apollohospitals|ubiehealth|prescriberpoint|todayspractitioner/i, why: "판매처·상업 헬스 사이트" },
  // 시술을 파는 의원·클리닉. 레이저 후 색소침착 위험 팩트 4건이 레이저 클리닉
  // 한 곳에서 나왔다(2026-08-11). 시술의 위험도를 시술 파는 곳에 묻는 셈이다.
  { re: /kins-clinic|-clinic\.com|clinic\.co\.kr|의원|피부과의원|성형외과/i, why: "시술 판매 의원·클리닉" },
  { re: /crnusa\.org|gssiweb\.org/i, why: "업계 협회(이해상충)" },
  { re: /researchgate\.net|auctoresonline|ijpsjournal|scienceinsights/i, why: "프리프린트·약탈적 저널 의심" },
  { re: /clien\.net|dcinside|ppomppu|ruliweb|cafe\.naver|todayhumor|82cook|bobaedream/i, why: "커뮤니티 게시판" },
  { re: /fastercapital|tipbox\.co\.kr|blogspot|wordpress\.com|100mb\.kr|exocctv|ajd\.co\.kr|keyzard/i, why: "콘텐츠팜·팁블로그·판매처" },
  // 시공·설비·자재 업체 — 자기 서비스를 팔려고 증상과 위험을 과장한다.
  // 2026-08-11 동파 해빙 팩트 8건 전부가 배관 시공업체(cpdrain) 하나에서 나왔다.
  // 해빙 온도·직화 금지 같은 안전 수치를 업체 글에서 가져오면 안 된다.
  { re: /cpdrain|edisonenc|powerzone\.co\.kr|lxzin|hyundailivart|kccworld|noroo|samhwa|설비|시공|철거/i, why: "시공·설비·자재 업체" },
];

const safetyRe = /간독성|독성|상호작용|금기|임신|수유|부작용|출혈|중단|과다|상한|toxicity|interaction|contraindicat|bleeding|pregnan|adverse|overdose|upper-limit/i;
const onlySafety = process.argv.includes("--safety");

// --scope=영양,뷰티 처럼 파일 접두어로 범위를 좁힌다(기본 전체)
const scopeArg = process.argv.find((a) => a.startsWith("--scope="));
const scopes = scopeArg ? scopeArg.slice(8).split(",") : null;

// ── 출처 세탁 검출 ──
// 2026-08-11 임신부 금기 팩트 7건이 전부 이 패턴이었다.
//   "source": "ACOG & AAD 공식 지침"
//   "source_url": "https://www.acne.org/..."
// 기관명을 권위 있는 곳으로 적어두고 실제로 읽은 건 소비자 사이트다.
// 도메인만 보는 검사로는 "미확인 도메인" 정도로만 잡혀 묻힌다.
// 기관을 입에 올렸으면 URL 이 그 기관이어야 한다. 아니면 그 기관 문서를 안 본 것이다.
const ORG_DOMAIN = [
  [/\bACOG\b|미국산부인과/i, ["acog.org"]],
  [/\bAAD\b|미국\s*피부과/i, ["aad.org", "jaad.org"]],
  [/\bFDA\b|미국\s*식품의약/i, ["fda.gov", "dailymed.nlm.nih.gov", "accessdata.fda.gov"]],
  [/\bWHO\b|세계보건기구/i, ["who.int"]],
  [/\bCDC\b|미국\s*질병통제/i, ["cdc.gov"]],
  [/\bEFSA\b|유럽식품안전/i, ["efsa.europa.eu"]],
  [/\bNIH\b|\bODS\b|미국\s*국립보건/i, ["nih.gov"]],
  [/\bEPA\b|미국\s*환경보호/i, ["epa.gov"]],
  // 식약처 고시·기준은 국가법령정보센터가 정본 게시처다 — 정당한 경로로 인정한다.
  [/식약처|식품의약품안전처|\bMFDS\b/i, ["mfds.go.kr", "nedrug.mfds.go.kr", "foodsafetykorea.go.kr", "law.go.kr", "fmis.kr"]],
  [/질병관리청|\bKDCA\b/i, ["kdca.go.kr"]],
  [/\bISO\b\s*\d|국제표준화/i, ["iso.org", "webstore.ansi.org"]],
  [/코크란|\bCochrane\b/i, ["cochrane.org", "cochranelibrary.com"]],
  [/메이요|\bMayo\b/i, ["mayoclinic.org", "mayoclinicproceedings.org"]],
];
/**
 * 기관명을 내세웠는데 URL 이 그 기관이 아닌 경우를 잡는다.
 *
 * 두 가지를 좁혀야 쓸 만해진다.
 * 1) claim 본문은 보지 않는다. 주장 안에 기관명이 나오는 건 정상이다(FDA가 승인한 ~).
 *    귀속을 선언하는 자리는 source·cautionSource 다.
 * 2) host 가 이미 TRUSTED 면 넘어간다. "FDA 안전통신"이라 적고 PMC 논문을 건 건
 *    귀속이 헐거운 것이지 출처가 나쁜 게 아니다. 우리가 막으려는 건
 *    "ACOG 지침"이라 적고 acne.org 를 건 경우다.
 */
function launderedBy(fact, host, trusted) {
  if (trusted) return null;
  const named = `${fact.source || ""} ${fact.cautionSource || ""}`;
  const hit = ORG_DOMAIN.filter(([re]) => re.test(named));
  if (!hit.length) return null;
  // 여러 기관을 함께 적었으면 그중 하나만 맞아도 통과다.
  if (hit.some(([, ds]) => ds.some((d) => host === d || host.endsWith("." + d)))) return null;
  return `출처 세탁 — "${(fact.source || "").slice(0, 30)}"이라 적었는데 URL은 ${host}`;
}

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
      const trusted = TRUSTED.some((t) => host === t || host.endsWith("." + t));
      const laundered = launderedBy(fact, host, trusted);
      if (laundered) { rows.push({ f, id: fact.id, tier: fact.tier, url: u, why: laundered }); continue; }
      if (!trusted) {
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

// ── 허용목록 판정(건강 버티컬 전용) ──
// DENY 목록 방식은 새 도메인이 나올 때마다 뚫린다. 실제로 리서처가 "배제 대상 0"으로
// 보고한 배치에서 suntribesunscreen·porecloggingchecker·dermalogica·boldpurity가
// 그대로 통과했다(2026-08-10). 건강·뷰티는 사람 몸에 관한 주장이라 반대로 간다.
// tier="확실"을 붙이려면 TRUSTED 도메인이어야 한다. 아니면 등급을 내리거나 재조사한다.
// 허용목록(TRUSTED 밖이면 확실 등급 불가)은 **건강 버티컬에만** 적용한다.
// 기기·통신은 정당한 출처 범위가 훨씬 넓어(제조사 수백 곳·표준화 기구) 허용목록으로
// 관리하면 노이즈가 1,600건 넘게 나온다. 그쪽은 아래 DENY(커뮤니티·콘텐츠팜)로 막는다.
const healthScoped = rows.filter((r) => /^(영양|뷰티)_/.test(r.f));
const notAllowed = healthScoped.filter((r) => r.tier === "확실");
if (notAllowed.length) {
  console.log(`
■ 건강 버티컬 허용목록 위반 ${notAllowed.length}건 — tier="확실"인데 1차 출처가 아니다`);
  for (const r of notAllowed) console.log(`  ${r.f}
      ${r.id}
      ${r.why} · ${r.url.slice(0, 80)}`);
  console.log(`
  → 1차 출처로 재확보하거나 tier를 "논쟁"·"확인실패"로 내려라.`);
  console.log(`     TRUSTED 목록에 넣을 만한 정식 학술지·공공기관이면 스크립트 상단 TRUSTED에 추가.`);
}

// 안전 관련인데 배제 대상 출처면 즉시 실패로 본다(사람이 다치는 주장이라 등급 유지 불가)
// 출처 세탁은 안전 팩트가 아니어도 등급 유지가 불가하다 — 그 문서를 안 본 것이기 때문이다.
const launder = rows.filter((r) => /출처 세탁/.test(r.why));
if (launder.length) {
  console.log(`\n★ 출처 세탁 ${launder.length}건 — 기관명과 URL 도메인이 다르다. 그 기관 문서를 실제로 읽지 않은 것이다.`);
  for (const r of launder) console.log(`  ${r.f}\n      ${r.id}\n      ${r.why}`);
}

const fatal = rows.filter((r) => safetyRe.test(r.id) && !/미확인 도메인/.test(r.why) && r.tier === "확실");
if (notAllowed.length && process.argv.includes("--strict")) process.exitCode = 1;
if (fatal.length) {
  console.log(`\n★★ 안전 관련 팩트가 배제 대상 출처로 tier="확실" — ${fatal.length}건. 재조사하거나 등급을 내려야 한다.`);
  for (const r of fatal) console.log(`  ${r.f} :: ${r.id}`);
  process.exit(1);
}
