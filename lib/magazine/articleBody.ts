// 아티클 본문(bodyHtml) 변환 — 2026-10-27 홈페이지 리뉴얼(아티클 상세).
//
// ★왜 필요한가: 본문은 생성 파이프라인이 만든 HTML 문자열이고, 모든 스타일이 인라인(style="...")으로 박혀 있다.
//   577편 전수 조사 결과 태그는 p · h2 · b · span · div · br 뿐이고 <table>·<ul>·<ol>·<li> 는 0개다.
//   표는 div+grid, 단계 목록은 div+flex 로 그려진다. 인라인 스타일은 CSS 로 덮어쓰기 어려우므로,
//   서버에서 구조를 알아보고 시맨틱 마크업(<table>·<ol>·제목 래퍼)으로 바꾼 뒤 CSS 모듈이 스타일한다.
//
// ★방어 원칙: 알아보지 못한 덩어리는 건드리지 않고 그대로 돌려준다(인라인 스타일 유지). 정규식으로 통째로 바꾸지 않고
//   최상위 노드 단위로 쪼개서(깊이 계산) 구조를 확인한 뒤에만 변환한다. 변환 실패는 항상 원문 보존으로 떨어진다.
//
// 이 파일은 React·Next 에 의존하지 않는 순수 함수다(노드로 직접 돌려 전수 점검할 수 있다).

export interface TocItem {
  id: string;
  no: string; // "01", "02"…
  label: string;
}

export type BodySegment =
  | { kind: "html"; html: string }
  | { kind: "checklist"; start: number; items: string[]; anchorId: string };

export interface ParsedBody {
  segments: BodySegment[];
  toc: TocItem[]; // 본문 h2 목록(앵커 id 포함)
  checkTotal: number; // 체크 가능한 단계 총수(체크리스트가 없으면 0)
  firstCheckId: string | null; // 첫 체크리스트 그룹의 앵커 id
  stats: { h2: number; gridTables: number; gridTablesKept: number; stepLists: number; stepListsKept: number; checklists: number };
}

export interface BodyImage {
  url: string;
  credit?: string;
  source?: string;
  link?: string;
}

interface Node {
  tag: string; // 소문자 태그명, 텍스트면 "#text"
  html: string; // 원문 조각 전체
}

const VOID = new Set(["br", "img", "hr", "input", "meta", "link", "wbr"]);

/** 최상위 노드 단위로 쪼갠다(깊이 계산). 같은 태그가 중첩돼도(div 안의 div) 안전하다. */
export function splitTop(html: string): Node[] {
  const out: Node[] = [];
  const re = /<(\/?)([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>/g;
  let depth = 0;
  let start = -1;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    const close = m[1] === "/";
    const tag = m[2].toLowerCase();
    const selfClosing = VOID.has(tag) || /\/>$/.test(m[0]);
    if (depth === 0 && start < 0) {
      const gap = html.slice(last, m.index);
      if (gap.trim()) out.push({ tag: "#text", html: gap });
      start = m.index;
    }
    if (close) depth--;
    else if (!selfClosing) depth++;
    if (depth <= 0) {
      out.push({ tag, html: html.slice(start, re.lastIndex) });
      start = -1;
      depth = 0;
      last = re.lastIndex;
    }
  }
  // 닫히지 않은 꼬리 · 마지막 텍스트도 버리지 않는다(원문 보존)
  if (start >= 0) out.push({ tag: "#raw", html: html.slice(start) });
  else if (html.slice(last).trim()) out.push({ tag: "#text", html: html.slice(last) });
  return out;
}

/** 여는 태그와 닫는 태그 사이의 안쪽 HTML */
function innerOf(nodeHtml: string): string {
  const a = nodeHtml.indexOf(">");
  const b = nodeHtml.lastIndexOf("</");
  if (a < 0 || b < a) return "";
  return nodeHtml.slice(a + 1, b);
}

const stripStyle = (s: string) => s.replace(/\sstyle\s*=\s*"[^"]*"/gi, "").replace(/\sstyle\s*=\s*'[^']*'/gi, "");

function decodeEntities(s: string): string {
  return s
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n: string) => String.fromCodePoint(Number(n)))
    .replace(/&amp;/g, "&");
}

