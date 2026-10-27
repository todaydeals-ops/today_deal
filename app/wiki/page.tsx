// 생활백과 허브 — 검색 · 종류별 목록(묶음 소제목·바로가기 칩). 전부 빌드 때 정적으로 굽는다.
// 2026-10-27 리뉴얼: 인물 색인·가나다 색인은 뺐다(사장님 결정). 검색은 표제어·다른 이름·인물 이름까지 그대로 찾는다.
// ★searchParams 를 읽지 않는다. 읽으면 동적 렌더가 되고 런타임에 content/wiki 를 읽어야 한다.
//   종류 이동은 #앵커(id = 종류 키, 묶음은 `${종류}-${묶음 id}`), 검색은 브라우저에서 한다.
import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header";
import MediaFooter from "@/components/MediaFooter";
import { allEntries, entriesByType, WIKI_BASE } from "@/lib/wiki/load";
import { WIKI_GROUPS, WIKI_TYPE_LABEL, type WikiEntry, type WikiType } from "@/lib/wiki/types";
import WikiSearch from "./WikiSearch";
import s from "./wiki-hub.module.css";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "오늘의딜 생활백과 — 사기 전에, 고치기 전에 찾아보는 정본",
  description: "세일 기간과 혜택, 세금 신고·환급·지원금 신청 일정, 영상 속 그 제품의 정체. 근거 자료를 붙여 항목별로 정리한 생활백과입니다.",
  alternates: { canonical: WIKI_BASE },
};

const ORDER: WikiType[] = ["sale", "apply", "video-pick", "ingredient", "product", "gift", "error-code"];
const BLURB: Record<WikiType, string> = {
  apply: "세금 신고·환급·지원금, 언제 어디서 신청하는지",
  "video-pick": "연예인·유튜버 영상에 나온 그 제품, 정확히 어느 회사 것인지",
  sale: "세일이 언제 하는지, 작년엔 언제였는지",
  ingredient: "영양제·화장품 성분, 무엇을 보고 고르면 되는지",
  product: "사기 전에 볼 것, 가격대, 흔한 고장",
  gift: "누구에게 얼마짜리를, 무엇을",
  "error-code": "화면에 뜬 코드가 무슨 뜻인지",
};
// 섹션 머리 위 작은 영문 라벨(Mono) — 홈의 "01 · WIKI" 식
const EYEBROW: Record<WikiType, string> = {
  sale: "SALE CALENDAR",
  apply: "APPLY & REFUND",
  "video-pick": "VIDEO PICK",
  ingredient: "INGREDIENT",
  product: "PRODUCT",
  gift: "GIFT",
  "error-code": "ERROR CODE",
};

function Card({ e }: { e: WikiEntry }) {
  return (
    <Link href={`/wiki/${e.slug}`} className={s.card}>
      <span className={s.cardTitle}>{e.title}</span>
      <span className={s.cardSub}>{e.description}</span>
    </Link>
  );
}

export default function WikiHome() {
  const all = allEntries();
  const items = all.map((e) => ({ slug: e.slug, title: e.title, seoTitle: e.seoTitle, aliases: e.aliases, people: e.people ?? [], type: WIKI_TYPE_LABEL[e.type] }));

  const sections = ORDER.map((t) => ({ t, list: entriesByType(t) })).filter((x) => x.list.length > 0);

  return (
    <div className="rn-page">
      <Header />
      <main className={`rn-wrap ${s.root}`}>
        <section className={s.hero}>
          <span className="rn-eyebrow">LIFE WIKI</span>
          <h1 className={s.h1}>생활백과</h1>
          <p className={s.lead}>사기 전에, 고치기 전에 찾아보는 정본. 항목마다 근거 자료를 붙이고, 바뀌면 고칩니다. 지금 {all.length}개 항목.</p>
          <WikiSearch items={items} />
        </section>

        <nav className={s.bar} aria-label="분야">
          <div className={s.barIn}>
            {sections.map(({ t, list }) => (
              <a key={t} href={`#${t}`} className={s.typeChip}>{WIKI_TYPE_LABEL[t]}<em>{list.length}</em></a>
            ))}
          </div>
        </nav>

        {sections.map(({ t, list }, i) => {
          // 묶음(group)이 있는 항목은 묶음별 소제목으로 나눈다. 묶음 없는 항목(영상 속 그 제품 등)은 한 덩어리.
          const grouped = WIKI_GROUPS.map((g) => ({ g, items: list.filter((e) => e.group === g.label) })).filter((x) => x.items.length);
          const ungrouped = list.filter((e) => !e.group || !WIKI_GROUPS.some((g) => g.label === e.group));
          return (
            <section key={t} id={t} className={`rn-sec ${s.sec} ${i === 0 ? s.firstSec : ""}`} aria-labelledby={`${t}-title`}>
              <div className="rn-sec-head">
                <div className="rn-sec-title">
                  <span className="rn-eyebrow">{EYEBROW[t]}</span>
                  <h2 id={`${t}-title`}>{WIKI_TYPE_LABEL[t]}</h2>
                  <p className={s.blurb}>{BLURB[t]}</p>
                </div>
                <span className={s.count}>{list.length}개</span>
              </div>
              <div className={s.secBody}>
                {grouped.length > 1 && (
                  <div className={s.jump} role="group" aria-label={`${WIKI_TYPE_LABEL[t]} 묶음`}>
                    {grouped.map(({ g, items: gi }) => (
                      <a key={g.id} href={`#${t}-${g.id}`} className={s.jumpChip}>{g.label}<em>{gi.length}</em></a>
                    ))}
                  </div>
                )}
                {grouped.map(({ g, items: gi }) => (
                  <div key={g.id} id={`${t}-${g.id}`} className={s.grp}>
                    <h3 className={s.grpHead}>{g.label}<span>{gi.length}개</span></h3>
                    <div className={s.cards}>{gi.map((e) => <Card key={e.slug} e={e} />)}</div>
                  </div>
                ))}
                {ungrouped.length > 0 && <div className={s.cards}>{ungrouped.map((e) => <Card key={e.slug} e={e} />)}</div>}
              </div>
            </section>
          );
        })}
      </main>
      <MediaFooter />
    </div>
  );
}
