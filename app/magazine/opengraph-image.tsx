// 매거진 전용 OG 공유 카드 — 오늘의딜 매거진 로고 + 문구. (/magazine 및 하위 경로 공통)
import { ImageResponse } from "next/og";

export const alt = "오늘의딜 매거진 — 사야 할 이유 대신, 기준을 정리해 드립니다";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  const font = await fetch(
    "https://cdn.jsdelivr.net/npm/pretendard@1.3.9/dist/web/static/woff/Pretendard-Bold.woff"
  ).then((r) => r.arrayBuffer());

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#f4efe7",
          fontFamily: "Pretendard",
          position: "relative",
        }}
      >
        {/* 상단 오렌지 바 */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 14, background: "#ff5a3c" }} />

        {/* 로고: 시계 + 오늘의딜. | MAGAZINE */}
        <div style={{ display: "flex", alignItems: "center", gap: 26 }}>
          <div
            style={{
              width: 112,
              height: 112,
              borderRadius: 30,
              background: "#ff5a3c",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="68" height="68" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v5l3 2" />
            </svg>
          </div>
          <div style={{ display: "flex", alignItems: "flex-end" }}>
            <span style={{ fontSize: 96, color: "#16140f", letterSpacing: "-0.03em" }}>오늘의딜</span>
            <span style={{ fontSize: 96, color: "#ff5a3c" }}>.</span>
          </div>
          <div style={{ width: 2, height: 66, background: "#c8c0b3", margin: "0 6px" }} />
          <span style={{ fontSize: 56, color: "#16140f", letterSpacing: "0.2em", paddingBottom: 6 }}>MAGAZINE</span>
        </div>

      </div>
    ),
    { ...size, fonts: [{ name: "Pretendard", data: font, weight: 700, style: "normal" }] }
  );
}