export const plainText = (html: string): string => decodeEntities(html.replace(/<[^>]*>/g, "")).replace(/\s+/g, " ").trim();
const escAttr = (s: string) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const pad2 = (n: number) => String(n).padStart(2, "0");

/** div+grid 로 그려진 표 → <table>. 구조가 기대와 다르면 null(원문 보존). */
function parseGridTable(nodeHtml: string): string | null {
  const wrap = splitTop(innerOf(nodeHtml));
  if (wrap.length !== 1 || wrap[0].tag !== "div") return null;
  const rows = splitTop(innerOf(wrap[0].html));
  if (rows.length < 2 || rows.some((r) => r.tag !== "div" || !/display:\s*grid/i.test(r.html.slice(0, r.html.indexOf(">"))))) return null;
  const cells = rows.map((r) => splitTop(innerOf(r.html)));
  const n = cells[0].length;
  if (n < 2 || cells.some((cs) => cs.length !== n || cs.some((c) => c.tag !== "div"))) return null;

  const hasHead = /background:\s*#16140f/i.test(rows[0].html.slice(0, rows[0].html.indexOf(">")));
  const headTexts = hasHead ? cells[0].map((c) => plainText(innerOf(c.html))) : [];
  const bodyRows = hasHead ? cells.slice(1) : cells;
  if (!bodyRows.length) return null;

  // 모바일에서 CSS 가 display:block 으로 풀어 스택 카드로 만들면 일부 스크린리더가 표 의미를 잃으므로 role 을 명시한다.
  let h = '<div class="td-tablewrap"><table class="td-cmp" role="table">';
  if (hasHead) {
    h += '<thead role="rowgroup"><tr role="row">' + cells[0].map((c) => `<th scope="col" role="columnheader">${stripStyle(innerOf(c.html))}</th>`).join("") + "</tr></thead>";
  }
  h += '<tbody role="rowgroup">';
  for (const cs of bodyRows) {
    h += '<tr role="row">';
    cs.forEach((c, i) => {
      const inner = stripStyle(innerOf(c.html));
      if (hasHead && i === 0) h += `<th scope="row" role="rowheader">${inner}</th>`;
      else h += `<td role="cell"${hasHead ? ` data-label="${escAttr(headTexts[i] ?? "")}"` : ""}>${inner}</td>`;
    });
    h += "</tr>";
  }
  h += "</tbody></table></div>";
  return h;
}

/**
 * 본문에 진짜 <table> 이 오는 경우(지금 DB 에는 0개 — 대비용): 스타일을 벗기고 칸마다 data-label 을 달아
 * 모바일에서 스택 카드로 풀 수 있게 한다. 병합 칸(colspan·rowspan)·중첩 표처럼 단순하지 않으면 라벨만 포기하고 원문을 둔다.
 */
function enhanceRealTable(nodeHtml: string): string {
  const plain = stripStyle(nodeHtml);
  if ((nodeHtml.match(/<table\b/gi) || []).length !== 1 || /colspan|rowspan/i.test(nodeHtml)) return plain;
  const rows = nodeHtml.match(/<tr\b[\s\S]*?<\/tr>/gi);
  if (!rows) return plain;
  const headRow = rows.find((r) => /<th\b/i.test(r));
  const labels = headRow ? [...headRow.matchAll(/<th\b[^>]*>([\s\S]*?)<\/th>/gi)].map((m) => plainText(m[1])) : [];
  if (!labels.length) return plain;
  let out = nodeHtml;
  for (const r of rows) {
    if (r === headRow) continue;
    let i = 0;
    const next = r.replace(/<(td|th)\b([^>]*)>/gi, (m: string, tag: string, attrs: string) => {
      const lab = labels[i++] ?? "";
      return tag.toLowerCase() === "td" && lab ? `<td${attrs} data-label="${escAttr(lab)}">` : m;
    });
    out = out.replace(r, () => next);
  }
  return stripStyle(out);
}

/** 번호 달린 단계 목록(div > div.flex > span 번호 + span 본문) → 단계 본문 HTML 배열. 아니면 null. */
function parseStepList(nodeHtml: string): string[] | null {
  const rows = splitTop(innerOf(nodeHtml));
  if (!rows.length) return null;
  const items: string[] = [];
  for (const r of rows) {
    if (r.tag !== "div") return null;
    const kids = splitTop(innerOf(r.html));
    if (kids.length !== 2 || kids[0].tag !== "span" || kids[1].tag !== "span") return null;
    if (!/^\d{1,2}$/.test(plainText(innerOf(kids[0].html)))) return null;
    const body = stripStyle(innerOf(kids[1].html)).trim();
    if (!body) return null;
    items.push(body);
  }
  return items;
}

