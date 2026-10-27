// 생활백과 허브 데이터 만들기 — 서버 전용(content/wiki 를 읽는다). 클라이언트 컴포넌트에서 import 하지 않는다.
// 대분류 3개(타입 sale·apply·video-pick) × 소분류(항목의 group, WIKI_GROUPS 순서). 영상 속 그 제품은 묶음이 없어서
// 대분류 이름이 곧 소분류 이름이다(시안도 "영상 속 그 제품" 소분류 1개).
// ★옛 타입(ingredient·product·gift·error-code)은 2026-10-26 폐지됐고 현재 항목이 0건이다. 새로 생기면 이 허브에는 안 나온다(대분류 3개가 시안).
import { allEntries } from "@/lib/wiki/load";
import { scheduleOf } from "@/lib/wiki/status";
import { WIKI_GROUPS, WIKI_TYPE_LABEL, type WikiEntry } from "@/lib/wiki/types";
import { norm } from "./search";
import type { HubData, HubItem, HubSub, HubTop, TopKey } from "./types";

// 시안(오늘의딜 생활백과.dc.html)의 대분류 설명 문구 그대로
const TOPS: { key: TopKey; desc: string; img: string }[] = [
  { key: "sale", desc: "세일이 언제 하는지, 작년엔 언제였는지", img: "/renewal/wiki-cat-sale.jpg" },
  { key: "apply", desc: "세금 신고·환급·지원금, 언제 어디서 신청하는지", img: "/renewal/wiki-cat-apply.jpg" },
  { key: "video-pick", desc: "영상에 나온 그 제품, 정체와 고르는 기준", img: "/renewal/wiki-cat-video.jpg" },
];

export function buildHub(): HubData {
  const entries = allEntries();
  const tops: HubTop[] = [];
  const items: HubItem[] = [];

  for (const t of TOPS) {
    const list = entries.filter((e) => e.type === t.key);
    const labelOf = (e: WikiEntry) => (e.group && e.group.trim() ? e.group.trim() : WIKI_TYPE_LABEL[t.key]);

    // 소분류 순서: WIKI_GROUPS 순서 → 그 밖의 값(묶음 없는 항목 포함)은 등장 순
    const labels: string[] = [];
    for (const g of WIKI_GROUPS) if (list.some((e) => labelOf(e) === g.label)) labels.push(g.label);
    for (const e of list) if (!labels.includes(labelOf(e))) labels.push(labelOf(e));

    const subs: HubSub[] = labels.map((label, i) => {
      const known = WIKI_GROUPS.find((g) => g.label === label);
      return {
        key: `${t.key}:${label}`,
        label,
        id: `${t.key}-${known ? known.id : `etc${i}`}`,
        count: list.filter((e) => labelOf(e) === label).length,
      };
    });

    tops.push({ key: t.key, label: WIKI_TYPE_LABEL[t.key], desc: t.desc, img: t.img, count: list.length, subs });

    for (const e of list) {
      // 클라이언트로 넘어가는 값은 페이지 HTML 에 한 번 더 실린다 → 쓰지 않는 필드(회차 이름 label)는 빼고, 겹치는 검색어는 한 번만 싣는다.
      const sch = scheduleOf(e); // 매번 새 객체를 돌려준다
      delete sch.label;
      const seen = new Set([norm(e.title)]);
      const kw = [e.seoTitle, ...(e.aliases ?? []), ...(e.people ?? [])].filter((k): k is string => {
        const n = k ? norm(k) : "";
        if (!n || seen.has(n)) return false;
        seen.add(n);
        return true;
      });
      items.push({
        slug: e.slug,
        title: e.title,
        sum: e.description || e.summary?.[0] || "",
        top: t.key,
        g: `${t.key}:${labelOf(e)}`,
        sch,
        kw,
      });
    }
  }
  return { tops, items };
}
