// 생활백과 허브 — 검색 · 분야별 목록 · 인물 색인 · 가나다 색인. 전부 빌드 때 정적으로 굽는다.
// ★searchParams 를 읽지 않는다. 읽으면 동적 렌더가 되고 런타임에 content/wiki 를 읽어야 한다.
//   분야 필터는 #앵커, 검색은 브라우저에서 한다.
import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header";
import MediaFooter from "@/components/MediaFooter";
import { allEntries, entriesByType, ganadaIndex, peopleIndex, WIKI_BASE } from "@/lib/wiki/load";
import { WIKI_TYPE_LABEL, type WikiType } from "@/lib/wiki/types";
import WikiSearch from "./WikiSearch";
import "../magazine/magazine.css";
import "./wiki.css";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "오늘의딜 생활백과 — 사기 전에, 고치기 전에 찾아보는 정본",
  description: "영상 속 그 제품의 정체, 세일 기간, 성분, 에러코드까지. 근거 자료를 붙여 항목별로 정리한 생활백과입니다.",
  alternates: { canonical: WIKI_BASE },
};

const ORDER: WikiType[] = ["video-pick", "sale", "ingredient", "product", "gift", "error-code"];
const BLURB: Record<WikiType, string> = {
  "video-pick": "연예인·유튜버 영상에 나온 그 제품, 정확히 어느 회사 것인지",
  sale: "세일이 언제 하는지, 작년엔 언제였는지",
  ingredient: "영양제·화장품 성분, 무엇을 보고 고르면 되는지",
  product: "사기 전에 볼 것, 가격대, 흔한 고장",
  gift: "누구에게 얼마짜리를, 무엇을",
  "error-code": "화면에 뜬 코드가 무슨 뜻인지",
};

export default function WikiHome() {
  const all = allEntries();
  const people = peopleIndex();
  const ganada = ganadaIndex();
  const items = all.map((e) => ({ slug: e.slug, title: e.title, seoTitle: e.seoTitle, aliases: e.aliases, people: e.people ?? [], type: WIKI_TYPE_LABEL[e.type] }));

  return (
    <>
      <Header />
      <div className="mz-page">
        <div className="mz-wrap" style={{ paddingBottom: 90 }}>
          <section className="wk-hero">
            <h1>생활백과</h1>
            <p>사기 전에, 고치기 전에 찾아보는 정본. 항목마다 근거 자료를 붙이고, 바뀌면 고칩니다. 지금 {all.length}개 항목.</p>
            <WikiSearch items={items} />
            <div className="wk-ganada" aria-label="분야">
              {ORDER.filter((t) => entriesByType(t).length).map((t) => (
                <a key={t} href={`#${t}`}>{WIKI_TYPE_LABEL[t]}</a>
              ))}
              <Link href="/wiki/error-codes">가전 에러코드 사전</Link>
              {people.length > 0 && <a href="#people">인물 색인</a>}
              <a href="#ganada">가나다</a>
            </div>
          </section>

          {ORDER.map((t) => {
            const list = entriesByType(t);
            if (!list.length) return null;
            return (
              <section key={t} id={t} className="wk-sec" style={{ scrollMarginTop: 80 }}>
                <div className="wk-sec-h"><h2>{WIKI_TYPE_LABEL[t]}</h2><span>{BLURB[t]} · {list.length}개</span></div>
                <div className="wk-cards">
                  {list.map((e) => (
                    <Link key={e.slug} href={`/wiki/${e.slug}`} className="wk-card">
                      <b>{e.title}</b>
                      <span>{e.description.slice(0, 64)}{e.description.length > 64 ? "…" : ""}</span>
                    </Link>
                  ))}
                </div>
              </section>
            );
          })}

          {people.length > 0 && (
            <section id="people" className="wk-sec" style={{ scrollMarginTop: 80 }}>
              <div className="wk-sec-h"><h2>인물 색인</h2><span>영상에 나온 사람 이름으로 찾기</span></div>
              {people.map((p) => (
                <div key={p.name} className="wk-ganada-row">
                  <b style={{ fontSize: 17 }}>{p.name}</b>
                  <div>{p.entries.map((e) => <Link key={e.slug} href={`/wiki/${e.slug}`}>{e.title}</Link>)}</div>
                </div>
              ))}
            </section>
          )}

          <section id="ganada" className="wk-sec" style={{ scrollMarginTop: 80 }}>
            <div className="wk-sec-h"><h2>가나다 색인</h2><span>전체 {all.length}개</span></div>
            {ganada.map((g) => (
              <div key={g.key} className="wk-ganada-row">
                <b>{g.key}</b>
                <div>{g.entries.map((e) => <Link key={e.slug} href={`/wiki/${e.slug}`}>{e.title}</Link>)}</div>
              </div>
            ))}
          </section>
        </div>
      </div>
      <MediaFooter />
    </>
  );
}