/**
 * 체크리스트(체크박스·진행률)로 보여 줄 단계 목록인가 — 직전 h2 제목으로 판정한다.
 * 단계 목록 구조 자체는 100% 규칙적이지만, 목록의 성격은 제목에만 있다.
 *  - "셀프체크 순서 · …"·"충전이 안 될 때" 같은 해보는 단계 → 체크리스트
 *  - "AS를 불러야 하는 신호"·"이런 오해는 접어두세요"·"…화재로 이어집니다" 같은 판단·경고 목록 → 일반 번호 목록
 */
export function isCheckableHeading(label: string | null): boolean {
  if (!label) return false;
  // "셀프체크 순서"처럼 해보는 단계라고 제목이 말하면, 다른 단어가 섞여 있어도("견인 부르기 전 5분 셀프체크 순서") 체크리스트다.
  if (/셀프체크|체크리스트|확인할 순서|확인 순서/.test(label)) return true;
  // 판단·경고·넘김 목록: "…신호", "…불러야 하는", "…가야 하는", "이런 오해는…", "…화재로 이어집니다"
  return !/\bAS\b|신호|오해|부를 코드|불러야|부르세요|가야 (?:하|할)|넘겨야|접수|상담해야|고려해야|영역|화재|순서를 따지지|주의|예외|⚠/.test(label);
}

/** 대표 이미지 외 본문 삽입 이미지 <figure>. 스톡 사진 라이선스 표기(credit·source·link)를 반드시 싣는다. */
export function buildFigureHtml(im: BodyImage, alt: string): string {
  const credit = [im.credit, im.source].filter(Boolean).join(" · ");
  const cap = credit
    ? `<figcaption>${im.link ? `<a href="${escAttr(im.link)}" target="_blank" rel="noopener noreferrer">` : ""}사진 ${escAttr(credit)}${im.link ? "</a>" : ""}</figcaption>`
    : "";
  return `<figure class="td-fig"><div class="td-figimg"><img src="${escAttr(im.url)}" alt="${escAttr(alt)}" loading="lazy" decoding="async" onerror="var f=this.closest('figure');if(f)f.remove()" /></div>${cap}</figure>`;
}

// 본문 단락에 그대로 통과시킬 태그(스타일만 벗긴다)
const PASS_STRIP = new Set(["p", "h3", "h4", "ul", "ol", "blockquote"]);

/** 삽입 이미지 위치(노드 인덱스). 기존 규칙(소제목 사이 · 짧은 글 1장/긴 글 2장)을 그대로 따른다. */
function figureSpots(nodes: Node[], count: number): number[] {
  if (count <= 0) return [];
  const h2s = nodes.map((nd, i) => (nd.tag === "h2" ? i : -1)).filter((i) => i >= 0);
  let spots: number[];
  if (h2s.length >= 2) {
    spots =
      count === 2
        ? [h2s[Math.max(1, Math.floor(h2s.length / 5))], h2s[Math.min(h2s.length - 1, Math.floor(h2s.length * 0.7))]]
        : [h2s[Math.floor(h2s.length / 2)]];
  } else {
    const p = nodes.findIndex((nd) => nd.tag === "p");
    spots = [p >= 0 ? p + 1 : 0];
  }
  return [...new Set(spots)];
}

export interface ParseOptions {
  /** AS 셀프체크 글이면 true — 단계 목록 중 해보는 단계를 체크리스트로 만든다 */
  checklist: boolean;
  /** 본문 사이에 끼울 이미지(대표 이미지 제외). 비어 있으면 안 끼운다 */
  figures?: BodyImage[];
  figureAlt?: string;
}

