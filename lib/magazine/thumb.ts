// 카드·썸네일용 작은 이미지 주소. 큰 원본(940px·1200px)을 작은 칸에 그대로 쓰면 로딩이 느려 빈 칸(엑박)처럼 보인다.
// - Pexels: w/h 파라미터를 줄여 요청한다(CDN 이 리사이즈)
// - 우리가 만든 대표 이미지(Supabase site-images/magazine/<slug>.jpg): 520px 이하 요청이면 같은 폴더의 <slug>-s.jpg 를 쓴다
// - 그 밖(Openverse 등)은 원본 그대로
export function thumbUrl(url: string, w = 520): string {
  try {
    const u = new URL(url);
    if (u.hostname === "images.pexels.com" && u.searchParams.has("w") && u.searchParams.has("h")) {
      u.searchParams.set("w", String(w));
      u.searchParams.set("h", String(Math.round(w * 0.654)));
      return u.toString();
    }
    const p = u.pathname;
    if (w <= 520 && u.hostname.endsWith(".supabase.co") && p.includes("/site-images/magazine/") && p.endsWith(".jpg") && !p.endsWith("-s.jpg")) {
      u.pathname = p.slice(0, -4) + "-s.jpg";
      return u.toString();
    }
  } catch {
    /* 주소가 아니면 원본 그대로 */
  }
  return url;
}
