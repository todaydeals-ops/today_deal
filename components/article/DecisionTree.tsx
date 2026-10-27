"use client";

import { useEffect, useId, useRef, useState } from "react";
import styles from "@/app/magazine/[slug]/article.module.css";
import type { DecisionTreeData, TreeLeaf } from "@/lib/magazine/articleBody";

// 본문의 「DECISION TREE」 박스를 시안(매거진 상세 .dc.html)처럼 한 번에 질문 하나씩 풀어 가는 도우미로 그린다.
//  - 질문 1개씩 [예]/[아니요] 52px 버튼 · 지나온 답은 위에 요약 행으로 쌓임 · 결과 카드 · [처음부터]
//  - 데이터(질문 2개·결과 3개)는 서버가 원문 마크업에서 풀어 온 것이다(lib/magazine/articleBody.ts parseDecisionTree).
//
// ★글자는 전부 처음부터 HTML 에 들어 있다. 지금 보지 않는 질문·결과는 hidden 으로만 가린다(검색 로봇·읽기 전용 도구가 원문 그대로 본다).
//   스크립트가 꺼진 브라우저에서는 <noscript> 스타일이 전부 펼쳐서 보여 준다(버튼은 숨김).
// ★결과 카드의 안전(초록)·위험(주황) 색은 쓰지 않는다 — 원문에 그 구분이 없다. 흰 카드 하나로 통일한다.
// ★answer 버튼은 다음 단계로 가는 동작 버튼이지 켜짐/꺼짐이 아니라서 aria-pressed 를 달지 않는다.

type Ans = "yes" | "no";
type ResultKey = "yes1" | "yes2" | "no2";

const ANSWER_LABEL: Record<Ans, string> = { yes: "예", no: "아니요" };

function Result({
  leaf,
  active,
  ctx,
  innerRef,
}: {
  leaf: TreeLeaf;
  active: boolean;
  ctx: string; // 스크립트가 꺼졌을 때만 CSS 가 보여 주는 "어느 갈래의 결과인가" 표시
  innerRef: (el: HTMLDivElement | null) => void;
}) {
  return (
    <div hidden={!active} ref={innerRef} tabIndex={-1} role="status" className={styles.dtResult} data-ctx={ctx}>
      <span className={styles.dtResTag}>결과</span>
      <span className={styles.dtResText}>{leaf.text}</span>
      {leaf.sub && <span className={styles.dtResSub}>{leaf.sub}</span>}
    </div>
  );
}

export default function DecisionTree({ tree }: { tree: DecisionTreeData }) {
  const uid = useId();
  const [path, setPath] = useState<Ans[]>([]);
  const touched = useRef(false); // 처음 렌더에서는 포커스를 옮기지 않는다
  const q1Ref = useRef<HTMLDivElement>(null);
  const q2Ref = useRef<HTMLDivElement>(null);
  const resRefs = useRef<Partial<Record<ResultKey, HTMLDivElement | null>>>({});

  const first = path[0];
  const second = path[1];
  const asking1 = path.length === 0;
  const asking2 = first === "no" && second === undefined;
  const result: ResultKey | null = first === "yes" ? "yes1" : first === "no" && second ? (second === "yes" ? "yes2" : "no2") : null;

  // 단계가 바뀌면 포커스를 새로 나타난 덩어리로 옮긴다(눌렀던 버튼이 사라져서 포커스가 문서 맨 위로 튀지 않게)
  useEffect(() => {
    if (!touched.current) return;
    if (result) resRefs.current[result]?.focus();
    else if (asking2) q2Ref.current?.focus();
    else q1Ref.current?.focus();
  }, [result, asking2]);

  const answer = (v: Ans) => {
    if (result || path.length >= 2) return;
    touched.current = true;
    setPath((p) => [...p, v]);
  };
  const reset = () => {
    touched.current = true;
    setPath([]);
  };

  const stepLabel = result ? "결과" : `Q${path.length + 1} / 2`;
  const rows: { q: string; a: string }[] = [];
  if (first) rows.push({ q: tree.q1, a: ANSWER_LABEL[first] });
  if (second) rows.push({ q: tree.q2, a: ANSWER_LABEL[second] });

  return (
    <div className={styles.dt} role="group" aria-label={`판단 도우미 · ${tree.title}`}>
      <div className={styles.dtHead}>
        <span className={styles.dtLabel}>DECISION TREE · {stepLabel}</span>
        {path.length > 0 && (
          <button type="button" className={styles.dtReset} onClick={reset}>
            처음부터
          </button>
        )}
      </div>
      <p className={styles.dtTitle}>{tree.title}</p>

      {rows.length > 0 && (
        <ol className={styles.dtPath} aria-label="지나온 답">
          {rows.map((r, i) => (
            <li key={i}>
              <span>{r.q}</span>
              <b>{r.a}</b>
            </li>
          ))}
        </ol>
      )}

      {/* 글자 순서는 원문과 같다: Q1 → 예 결과 → Q2 → 예 결과 → 아니요 결과 */}
      <div hidden={!asking1} ref={q1Ref} tabIndex={-1} role="group" aria-labelledby={`${uid}-q1`} className={styles.dtAsk}>
        <span id={`${uid}-q1`} className={styles.dtQ}>{tree.q1}</span>
        <div className={styles.dtBtns}>
          <button type="button" className={styles.dtYes} onClick={() => answer("yes")}>예</button>
          <button type="button" className={styles.dtNo} onClick={() => answer("no")}>아니요</button>
        </div>
      </div>
      <Result leaf={tree.yes1} active={result === "yes1"} ctx="Q1 · 예" innerRef={(el) => { resRefs.current.yes1 = el; }} />

      <div hidden={!asking2} ref={q2Ref} tabIndex={-1} role="group" aria-labelledby={`${uid}-q2`} className={styles.dtAsk}>
        <span id={`${uid}-q2`} className={styles.dtQ}>{tree.q2}</span>
        <div className={styles.dtBtns}>
          <button type="button" className={styles.dtYes} onClick={() => answer("yes")}>예</button>
          <button type="button" className={styles.dtNo} onClick={() => answer("no")}>아니요</button>
        </div>
      </div>
      <Result leaf={tree.yes2} active={result === "yes2"} ctx="Q2 · 예" innerRef={(el) => { resRefs.current.yes2 = el; }} />
      <Result leaf={tree.no2} active={result === "no2"} ctx="Q2 · 아니요" innerRef={(el) => { resRefs.current.no2 = el; }} />

      <noscript>
        <style>{`.${styles.dt} [hidden]{display:flex!important}.${styles.dt} button{display:none!important}.${styles.dt} [data-ctx]::before{content:attr(data-ctx) " →";font-size:12px;opacity:.7}`}</style>
      </noscript>
    </div>
  );
}