export function parseArticleBody(bodyHtml: string, opts: ParseOptions): ParsedBody {
  const nodes = splitTop(bodyHtml);
  const stats = { h2: 0, gridTables: 0, gridTablesKept: 0, stepLists: 0, stepListsKept: 0, checklists: 0 };

  // 삽입 이미지: 본문 길이로 장수를 정한다(기존 규칙: 2,500자+ = 2장, 그 외 1장)
  const figs = opts.figures ?? [];
  const plainLen = bodyHtml.replace(/<[^>]+>/g, "").length;
  const want = plainLen >= 2500 ? 2 : 1;
  const use = figs.slice(0, Math.min(want, figs.length));
  const spots = figureSpots(nodes, use.length);
  const figAt = new Map<number, string>();
  spots.forEach((pos, i) => figAt.set(pos, buildFigureHtml(use[Math.min(i, use.length - 1)], opts.figureAlt ?? "")));

  const segments: BodySegment[] = [];
  const toc: TocItem[] = [];
  let buf = "";
  let lastH2: { id: string; label: string } | null = null;
  let checkTotal = 0;
  let firstCheckId: string | null = null;
  let checkGroup = 0;

  const flush = () => {
    if (buf) segments.push({ kind: "html", html: buf });
    buf = "";
  };

  nodes.forEach((nd, idx) => {
    const fig = figAt.get(idx);
    if (fig) buf += fig;

    if (nd.tag === "h2") {
      stats.h2++;
      const n = toc.length + 1;
      const id = `sec-${n}`;
      const inner = stripStyle(innerOf(nd.html));
      const label = plainText(inner);
      toc.push({ id, no: pad2(n), label });
      lastH2 = { id, label };
      buf += `<div class="td-sec"><span class="td-secno" aria-hidden="true">${pad2(n)}</span><h2 id="${id}">${inner}</h2></div>`;
      return;
    }

    if (nd.tag === "table") {
      buf += `<div class="td-tablewrap">${enhanceRealTable(nd.html)}</div>`;
      return;
    }

    if (PASS_STRIP.has(nd.tag)) {
      buf += stripStyle(nd.html);
      return;
    }

    if (nd.tag === "div") {
      // ① 표
      const table = /display:\s*grid/i.test(nd.html) ? parseGridTable(nd.html) : null;
      if (table) {
        stats.gridTables++;
        buf += table;
        return;
      }
      // ② 번호 달린 단계 목록
      const steps = parseStepList(nd.html);
      if (steps) {
        stats.stepLists++;
        const checkable = opts.checklist && isCheckableHeading(lastH2?.label ?? null);
        if (checkable) {
          flush();
          const anchorId = lastH2?.id ?? `check-${checkGroup + 1}`;
          if (!firstCheckId) firstCheckId = anchorId;
          segments.push({ kind: "checklist", start: checkTotal, items: steps, anchorId });
          checkTotal += steps.length;
          checkGroup++;
          stats.checklists++;
        } else {
          buf +=
            '<ol class="td-steps">' +
            steps.map((s, i) => `<li><span class="td-stepno" aria-hidden="true">${pad2(i + 1)}</span><span class="td-steptxt">${s}</span></li>`).join("") +
            "</ol>";
        }
        return;
      }
      // ③ 알아보지 못한 div(의사결정 트리 등) — 인라인 스타일째 보존하고 래퍼만 씌운다.
      //    표·단계 목록 모양인데 구조 확인에 실패한 것은 stats 로 센다(전수 점검용).
      const head = nd.html.slice(0, nd.html.indexOf(">"));
      if (/margin-top:\s*22px/i.test(head)) stats.gridTablesKept++;
      else if (/margin-top:\s*16px;\s*border-top/i.test(head)) stats.stepListsKept++;
      buf += `<div class="td-legacy">${nd.html}</div>`;
      return;
    }

    // 텍스트·br·code·알 수 없는 태그는 원문 그대로
    buf += nd.html;
  });
  // 삽입 위치가 노드 수를 넘는 경우(방어)
  for (const [pos, html] of figAt) if (pos >= nodes.length) buf += html;
  flush();

  return { segments, toc, checkTotal, firstCheckId, stats };
}

/** 문장 2개씩 묶어 문단으로 나눈다(통짜 문단이 답답해 보이지 않게 — 기존 callout·closing 규칙) */
export function splitSentences(text: string, per = 2): string[] {
  const parts = text.split(/(?<=[.!?])\s+/).filter(Boolean);
  const out: string[] = [];
  for (let i = 0; i < parts.length; i += per) out.push(parts.slice(i, i + per).join(" "));
  return out;
}
