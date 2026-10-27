// 생활백과 항목 검증 게이트 — content/wiki/*.json 을 커밋하기 전에 반드시 통과시킨다.
// 사용: node scripts/wiki-verify.mjs                (전체)
//       node scripts/wiki-verify.mjs <slug|파일>...   (일부)
// 하나라도 실패하면 exit 1. 통과 못 한 항목은 배포하지 않는다.
//
// ★출처 URL 은 리서치 저장소(content/research)에 실재해야 한다. 집필 에이전트는 웹 접근이 없는데
//   "확인했다"며 URL 을 지어낸 일이 있었다(magazine-srccheck 도입 계기). 유튜브 원본 영상만 예외.
import fs from "node:fs";
import path from "node:path";
import { DENY } from "./lib/source-deny.mjs";

const ROOT = path.resolve(import.meta.dirname, "..");
const DIR = path.join(ROOT, "content", "wiki");
const RES = path.join(ROOT, "content", "research");

const TYPES = ["video-pick", "sale", "ingredient", "product", "gift", "error-code", "apply"];
const KINDS = ["공식", "후기", "영상", "언론"];
// 기관 공식 도메인(.go.kr·.or.kr·.re.kr·.gov.kr + 개별 공식 사이트). 신청·환급 항목의 공식 출처 판정에 쓴다.
const OFFICIAL_HOST = /.(go|or|re).kr$|.gov.kr$|mnuri.kr$|(?:^|.)(?:gosi|adiga|ilovegohyang|k-startup).kr$|(?:^|.)applyhome.co.kr$/;
const hostOf = (u) => { try { return new URL(u).hostname; } catch { return ""; } };
// 허브 묶음 라벨 — lib/wiki/types.ts 의 WIKI_GROUPS 에서 읽는다(두 곳에 적지 않는다)
const GROUP_LABELS = [...fs.readFileSync(path.join(ROOT, "lib", "wiki", "types.ts"), "utf8").matchAll(/\{ label: "([^"]+)", id: "[a-z]+" \}/g)].map((m) => m[1]);
// 본문 최소 분량(공백 제외). 찾아보는 항목이라 매거진(2,300자)보다 짧아도 되지만 얇으면 안 된다.
const MIN_CHARS = { "video-pick": 1300, sale: 900, ingredient: 1800, product: 1800, gift: 1500, "error-code": 900, apply: 1300 };

// 부정묘사 — scripts/magazine-verify.mjs 와 같은 기준(다루는 제품은 앞으로 팔고 광고를 유치할 대상이다)
const NO = "(?:습니다|어요|다(?![고는을면]))";
const BODY_NEG = new RegExp(
  `(?:효과|효능|의미)가?\\s*없${NO}|쓸모없${NO}|소용없${NO}` +
  `|돈 낭비|과대광고|[를을]\\s*기만|기만(?:적|하)|속이고 있|마케팅에 불과|허위·?과장`, "g");
// 연예인 트랙 — 보증·광고모델 관계를 암시하는 말은 근거 없이 쓰지 않는다
const ENDORSE = /광고\s*모델|홍보\s*대사|공식\s*모델|협찬받은|모델로\s*활동/;

// 리서치 저장소의 모든 URL
const known = new Set();
const factIds = new Set();
const norm = (u) => u.trim().replace(/[).,;'"]+$/, "").replace(/\/+$/, "").replace(/^http:/, "https:");
function scan(dir) {
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) { scan(p); continue; }
    if (!/\.(json|md)$/.test(f)) continue;
    const t = fs.readFileSync(p, "utf8");
    // URL 안의 짝 맞는 괄호(S1051-2276(26)00082-8 같은 DOI)까지 살려서 뽑는다.
    for (const m of t.matchAll(/https?:\/\/(?:[^\s"'<>()\]]|\([^\s"'<>()]*\))+/g)) known.add(norm(m[0]));
    if (f.endsWith(".json")) {
      try {
        for (const x of JSON.parse(t).facts ?? []) { factIds.add(x.id); if (x.source_url) known.add(norm(x.source_url)); }
      } catch {}
    }
  }
}
scan(RES);

const text = (e) => [
  ...e.sections.flatMap((s) => [s.h, ...s.blocks.flatMap((b) => b.p ?? b.note ?? b.list ?? b.steps ?? (b.table ? [...b.table.head, ...b.table.rows.flat()] : []))]),
  ...e.faq.flatMap((f) => [f.q, f.a]),
].join(" ");

const args = process.argv.slice(2);
const files = (args.length ? args.map((a) => (a.endsWith(".json") ? a : path.join(DIR, `${a}.json`))) : fs.readdirSync(DIR).filter((f) => f.endsWith(".json") && !f.startsWith("_")).map((f) => path.join(DIR, f)));

let fail = 0;
for (const file of files) {
  const name = path.basename(file);
  let e;
  try { e = JSON.parse(fs.readFileSync(file, "utf8")); } catch (err) { console.log(`✗ ${name}  JSON 깨짐: ${err.message}`); fail++; continue; }
  const bad = [];
  const need = (cond, msg) => { if (!cond) bad.push(msg); };

  need(e.slug && name === `${e.slug}.json`, "slug 와 파일명 불일치");
  need(/^[a-z0-9-]+$/.test(e.slug || ""), "slug 는 영문 소문자·숫자·하이픈만");
  need(TYPES.includes(e.type), `type 값 오류(${e.type})`);
  // ★2026-10-26 성분 항목 폐지(사장님 "생활백과의 성분은 뷰티 성분·영양제 부분하고 중첩이니 빼도 될거 같은데").
  //   4항목 모두 같은 주제 글이 분야에 이미 있었다(같은 검색어를 두 페이지가 나눠 가짐). 성분은 영양제·뷰티 성분 분야 글로 쓴다.
  need(e.type !== "ingredient", "성분 항목은 2026-10-26 폐지 — 영양제·뷰티 성분 분야 글로 쓸 것");
  need(e.type !== "error-code", "에러코드 항목은 2026-10-26 폐지(AS 셀프체크와 중첩) — AS 셀프체크 글로 쓸 것");
  for (const k of ["title", "seoTitle", "description", "created", "updated"]) need(typeof e[k] === "string" && e[k].trim(), `${k} 없음`);
  for (const k of ["aliases", "summary", "infobox", "sections", "faq", "sources"]) need(Array.isArray(e[k]), `${k} 배열 아님`);
  if (bad.length) { console.log(`✗ ${name}  ${bad.join(" · ")}`); fail++; continue; }

  // 검색결과 제목: 앞머리(쉼표 앞)에 표제어나 다른 이름이 있어야 검색어로 걸린다
  const head = e.seoTitle.split(/[,?]/)[0];
  need([e.title, ...e.aliases].some((k) => head.includes(k)), "seoTitle 앞머리에 표제어·다른 이름이 없음");
  need(e.seoTitle.length >= 14 && e.seoTitle.length <= 60, `seoTitle 길이 ${e.seoTitle.length}(14~60)`);
  need(e.description.length >= 50 && e.description.length <= 170, `description 길이 ${e.description.length}(50~170)`);
  need(e.summary.length === 3, `summary ${e.summary.length}줄(정확히 3)`);
  need(e.faq.length >= 3, `FAQ ${e.faq.length}개(3+)`);
  need(e.infobox.length >= 3, `infobox ${e.infobox.length}칸(3+)`);
  need(e.sections.length >= 3, `섹션 ${e.sections.length}개(3+)`);
  // 영상 속 그 제품은 원본 영상 자체가 1차 근거라 "영상 1 + 공식 1" 이면 성립한다.
  // 3곳을 강제하자 집필 에이전트가 읽지도 않은 법령 URL·무관한 보도자료 목록으로 칸을 채웠다(10-18).
  // 칸 채우기용 출처는 근거가 아니라 위장이다 — 개수를 맞추느니 적게 정직하게.
  // ★신청·환급(apply)은 기관 공식(OFFICIAL_HOST) 개별 문서가 2곳 이상이면 출처 2곳으로 충분하다(2026-10-27 개정).
  //   3곳 기준 때문에 공식 근거가 탄탄한 항목이 "칸 채우기 위장" 대신 미발행으로 멈추는 일이 반복됐다(1차 집필 41개 중 7개).
  //   공식이 2곳 미만이면 기존대로 3곳 — 얇은 근거를 거르는 목적은 그대로다.
  const officialN = e.sources.filter((s) => s.kind === "공식" && OFFICIAL_HOST.test(hostOf(s.url))).length;
  // 정부·지자체 행사(sale)도 같은 기준(주최측이 기관이면 공식 개별 문서 2곳). 민간 쇼핑 행사는 .co.kr 이라 해당 없이 3곳 유지.
  const minSrc = e.type === "video-pick" ? 2 : (e.type === "apply" || e.type === "sale") && officialN >= 2 ? 2 : 3;
  need(e.sources.length >= minSrc, `출처 ${e.sources.length}곳(${minSrc}+)`);
  if (e.type === "video-pick") need(e.sources.some((s) => s.kind === "공식"), "영상 속 그 제품은 공식 출처(브랜드·제조사) 1곳 이상 필요");
  need(!e.sources.some((s) => /확인하지 못|참고용|없다는 확인|없음을 확인|미확인 근거/.test(s.label)), "읽지 않았거나 내용과 무관한 출처(라벨에 '확인하지 못함·참고용')");

  const body = text(e);
  const chars = body.replace(/\s/g, "").length;
  need(chars >= (MIN_CHARS[e.type] ?? 1500), `본문 ${chars}자(공백 제외, ${MIN_CHARS[e.type]}+)`);
  const em = (JSON.stringify(e).match(/—/g) || []).length;
  need(em === 0, `em-dash ${em}개`);
  const neg = [...new Set(body.match(BODY_NEG) || [])];
  need(!neg.length, `부정묘사(${neg.join("/")})`);
  // 조사 과정 노출 금지(10-26) — "이번 자료에서 확인하지 못했어요"는 독자에게 할 일이 아니라 우리 사정이다.
  //   명세 §7 에 있던 규칙인데 19편 중 9편이 어겼다 → 기계로 막는다. 다음 일정이 공고 전이면 "아직 발표 전이에요, 나오면 고칩니다"로 쓴다.
  const PROC = /이번 자료|조사한 (?:기사|자료)|확인하지 못(?:했|함|해)|확인되지 않았|싣지 않았|적지 않았|자료로 확인된 (?:게|것이) 없|원문은 확인하지|안내 문구는 없|밝힌 안내|확인된 자료가 없/g;
  const proc = [...new Set(body.match(PROC) || [])];
  need(!proc.length, `조사 과정 노출(${proc.join("/")}) — 독자가 할 일로 바꿀 것`);

  // 출처: 종류 값 + 리서치 저장소 실재 여부
  for (const s of e.sources) {
    need(KINDS.includes(s.kind), `출처 종류 오류(${s.kind})`);
    const u = norm(s.url || "");
    const yt = e.video && (u.includes(`v=${e.video.id}`) || u.includes(`youtu.be/${e.video.id}`));
    need(yt || known.has(u), `출처가 리서치 저장소에 없음: ${s.url}`);
    // 파는 곳은 출처가 아니다(magazine-srcaudit 와 같은 목록)
    let deny = DENY.find((d) => d.re.test(u));
    // 세일 달력은 주최사(쇼핑몰) 뉴스룸·보도자료가 일정의 1차 근거다 — 상품 페이지가 아니라 발표문이면 허용
    if (deny && e.type === "sale" && deny.why === "쇼핑몰" && /news|press|newsroom|\/ir\b|media/i.test(u)) deny = undefined;
    // asiae.co.kr 은 헬스기기 배치에서 건강 효능 주장 출처로 막은 것이다(09-01). 세일 일정(유통사 발표 보도)은 건강 주장이 아니라 허용(10-26).
    if (deny && e.type === "sale" && /asiae\.co\.kr/i.test(u)) deny = undefined;
    need(!deny, `배제 대상 출처(${deny?.why}): ${s.url}`);
    // 사이트 첫 화면은 근거가 아니다 — 개별 문서 링크여야 한다
    try {
      const pth = new URL(u).pathname;
      // 첫 화면은 근거가 아니다. 단 영상 속 그 제품의 "브랜드 공식 사이트"는 제품 정체(라인업) 확인 근거라 허용한다.
      const brandHome = e.type === "video-pick" && s.kind === "공식";
      need(yt || brandHome || (pth && pth !== "/"), `사이트 첫 화면은 출처가 아님: ${s.url}`);
      need(!/^\/journals\/[^/]+$/.test(pth), `학술지 첫 화면은 출처가 아님(논문 링크 필요): ${s.url}`);
    }
    catch { bad.push(`URL 형식 오류: ${s.url}`); }
  }
  for (const id of e.facts ?? []) need(factIds.has(id), `facts id 없음: ${id}`);

  if (e.type === "video-pick") {
    const v = e.video;
    need(v && /^[A-Za-z0-9_-]{11}$/.test(v.id || ""), "video.id 형식(11자) 오류");
    need(v && ["있음", "없음", "불명"].includes(v.paidAd), "video.paidAd 값 오류");
    need(v && v.quotes?.length >= 1 && v.quotes.every((q) => /^\d{1,2}:\d{2}(:\d{2})?$/.test(q.t) && q.text), "영상 인용은 시각(0:13)+실제 발언 1개 이상");
    need(e.people?.length >= 1, "people(등장 인물) 없음");
    need(e.sources.some((s) => s.kind === "영상"), "원본 영상 출처 없음");
    const all = JSON.stringify(e);
    need(!/\.(jpg|jpeg|png|webp|gif)\b/i.test(all), "이미지 파일 참조 금지(연예인 사진 금지 원칙)");
    need(!ENDORSE.test(body + e.seoTitle + e.description), "광고모델·협찬 관계 암시 표현");
  }
  if (e.type === "sale") {
    const s = e.sale;
    need(s && ["확정", "미발표", "상시"].includes(s.status), "sale.status 값 오류(확정|미발표|상시)"); // 상시 = 기간 없이 요일·조건으로 계속 운영(문화가 있는 날 등), start·lastYear 불필요
    need(s && s.organizer, "sale.organizer 없음");
    if (s?.status === "확정") need(s.start && s.end, "확정인데 start/end 없음");
    if (s?.status === "미발표") {
      need(s.lastYear?.start && s.lastYear?.end, "미발표면 lastYear(작년 실제 일정) 필수");
      // 미발표인데 2026 행사 날짜를 확정처럼 쓰면 안 된다.
      // 행사 달(11·12월)만 본다 — "2026년 10월 18일 확인" 같은 확인 시점까지 막으면 집필이 확인일을 지운다(10-18 오탐).
      need(!/2026[.\-년\s]*1[12][.\-월\s]*\d{1,2}/.test(e.seoTitle + e.description + e.summary.join(" ")), "미발표인데 2026 날짜를 단정");
      // 10-26 세일 달력을 1년치로 넓히며 추가 — 2027 행사(설 선물세트·프라임데이 등)도 공고 전이면 날짜를 단정하지 않는다.
      need(!/2027[.\-년\s]*\d{1,2}[.\-월\s]*\d{1,2}/.test(e.seoTitle + e.description + e.summary.join(" ")), "미발표인데 2027 날짜를 단정");
    }
  }

  // 묶음(group) — 신청·환급·세일 항목은 허브에서 묶음별로 보여 주므로 필수. 값은 lib/wiki/types.ts 의 WIKI_GROUPS label 이어야 한다.
  if (e.type === "apply" || e.type === "sale") need(GROUP_LABELS.includes(e.group), `group 값 오류(${e.group ?? "없음"}) — WIKI_GROUPS 중 하나`);

  // ★신청·환급 달력(2026-10-26 신설) — 날짜·대상을 틀리면 독자가 가산세·환급 누락으로 돈을 잃는다.
  //   그래서 ① 기관 공식 출처 ② 금전 손실 경고 상자 ③ 공고 전 회차의 날짜 단정 금지를 기계로 막는다.
  if (e.type === "apply") {
    const a = e.apply;
    need(a && a.agency && a.where && a.cycle, "apply.agency·where·cycle 필수");
    need(a?.next && ["확정", "미발표", "상시"].includes(a.next.status), "apply.next.status 값 오류(확정|미발표|상시)");
    if (a?.next?.status === "확정") need(/^\d{4}-\d{2}-\d{2}$/.test(a.next.start || "") && /^\d{4}-\d{2}-\d{2}$/.test(a.next.end || ""), "확정인데 next.start/end(YYYY-MM-DD) 없음");
    if (a?.next?.status === "미발표") {
      need((a.lastYear?.start && a.lastYear?.end) || a.basis, "공고 전이면 lastYear(직전 회차 실제 일정) 또는 basis(법정 기한 근거) 필수");
      // 공고 전인 회차(2027)의 날짜를 제목·설명·요약에서 단정하지 않는다. 법정 기한은 "매년 5월 1일~31일"처럼 연도 없이 쓴다.
      need(!/2027[.\-년\s]*\d{1,2}[.\-월\s]*\d{1,2}/.test(e.seoTitle + e.description + e.summary.join(" ")), "공고 전인데 2027 날짜를 단정");
    }
    need(officialN >= 1, "기관 공식 출처(.go.kr·.or.kr 등) 1곳 이상 필요");
    need(e.sections.some((s) => s.blocks.some((b) => b.note)), "금전 손실 경고(note 블록) 1개 이상 필요 — 기한·대상·가산세 등");
  }

  if (bad.length) { console.log(`✗ ${name}  ${bad.join(" · ")}`); fail++; }
  else console.log(`✓ ${name}  ${chars}자 · 출처 ${e.sources.length} · FAQ ${e.faq.length}`);
}
console.log(`\n${files.length - fail}/${files.length} 통과`);
if (fail) process.exit(1);
