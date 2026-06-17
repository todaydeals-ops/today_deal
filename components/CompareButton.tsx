"use client";

import { useState } from "react";
import styles from "./CompareButton.module.css";

interface CompareButtonProps {
  productName: string;
  // 품절이면 "쿠팡에서 비슷한 상품 찾기"로 전환 (기획안 4.2)
  isSoldout?: boolean;
}

// 쿠팡 키워드 검색 URL
function coupangSearchUrl(keyword: string) {
  return `https://www.coupang.com/np/search?q=${encodeURIComponent(keyword)}`;
}

export default function CompareButton({ productName, isSoldout = false }: CompareButtonProps) {
  const label = isSoldout ? "쿠팡에서 비슷한 상품 찾기" : "최저가 비교";
  const icon = isSoldout ? "ti-search" : "ti-arrows-left-right";
  const [loading, setLoading] = useState(false);

  // 클릭 시: 빈 탭을 먼저 열고(팝업차단 회피) → 제휴 딥링크 변환 → 그 탭으로 이동.
  // 변환 실패 시 원본 검색 URL로 폴백 (수수료만 안 붙고 동작은 함).
  async function handleClick() {
    if (loading) return;
    const search = coupangSearchUrl(productName);
    const win = window.open("about:blank", "_blank");
    setLoading(true);
    try {
      const res = await fetch("/api/coupang/deeplink", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: search }),
      });
      const data = await res.json();
      const dest = data.ok && data.url ? data.url : search;
      if (win) win.location.href = dest;
      else window.location.href = dest;
    } catch {
      if (win) win.location.href = search;
    } finally {
      setLoading(false);
    }
  }

  return (
    <button className={styles.btn} onClick={handleClick} disabled={loading}>
      <i className={`ti ${loading ? "ti-loader-2" : icon}`} />
      {loading ? "여는 중…" : label}
    </button>
  );
}
