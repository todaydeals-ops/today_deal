"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { CuratedDeal, CuratedCategory } from "@/lib/types";
import { getActiveCurated } from "@/data/mockCurated";
import { mockGiveaways } from "@/data/mockGiveaways";
import { getResult } from "@/lib/giveawayResults";
import { getUser } from "@/lib/giveawayStore";
import {
  getHistory,
  addHistory,
  estimateRecipients,
  type SentRecord,
} from "@/lib/newsletterStore";
import styles from "./page.module.css";

interface WinnerBlock {
  prizeName: string;
  names: string[];
}

// /api/curated 행(snake_case) → CuratedDeal
interface NewsletterCuratedRow {
  id: string;
  seq: number;
  slug: string | null;
  product_name: string;
  category: CuratedCategory;
  image_url: string | null;
  affiliate_url: string;
  discount_rate: number | null;
  sale_price: number;
  admin_note: string | null;
  video_url: string | null;
  is_active: boolean;
}
function rowToDeal(r: NewsletterCuratedRow): CuratedDeal {
  return {
    id: r.id,
    seq: r.seq,
    slug: r.slug ?? undefined,
    productName: r.product_name,
    category: r.category,
    imageUrl: r.image_url ?? undefined,
    affiliateUrl: r.affiliate_url,
    discountRate: r.discount_rate ?? undefined,
    salePrice: r.sale_price,
    adminNote: r.admin_note ?? undefined,
    videoUrl: r.video_url ?? undefined,
    isActive: r.is_active,
  };
}

const DEFAULT_INTRO =
  "안녕하세요, 오늘의딜이에요! 이번 주 나눔이벤트 당첨자 발표와, 직접 골라본 꿀템 추천을 전해드려요. 알뜰한 한 주 되세요 🛒";

function formatPrice(n: number) {
  return n.toLocaleString("ko-KR");
}

