// 상품 URL → 영구 딜 슬러그 (deal_archive / 개별 딜 페이지 키). 상품당 1개.
export function dealSlug(platform: string, url: string | undefined | null): string | null {
  if (!url) return null;
  const m =
    url.match(/goodscode=(\d+)/) ||
    url.match(/\/vp\/products\/(\d+)/) ||
    url.match(/\/goods\/(\d+)/) || // 오늘의집 store.ohou.se/goods/{id}
    url.match(/\/products\/(\d+)/);
  return m?.[1] ? `${platform}-${m[1]}` : null;
}
