"use client";

import { useState } from "react";
import { BadgeChip, VERDICT_LEGEND } from "./PriceVerdict";

// 피드 상단 범례 — 배지는 항상 노출, 설명은 접기(모바일 깔끔).
export default function PriceVerdictLegend() {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
        {VERDICT_LEGEND.map((it) => (
          <BadgeChip key={it.tier} tier={it.tier} />
        ))}
      </div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        style={{
          marginTop: 9, border: "none", background: "none", padding: 0,
          color: "#8A857C", fontSize: 12.5, cursor: "pointer",
          display: "inline-flex", alignItems: "center", gap: 4,
        }}
      >
        AI 진단 기준이 뭔가요?
        <span aria-hidden style={{ display: "inline-block", transform: open ? "rotate(180deg)" : "none", transition: "transform .15s" }}>⌄</span>
      </button>
      {open && (
        <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid #EFEAE1", display: "flex", flexDirection: "column", gap: 7 }}>
          {VERDICT_LEGEND.map((it) => (
            <div key={it.tier} style={{ display: "flex", gap: 10, fontSize: 12.5, lineHeight: 1.4 }}>
              <b style={{ color: "#46433D", minWidth: 44, flexShrink: 0 }}>{it.tier}</b>
              <span style={{ color: "#6F6B64" }}>{it.desc}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
