import { Fragment } from "react";
import { BadgeChip, VERDICT_LEGEND } from "./PriceVerdict";

// 피드 상단 범례 — 배지 줄 + "AI 진단 기준" 표(항상 노출).
export default function PriceVerdictLegend() {
  return (
    <div style={{ marginTop: 14, marginBottom: 26 }}>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {VERDICT_LEGEND.map((it) => (
          <BadgeChip key={it.tier} tier={it.tier} />
        ))}
      </div>
      <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid #f0ede7" }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".4px", color: "#a59f95", marginBottom: 11 }}>AI 진단 기준</div>
        <div style={{ display: "grid", gridTemplateColumns: "40px 1fr", rowGap: 9, columnGap: 14, alignItems: "baseline" }}>
          {VERDICT_LEGEND.map((it) => (
            <Fragment key={it.tier}>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#2a2a2e" }}>{it.tier}</span>
              <span style={{ fontSize: 11.5, color: "#6b675f", lineHeight: 1.45 }}>{it.desc}</span>
            </Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}
