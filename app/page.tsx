import Link from "next/link";
import Header from "@/components/Header";
import DealGrid from "@/components/DealGrid";
import LiveViewers from "@/components/LiveViewers";
import Footer from "@/components/Footer";
import PriceVerdictLegend from "@/components/PriceVerdictLegend";
import { fetchUnifiedDeals } from "@/lib/data/deals";
import { verdictRank } from "@/components/PriceVerdict";
import { BADGE_META, type Deal } from "@/lib/types";
import { fetchMagazineList, fetchMagazineCount } from "@/lib/data/magazine";
import { fetchReportList } from "@/lib/data/magazine-report";
import { isCorner, cornerOf, CATCH } from "@/lib/magazine/corners";
import { CornerIndex, NeutralBand, CornerDot, FieldPill, FeaturedImageSlot } from "@/components/magazine/Chrome";
import "./magazine/magazine.css";
import styles from "./page.module.css";

// 딜은 자주 바뀌고 신선도가 핵심 → 항상 최신 렌더(SSR).
export const dynamic = "force-dynamic";

const SITE = "https://www.todaydeals.co.kr";
const mono = "'JetBrains Mono', monospace";
const serif = "'Noto Serif KR', serif";
const fmtDate = (iso: string) => iso.slice(0, 10).replace(/-/g, ".");
const PER = 10;

function buildItemListLd(deals: Deal[]) {
  // Google 판매자 목록(merchant listing)은 image가 필수 항목이다.
  // 이미지 없는 상품을 넣고 image만 생략하면 "'image' 입력란 누락" 경고가 나므로 아예 제외한다.
  const withImage = deals.filter((d) => d.imageUrl);
  return {
    "@type": "ItemList",
    name: "오늘의 타임딜",
    description: "지마켓·쿠팡·11번가의 실시간 타임딜·골드박스를 한곳에 모았습니다. 매일 갱신.",
    numberOfItems: withImage.length,
    itemListElement: withImage.slice(0, 40).map((d, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "Product",
        name: d.productName,
        ...(d.imageUrl ? { image: d.imageUrl } : {}),
        ...(d.badge && BADGE_META[d.badge] ? { brand: { "@type": "Brand", name: BADGE_META[d.badge].label } } : {}),
        offers: {
          "@type": "Offer",
          price: d.salePrice,
          priceCurrency: "KRW",
          availability: d.isSoldout ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
          url: d.affiliateUrl ?? d.productUrl,
          ...(d.dealEndAt ? { priceValidUntil: d.dealEndAt.slice(0, 10) } : {}),
        },
      },
    })),
  };
}

function pickScore(name: string, price: number, discount: number): number {
  let s = 0;
  if (/쌀|한우|삼겹|돼지고기|소고기|닭가슴|닭갈비|족발|곱창|생선|고등어|새우|오징어|장어|회\b|과일|사과|수박|복숭아|딸기|포도|멜론|체리|망고|토마토|옥수수|고구마|감자|채소|야채|나물|김치|반찬|만두|떡볶이|핫도그|피자|치킨|라면|국수|파스타|과자|쿠키|초콜릿|아이스크림|커피|음료|주스|생수|우유|두유|요거트|치즈|버터|햄|소시지|어묵|견과|간식|즉석밥|컵밥|시리얼|소스|양념|참기름|올리브유|꿀|잼|차류/.test(name)) s += 50;
  if (/세제|샴푸|치약|칫솔|물티슈|화장지|휴지|키친타올|생리대|기저귀|섬유유연|주방세제|비누|바디워시|클렌징|선크림|마스크팩|로션|크림|틴트|쿠션|영양제|비타민|유산균|콜라겐|오메가|마그네슘|루테인|건강기능/.test(name)) s += 36;
  if (/삼성|엘지|LG|애플|다이슨|필립스|나이키|아디다스|뉴발란스|퓨마|언더아머|크록스|CJ|농심|오뚜기|풀무원|동원|청정원|삼양|롯데|해태|빙그레|코카콜라|펩시|스타벅스|네스카페|맥심|켈로그|하림|비비고|종근당|GNC|일동|광동|유한|애경|아모레|메디힐|닥터지/.test(name)) s += 24;
  if (/식탁|소파|쇼파|침대|매트리스|책상|옷장|장롱|서랍장|수납장|선반|행거|커튼|러그|조명|가구|냉장고|세탁기|건조기|에어컨|에어컨디셔너|티비|\bTV\b|모니터|의자|안마의자|러닝머신|골프|타이어/.test(name)) s -= 45;
  if (price <= 20000) s += 20; else if (price <= 50000) s += 8; else if (price > 150000) s -= 20;
  s += Math.min(discount || 0, 80) * 0.2;
  return s;
}

