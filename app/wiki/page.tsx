// 생활백과 허브 — 2026-10-27 리뉴얼(시안: 오늘의딜 생활백과.dc.html). 대분류 3 · 소분류 · 상태 필터 · 검색은 전부 클라이언트(components/wiki/hub/WikiHub).
// 인물 색인·가나다 색인은 뺐다(사장님 결정). 검색은 표제어·다른 이름·인물 이름까지 그대로 찾는다.
//
// ★searchParams 를 읽지 않는다. 읽으면 동적 렌더가 되고 런타임에 content/wiki 를 읽어야 한다.
//   필터·검색은 브라우저 상태이고, 225개 항목의 링크는 서버 렌더(초기 HTML)에 전부 나온다. 앵커(#sale · #apply-tax …)는 WikiHub 가 해석한다.
// ★상태(진행 중·예정·마감…)·D-day 는 날짜가 지나면 바뀐다. 여기서는 일정(schedule)과 "구울 때의 오늘"만 넘기고,
//   상태 계산은 WikiHub 가 브라우저의 오늘(KST)로 다시 한다(마운트 직후 보정). 그래서 정답은 항상 화면(클라이언트)이 정한다.
//   서버 HTML 의 상태·D-day 는 "마지막으로 구운 날" 기준이라, 배포가 며칠 없으면 크롤러가 보는 HTML 은 그만큼 낡는다.
// ★ISR(revalidate)로 바꾸지 않은 이유: 재생성이 런타임에 content/wiki 를 읽는데, next.config.mjs 의 outputFileTracingIncludes 에
//   "/wiki" 가 없으면 Vercel 함수에 파일이 안 실려 재생성 결과가 항목 0건이 된다. 바꾸려면 next.config.mjs 에
//   `"/wiki": ["./content/wiki/**/*"]` 를 먼저 넣고, 이 파일에 `export const revalidate = 3600;` 를 더한다.
import type { Metadata } from "next";
import Header from "@/components/Header";
import MediaFooter from "@/components/MediaFooter";
import WikiHub from "@/components/wiki/hub/WikiHub";
import { buildHub } from "@/components/wiki/hub/build";
import { WIKI_BASE } from "@/lib/wiki/load";
import { kstTodayIso } from "@/lib/wiki/status";
import s from "./wiki-hub.module.css";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "오늘의딜 생활백과 — 사기 전에, 고치기 전에 찾아보는 정본",
  description: "세일 기간과 혜택, 세금 신고·환급·지원금 신청 일정, 영상 속 그 제품의 정체. 근거 자료를 붙여 항목별로 정리한 생활백과입니다.",
  alternates: { canonical: WIKI_BASE },
};

export default function WikiHome() {
  const data = buildHub();
  return (
    <div className="rn-page">
      <Header />
      <main className={`rn-wrap ${s.root}`}>
        <WikiHub data={data} today={kstTodayIso()} />
      </main>
      <MediaFooter />
    </div>
  );
}