export default function AdminNewsletter() {
  const [subject, setSubject] = useState("[오늘의딜] 이번 주 당첨자 발표 & 꿀템 추천");
  const [intro, setIntro] = useState(DEFAULT_INTRO);
  const [includeWinners, setIncludeWinners] = useState(true);
  const [featuredIds, setFeaturedIds] = useState<string[]>([]);

  const [deals, setDeals] = useState<CuratedDeal[]>([]);
  const [winnerBlocks, setWinnerBlocks] = useState<WinnerBlock[]>([]);
  const [recipients, setRecipients] = useState(0);
  const [history, setHistory] = useState<SentRecord[]>([]);

  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [testEmail, setTestEmail] = useState("");

  useEffect(() => {
    // 추천딜 = 실DB(/api/curated). 실패 시 mock 폴백.
    (async () => {
      let list: CuratedDeal[] = [];
      try {
        const res = await fetch("/api/curated", { cache: "no-store" });
        const data: { ok: boolean; deals?: NewsletterCuratedRow[] } = await res.json();
        if (data.ok && data.deals?.length) {
          list = data.deals.filter((r) => r.is_active).map(rowToDeal);
        }
      } catch {
        // 폴백
      }
      if (list.length === 0) list = getActiveCurated();
      const sorted = list.sort((a, b) => b.seq - a.seq);
      setDeals(sorted);
      setFeaturedIds(sorted.slice(0, 3).map((d) => d.id)); // 기본 상위 3개
    })();

    // 추첨 완료 이벤트 → 당첨자 블록
    const blocks: WinnerBlock[] = [];
    mockGiveaways.forEach((g) => {
      const r = getResult(g.id);
      if (r && r.winners.length > 0) {
        blocks.push({
          prizeName: g.prizeName,
          names: r.winners.map((w) => (w.isMe ? "나" : w.name)),
        });
      }
    });
    setWinnerBlocks(blocks);

    // 발송 대상 = 실제 회원(마케팅 동의) 수. 실패/0이면 mock 추정으로 폴백.
    (async () => {
      try {
        const res = await fetch("/api/members/stats", { cache: "no-store" });
        const data: { ok: boolean; consented?: number } = await res.json();
        if (data.ok && typeof data.consented === "number" && data.consented > 0) {
          setRecipients(data.consented);
          return;
        }
      } catch {
        // 폴백
      }
      setRecipients(estimateRecipients(getUser().marketingConsent));
    })();
    setHistory(getHistory());
  }, []);

  const featured = useMemo(
    () => deals.filter((d) => featuredIds.includes(d.id)),
    [deals, featuredIds]
  );

  function toggleFeatured(id: string) {
    setFeaturedIds((ids) =>
      ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]
    );
  }

  async function handleSend() {
    if (!subject.trim()) {
      setMessage("제목을 입력해주세요.");
      return;
    }
    if (!testEmail.trim()) {
      setMessage("실발송 테스트 수신 이메일을 입력해주세요.");
      return;
    }
    setSending(true);
    setMessage(null);
    try {
      const res = await fetch("/api/newsletter/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: testEmail.trim(),
          subject: subject.trim(),
          intro,
          winners: showWinners ? winnerBlocks : [],
          deals: featured.map((d) => ({
            title: d.productName,
            imageUrl: d.imageUrl,
            price: d.salePrice,
            discountRate: d.discountRate,
            productUrl: d.affiliateUrl,
          })),
        }),
      });
      const data = await res.json();
      if (!data.ok) {
        setMessage(`⚠ 발송 실패: ${data.error ?? "알 수 없는 오류"}`);
        return;
      }
      const rec: SentRecord = {
        id: `n${Date.now()}`,
        subject: subject.trim(),
        sent: data.sent ?? 1,
        at: new Date().toLocaleString("ko-KR"),
      };
      setHistory(addHistory(rec));
      setMessage(
        data.source === "resend"
          ? `✓ Resend로 ${testEmail.trim()} 에 실제 발송했어요. (id: ${data.id ?? "-"})`
          : `✓ ${data.message ?? "발송 시뮬레이션 완료(키 미설정)"}`
      );
    } catch {
      setMessage("⚠ 요청 실패. 잠시 후 다시 시도해주세요.");
    } finally {
      setSending(false);
    }
  }

  const showWinners = includeWinners && winnerBlocks.length > 0;

  return (
    <main className={styles.wrap}>
      <header className={styles.head}>
        <h1>위클리 뉴스레터</h1>
        <div className={styles.adminLinks}>
          <Link href="/admin/giveaway">추첨 관리</Link>
          <Link href="/admin/recommended">추천딜 관리</Link>
        </div>
      </header>

      <p className={styles.recipients}>
        <i className="ti ti-users" /> 발송 대상(마케팅 동의 회원){" "}
        <strong>{recipients.toLocaleString("ko-KR")}명</strong>
      </p>

      <div className={styles.layout}>
        {/* 작성 */}
        <section className={styles.composer}>
          <label className={styles.field}>
            <span className={styles.label}>제목</span>
            <input
              className={styles.input}
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </label>

          <label className={styles.field}>
            <span className={styles.label}>인사말</span>
            <textarea
              className={styles.textarea}
              rows={3}
              value={intro}
              onChange={(e) => setIntro(e.target.value)}
            />
          </label>

          <label className={styles.checkRow}>
            <input
              type="checkbox"
              checked={includeWinners}
              onChange={(e) => setIncludeWinners(e.target.checked)}
            />
            <span>
              당첨자 발표 포함{" "}
              {winnerBlocks.length === 0 && (
                <em className={styles.hint}>(추첨된 이벤트 없음 — /admin/giveaway에서 추첨)</em>
              )}
            </span>
          </label>

          <div className={styles.field}>
            <span className={styles.label}>추천딜 선택 (쿠팡 큐레이션)</span>
            <div className={styles.dealPick}>
              {deals.map((d) => (
                <label
                  key={d.id}
                  className={`${styles.pickItem} ${featuredIds.includes(d.id) ? styles.picked : ""}`}
                >
                  <input
                    type="checkbox"
                    checked={featuredIds.includes(d.id)}
                    onChange={() => toggleFeatured(d.id)}
                  />
                  <span className={styles.pickName}>
                    {d.productName}
                    <em>{d.category} · {formatPrice(d.salePrice)}원</em>
                  </span>
                </label>
              ))}
            </div>
          </div>

          <label className={styles.field}>
            <span className={styles.label}>실발송 테스트 수신 이메일</span>
            <input
              className={styles.input}
              type="email"
              placeholder="본인 이메일 (도메인 인증 전엔 가입 이메일만 가능)"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
            />
          </label>

          <button className={styles.sendBtn} onClick={handleSend} disabled={sending}>
            {sending ? "발송 중…" : <><i className="ti ti-send" /> 발송하기</>}
          </button>
          {message && <p className={styles.message}>{message}</p>}
          <p className={styles.sendNote}>
            지금은 입력한 <strong>테스트 이메일 1곳</strong>으로 실발송됩니다. 회원 DB·도메인 인증
            완료 후 동의 회원 전체 발송으로 전환돼요.
          </p>
        </section>

        {/* 미리보기 (이메일) */}
        <section className={styles.previewCol}>
          <span className={styles.previewLabel}>이메일 미리보기</span>
          <div className={styles.email}>
            <div className={styles.emailBrand}>오늘의딜<span className={styles.brandDot}>.</span></div>
            <h2 className={styles.emailSubject}>{subject || "(제목 없음)"}</h2>
            <p className={styles.emailIntro}>{intro}</p>

            {showWinners && (
              <div className={styles.emailSection}>
                <h3>🎉 이번 주 당첨자</h3>
                {winnerBlocks.map((b, i) => (
                  <div key={i} className={styles.winnerLine}>
                    <strong>{b.prizeName}</strong>
                    <span>{b.names.join(", ")}</span>
                  </div>
                ))}
              </div>
            )}

            <div className={styles.emailSection}>
              <h3>이번 주 꿀템 추천</h3>
              {featured.length === 0 ? (
                <p className={styles.emptyDeals}>선택된 추천딜이 없어요.</p>
              ) : (
                <div className={styles.emailDeals}>
                  {featured.map((d) => (
                    <div key={d.id} className={styles.emailDeal}>
                      <div className={styles.emailThumb}>
                        {d.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={d.imageUrl} alt="" />
                        ) : (
                          <i className="ti ti-photo" />
                        )}
                      </div>
                      <div className={styles.emailDealBody}>
                        <span className={styles.emailDealName}>{d.productName}</span>
                        <span className={styles.emailDealPrice}>
                          {typeof d.discountRate === "number" && (
                            <em>{d.discountRate}%</em>
                          )}
                          {formatPrice(d.salePrice)}원
                        </span>
                      </div>
                      <span className={styles.emailDealCta}>보러가기</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <p className={styles.emailFooter}>
              이 메일은 마케팅 수신에 동의한 회원께 발송됩니다. 수신을 원치 않으시면 수신거부.
              <br />
              이 사이트는 제휴 마케팅 활동의 일환으로 일정액의 수수료를 제공받으며, 그중 쿠팡 구매는
              쿠팡 파트너스 활동의 일환으로 수수료를 제공받습니다.
            </p>
          </div>
        </section>
      </div>

      {/* 발송 내역 */}
      {history.length > 0 && (
        <section className={styles.history}>
          <h2>발송 내역</h2>
          <ul>
            {history.map((h) => (
              <li key={h.id}>
                <span className={styles.histSubject}>{h.subject}</span>
                <span className={styles.histMeta}>
                  {h.sent.toLocaleString("ko-KR")}명 · {h.at}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