export default async function Home({ searchParams }: { searchParams: Promise<{ corner?: string; page?: string }> }) {
  const sp = await searchParams;
  const corner = isCorner(sp.corner) ? sp.corner : undefined;
  const page = Math.max(1, Number(sp.page) || 1);

  const [magList, total, reports, all] = await Promise.all([
    fetchMagazineList({ corner, offset: (page - 1) * PER, limit: PER }),
    fetchMagazineCount(corner),
    corner ? Promise.resolve([]) : fetchReportList(6),
    fetchUnifiedDeals(),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PER));
  const featured = page === 1 ? magList[0] : undefined;
  const rows = page === 1 ? magList.slice(1) : magList;
  const [hiPre, hiPost] = CATCH.media.tail.split(CATCH.media.hi);
  const c = corner ? cornerOf(corner) : null;

  // 오늘의 딜 15개 (제휴완료 4플랫폼 → AI 픽 + 진단 정렬)
  const pool = all.filter((d) => d.platform === "coupang" || d.platform === "gmarket" || d.platform === "11st" || d.platform === "ohou");
  const picks: typeof pool = [];
  for (const p of ["coupang", "gmarket", "11st", "ohou"] as const) {
    const top = pool
      .filter((d) => d.platform === p && !d.isSoldout && d.imageUrl)
      .sort((a, b) => pickScore(b.productName, b.salePrice, b.discountRate) - pickScore(a.productName, a.salePrice, a.discountRate))[0];
    if (top) { top.pick = true; picks.push(top); }
  }
  const pickIds = new Set(picks.map((d) => d.id));
  const restDeals = pool.filter((d) => !pickIds.has(d.id)).sort((a, b) => verdictRank(a.priceCompare, a.salePrice) - verdictRank(b.priceCompare, b.salePrice));
  const feed = [...picks, ...restDeals].slice(0, 15);

  const ld = {
    "@context": "https://schema.org",
    "@graph": [buildItemListLd(feed)],
  };

  const pageHref = (p: number) => {
    const q = new URLSearchParams();
    if (corner) q.set("corner", corner);
    if (p > 1) q.set("page", String(p));
    const s = q.toString();
    return s ? `/?${s}` : "/";
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <Header />

      <div className="mz-page">
        {/* 슬로건 + 코너 인덱스 + 리포트 — 전체보기 1페이지만 */}
        {!corner && page === 1 && (
          <>
            <section className="mz-wrap mz-slogan" style={{ paddingTop: 46, paddingBottom: 40 }}>
              <div style={{ fontFamily: mono, fontSize: 12, letterSpacing: "3px", textTransform: "uppercase", color: "#9a9286" }}>Neutral Shopping Guide</div>
              <h1 className="mz-h1" style={{ fontFamily: serif, fontWeight: 700, fontSize: "clamp(28px, 4.4vw, 44px)", lineHeight: 1.32, letterSpacing: "-1px", color: "#16140f", margin: "18px 0 0", maxWidth: 820, textWrap: "balance" }}>
                <span className="mz-h1-1">{CATCH.media.lead}</span>
                <br />
                <span className="mz-h1-2">{hiPre}<span style={{ color: "#ff5a3c" }}>{CATCH.media.hi}</span>{hiPost}</span>
              </h1>
            </section>

            <CornerIndex />

            {reports.length > 0 && (
              <section className="mz-wrap" style={{ paddingTop: 0, paddingBottom: 40 }}>
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", borderTop: "1px solid rgba(22,20,15,0.16)", paddingTop: 16, marginBottom: 14 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontFamily: mono, fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", color: "#fff", background: "#16140f", padding: "3px 9px", borderRadius: 4 }}>REPORT</span>
                    <span style={{ fontWeight: 800, fontSize: 16 }}>이슈별 큐레이션 리포트</span>
                  </div>
                  <span style={{ fontFamily: mono, fontSize: 11, letterSpacing: "1.5px", color: "#9a9286" }}>5편 묶음</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {reports.map((r) => (
                    <Link key={r.slug} href={`/magazine/report/${r.slug}`} style={{ display: "flex", alignItems: "center", gap: 14, padding: "11px 14px", border: "1px solid #e8e4dc", borderRadius: 7, textDecoration: "none", background: "#fafaf8" }}>
                      <span style={{ fontFamily: mono, fontSize: 10, color: "#9a9286", whiteSpace: "nowrap" }}>5편</span>
                      <span style={{ flex: 1, fontSize: 15, fontWeight: 700, color: "#16140f", lineHeight: 1.4, fontFamily: serif }}>{r.title}</span>
                      <span style={{ fontSize: 12, color: "#9a9286", whiteSpace: "nowrap", flexShrink: 0 }}>{r.topic}</span>
                      <span style={{ fontFamily: mono, fontSize: 14, color: "#16140f", flexShrink: 0 }}>→</span>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </>
        )}

        {/* 코너 필터 헤더 */}
        {corner && c && (
          <section className="mz-wrap" style={{ paddingTop: 36, paddingBottom: 2 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 9, fontFamily: serif, fontWeight: 700, fontSize: 24, color: "#16140f" }}>
                <span style={{ width: 11, height: 11, borderRadius: 9999, background: c.color }} />
                {c.name}
              </span>
              <span style={{ fontSize: 13.5, color: "#7a756a" }}>{c.desc}</span>
              <Link href="/" className="ul-sweep" style={{ marginLeft: "auto", fontFamily: mono, fontSize: 12, color: "#16140f", textDecoration: "none" }}>✕ 전체 보기</Link>
            </div>
          </section>
        )}

        {magList.length === 0 ? (
          <section className="mz-wrap" style={{ paddingTop: 60, paddingBottom: 80, textAlign: "center", color: "#9a9286" }}>
            <div style={{ fontFamily: serif, fontSize: 22, fontWeight: 600, color: "#46433d" }}>가이드를 준비하고 있어요.</div>
            <div style={{ fontSize: 14, marginTop: 10 }}>광고·제휴 없이, 진짜 도움 되는 글로 곧 채워집니다.</div>
          </section>
        ) : (
          <>
            {/* 피처드 (1페이지 대표 가이드) */}
            {featured && (
              <section className="mz-wrap" style={{ paddingTop: 44, paddingBottom: 30 }}>
                <Link href={`/magazine/${featured.slug}`} className="mz-feat">
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                      <CornerDot cornerKey={featured.corner} />
                      <FieldPill field={featured.field} />
                      <span style={{ fontFamily: mono, fontSize: 11, letterSpacing: "1px", color: "#9a9286" }}>FEATURED</span>
                    </div>
                    <h2 className="feat-title" style={{ fontFamily: serif, fontWeight: 700, fontSize: 40, letterSpacing: "-1.4px", lineHeight: 1.22, margin: "18px 0 0", color: "#16140f", textWrap: "balance" }}>{featured.title}</h2>
                    {featured.excerpt && <p style={{ fontSize: 15.5, lineHeight: 1.85, color: "#46433d", margin: "18px 0 0", maxWidth: 520 }}>{featured.excerpt}</p>}
                    <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 24, flexWrap: "wrap" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 8, fontWeight: 700, fontSize: 14, color: "#16140f", borderBottom: "2px solid #ff5a3c", paddingBottom: 3 }}>가이드 읽기 <span style={{ fontFamily: mono }}>→</span></span>
                      <span style={{ fontFamily: mono, fontSize: 12, color: "#9a9286" }}>편집국 · {fmtDate(featured.createdAt)}{featured.readMin ? ` · 읽기 ${featured.readMin}분` : ""}</span>
                    </div>
                  </div>
                  <FeaturedImageSlot cornerKey={featured.corner} image={featured.image} title={featured.title} />
                </Link>
              </section>
            )}

            {/* 최신 가이드 (페이지당 10) */}
            {rows.length > 0 && (
              <section className="mz-wrap" style={{ paddingTop: 14, paddingBottom: 24 }}>
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", borderTop: "1px solid rgba(22,20,15,0.16)", paddingTop: 16, marginBottom: 6 }}>
                  <span style={{ fontWeight: 800, fontSize: 18 }}>{corner ? c?.name : "최신 가이드"}</span>
                  <span style={{ fontFamily: mono, fontSize: 11, letterSpacing: "2px", color: "#9a9286" }}>LATEST</span>
                </div>
                {rows.map((a, i) => {
                  const cc = cornerOf(a.corner);
                  return (
                    <Link key={a.id} href={`/magazine/${a.slug}`} className="mz-row row-link">
                      <span className="mz-row-num" style={{ fontFamily: mono, fontSize: 13, fontWeight: 600, color: "#c0b8a9" }}>{String(i + 1).padStart(2, "0")}</span>
                      <span style={{ display: "flex", alignItems: "center", gap: 9 }}>
                        <span style={{ width: 8, height: 8, borderRadius: 9999, background: cc.color, flex: "none" }} />
                        <span style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                          <span style={{ fontFamily: mono, fontSize: 11, fontWeight: 700, color: cc.color }}>{cc.name}</span>
                          {a.field && <span style={{ fontSize: 11, color: "#8a857c" }}>{a.field}</span>}
                        </span>
                      </span>
                      <span className="mz-row-title" style={{ fontFamily: serif, fontWeight: 600, fontSize: 21, letterSpacing: "-0.6px", lineHeight: 1.35, color: "#16140f" }}>{a.title}</span>
                      <span className="mz-row-go row-go" style={{ fontFamily: mono, fontSize: 16, color: "#16140f" }}>→</span>
                    </Link>
                  );
                })}
              </section>
            )}

            {/* 페이지네이션 */}
            {totalPages > 1 && (
              <section className="mz-wrap" style={{ paddingBottom: 48 }}>
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 14, borderTop: "1px solid rgba(22,20,15,0.10)", paddingTop: 22 }}>
                  {page > 1 ? (
                    <Link href={pageHref(page - 1)} style={{ fontFamily: mono, fontSize: 13, fontWeight: 700, color: "#16140f", textDecoration: "none", padding: "8px 14px", border: "1px solid #ddd5c8", borderRadius: 8 }}>← 이전</Link>
                  ) : (
                    <span style={{ fontFamily: mono, fontSize: 13, color: "#c0b8a9", padding: "8px 14px", border: "1px solid #efe9df", borderRadius: 8 }}>← 이전</span>
                  )}
                  <span style={{ fontFamily: mono, fontSize: 13, color: "#7a756a" }}>{page} / {totalPages}</span>
                  {page < totalPages ? (
                    <Link href={pageHref(page + 1)} style={{ fontFamily: mono, fontSize: 13, fontWeight: 700, color: "#16140f", textDecoration: "none", padding: "8px 14px", border: "1px solid #ddd5c8", borderRadius: 8 }}>다음 →</Link>
                  ) : (
                    <span style={{ fontFamily: mono, fontSize: 13, color: "#c0b8a9", padding: "8px 14px", border: "1px solid #efe9df", borderRadius: 8 }}>다음 →</span>
                  )}
                </div>
              </section>
            )}
          </>
        )}

        <NeutralBand />
      </div>

      {/* 오늘의 딜 15개 (서브) */}
      <main className="wrap" style={{ paddingBottom: 60 }}>
        <div style={{ margin: "10px 0 2px" }}>
          <LiveViewers />
        </div>
        <div className={styles.sectionHead}>
          <h2 className={styles.title}>
            <span aria-hidden style={{ marginRight: 4 }}>🤖</span>
            AI가 골라낸 오늘의 특가
          </h2>
          <p className={styles.sub}>네이버·쿠팡 최저가와 비교해 매긴 AI 진단으로 정렬했어요</p>
          <PriceVerdictLegend />
        </div>
        <DealGrid deals={feed} />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10, marginTop: 14 }}>
          <p style={{ fontSize: 11, color: "#9A958C", lineHeight: 1.5, margin: 0 }}>※ AI 가격분석 추정치예요. 분석 시점·옵션·용량에 따라 실제 가격과 달라질 수 있어요.</p>
          <Link href="/deals" style={{ fontSize: 13.5, fontWeight: 700, color: "var(--accent-deal)", textDecoration: "none", whiteSpace: "nowrap" }}>오늘의 딜 전체 보기 →</Link>
        </div>
      </main>
      <Footer />
    </>
  );
}

export const metadata = {
  title: "오늘의딜 — 광고 없는 중립 쇼핑 가이드 매거진",
  description: "미디어는 늘 ‘사야 할 이유’를 말합니다. 오늘의딜은 고려해야 할 기준과 숫자를 정리해 드립니다. 팩트체크·비교·구매가이드와 실시간 특가를 한곳에.",
  alternates: { canonical: SITE },
};
