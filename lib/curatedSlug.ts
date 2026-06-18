// 추천딜 상품명 → URL 슬러그. 한글 키워드를 URL에 노출(한국어 SEO 유리), seq로 유니크 보장.
//   "차이슨 무선청소기" + 12 → "차이슨-무선청소기-12"
export function curatedSlug(productName: string, seq: number): string {
  const base = (productName || "")
    .toLowerCase()
    .replace(/[^가-힣a-z0-9\s-]/g, "") // 한글·영문·숫자·공백·하이픈만 남김
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40)
    .replace(/-+$/g, "");
  return base ? `${base}-${seq}` : `pick-${seq}`;
}
