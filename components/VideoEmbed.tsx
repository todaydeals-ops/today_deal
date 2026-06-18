// 쇼츠/릴스/틱톡 URL → 임베드 iframe. 세로(9:16) 비율.
import styles from "./VideoEmbed.module.css";

// 지원: YouTube(shorts/watch/youtu.be), Instagram(reel/p), TikTok
function toEmbed(url: string): string | null {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "");

    // YouTube
    if (host === "youtube.com" || host === "m.youtube.com") {
      const shorts = u.pathname.match(/\/shorts\/([\w-]+)/);
      if (shorts) return `https://www.youtube.com/embed/${shorts[1]}`;
      const v = u.searchParams.get("v");
      if (v) return `https://www.youtube.com/embed/${v}`;
      const emb = u.pathname.match(/\/embed\/([\w-]+)/);
      if (emb) return `https://www.youtube.com/embed/${emb[1]}`;
    }
    if (host === "youtu.be") {
      const id = u.pathname.slice(1);
      if (id) return `https://www.youtube.com/embed/${id}`;
    }

    // Instagram (reel / p)
    if (host === "instagram.com") {
      const m = u.pathname.match(/\/(reel|reels|p|tv)\/([\w-]+)/);
      if (m) return `https://www.instagram.com/reel/${m[2]}/embed`;
    }

    // TikTok
    if (host.endsWith("tiktok.com")) {
      const m = u.pathname.match(/\/video\/(\d+)/);
      if (m) return `https://www.tiktok.com/embed/v2/${m[1]}`;
    }
  } catch {
    return null;
  }
  return null;
}

export default function VideoEmbed({ url }: { url: string }) {
  const src = toEmbed(url);
  if (!src) return null;
  return (
    <div className={styles.frame}>
      <iframe
        src={src}
        title="추천딜 영상"
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}
