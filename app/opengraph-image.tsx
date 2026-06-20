// OG 공유 카드(코드로 그림). 로고 가운데·크게 + 하단 태그라인. 플랫폼 나열 없음.
import { ImageResponse } from "next/og";

export const alt = "오늘의딜 — 매일매일 새로운 타임딜을 한눈에";
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
          background: "linear-gradient(135deg, #ffffff 0%, #fdeee6 100%)",
          fontFamily: "Pretendard",
          position: "relative",
        }}
      >
        {/* 상단 오렌지 바 */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 14, background: "#ff5a3c" }} />

        {/* 로고 (가운데, 크게) */}
        <div style={{ display: "flex", alignItems: "center", gap: 30 }}>
          <div
            style={{
              width: 200,
              height: 200,
              borderRadius: 46,
              background: "#ff5a3c",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="124" height="124" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v5l3 2" />
            </svg>
          </div>
          <div style={{ display: "flex", alignItems: "flex-end" }}>
            <span style={{ fontSize: 172, color: "#1f1b16", letterSpacing: "-0.03em" }}>오늘의딜</span>
            <span style={{ fontSize: 172, color: "#ff5a3c" }}>.</span>
          </div>
        </div>

        {/* 하단 태그라인 */}
        <div style={{ position: "absolute", bottom: 70, fontSize: 46, color: "#8a8178" }}>
          매일매일 새로운 타임딜을 한눈에
        </div>
      </div>
    ),
    { ...size, fonts: [{ name: "Pretendard", data: font, weight: 700, style: "normal" }] }
  );
}
