import { Fragment } from "react";
import { BadgeChip, VERDICT_LEGEND } from "./PriceVerdict";

// 피드 상단 범례 — 배지 줄 + "AI 진단 기준" 표(항상 노출).
export default function PriceVerdictLegend() {
  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {VERDICT_LEGEND.map((it) => (
          <BadgeChip key={it.tier} tier={it.tier} />
        ))}
      </div>
      <div style={{ marginTop: 18, paddingTop: 16, borderTop: "1px solid #f0ede7" }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".4px", color: "#a59f95", marginBottom: 13 }}>AI 진단 기준</div>
        <div style={{ display: "grid", gridTemplateColumns: "48px 1fr", rowGap: 13, columnGap: 16, alignItems: "baseline" }}>
          {VERDICT_LEGEND.map((it) => (
            <Fragment key={it.tier}>
              <span style={{ fontSize: 14, fontWeight: 700, color: "#2a2a2e" }}>{it.tier}</span>
              <span style={{ fontSize: 13.5, color: "#6b675f", lineHeight: 1.45 }}>{it.desc}</span>
            </Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}
