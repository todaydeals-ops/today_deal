// 생활백과 「영상 속 그 제품」 원료 수집기 — 감시 채널 신규 영상 + 자막(시각 포함).
//
// 사용:
//   node scripts/video-pick.mjs scan [일수=7]        감시 채널 RSS 에서 새 영상 → data/video-candidates.json
//   node scripts/video-pick.mjs transcript <videoId>  자막을 시각과 함께 → data/transcripts/<id>.json
//
// ★키가 필요 없다. 신규 영상은 채널 RSS(youtube.com/feeds/videos.xml), 자막은 유튜브 앱(ANDROID) 플레이어
//   응답의 captionTracks 로 받는다. 웹 시청 페이지의 timedtext 는 2026-10 실측에서 0바이트였다(추가 토큰 요구).
// ★완만하게 부른다. 요청 사이 2초. 외부 서비스를 세게 두드리다 차단당한 전례가 있다.
// ★자막은 집필 근거(인용 시각 확인)로만 쓴다. 자막 전문을 페이지에 옮겨 싣지 않는다.
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const WATCH = path.join(ROOT, "data", "video-watchlist.json");
const CAND = path.join(ROOT, "data", "video-candidates.json");
const SEEN = path.join(ROOT, "data", "video-seen.json");
const TDIR = path.join(ROOT, "data", "transcripts");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const readJson = (p, d) => { try { return JSON.parse(fs.readFileSync(p, "utf8")); } catch { return d; } };
const decode = (s) => s.replace(/&amp;/g, "&").replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n));

async function scan(days = 7) {
  const w = readJson(WATCH, null);
  if (!w?.channels?.length) { console.error("data/video-watchlist.json 에 channels 가 없다"); process.exit(1); }
  const seen = new Set(readJson(SEEN, []));
  const since = Date.now() - days * 86400_000;
  const found = [];
  for (const ch of w.channels) {
    try {
      const x = await (await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${ch.channel_id}`, { headers: { "User-Agent": "Mozilla/5.0" } })).text();
      for (const e of x.split("<entry>").slice(1)) {
        const id = (e.match(/<yt:videoId>([^<]+)/) || [])[1];
        const published = (e.match(/<published>([^<]+)/) || [])[1];
        if (!id || seen.has(id) || new Date(published).getTime() < since) continue;
        found.push({
          video_id: id,
          channel: ch.name,
          channel_id: ch.channel_id,
          title: decode((e.match(/<title>([^<]+)/) || [])[1] || ""),
          published: published.slice(0, 10),
          description: decode((e.match(/<media:description>([\s\S]*?)<\/media:description>/) || [])[1] || "").slice(0, 2000),
          views: +((e.match(/views="(\d+)"/) || [])[1] || 0),
        });
      }
    } catch (err) {
      console.error(`  ✗ ${ch.name}: ${err.message}`);
    }
    await sleep(2000);
  }
  found.sort((a, b) => b.views - a.views);
  const prev = readJson(CAND, []);
  fs.writeFileSync(CAND, JSON.stringify([...found, ...prev.filter((p) => !found.some((f) => f.video_id === p.video_id))], null, 1));
  console.log(`채널 ${w.channels.length}곳 · 최근 ${days}일 새 영상 ${found.length}편 → data/video-candidates.json`);
  found.slice(0, 15).forEach((f) => console.log(`  ${String(f.views).padStart(8)}회  ${f.published}  [${f.channel}] ${f.title}`));
}

const fmtT = (sec) => {
  const s = Math.floor(sec);
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), r = s % 60;
  return h ? `${h}:${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}` : `${m}:${String(r).padStart(2, "0")}`;
};

async function transcript(id) {
  const UA = "com.google.android.youtube/20.10.38 (Linux; U; Android 11) gzip";
  const r = await fetch("https://www.youtube.com/youtubei/v1/player?prettyPrint=false", {
    method: "POST",
    headers: { "Content-Type": "application/json", "User-Agent": UA },
    body: JSON.stringify({ context: { client: { clientName: "ANDROID", clientVersion: "20.10.38", androidSdkVersion: 30, hl: "ko", gl: "KR" } }, videoId: id }),
  });
  const j = await r.json();
  const tracks = j?.captions?.playerCaptionsTracklistRenderer?.captionTracks || [];
  // 사람이 단 한국어 자막 > 자동 생성 한국어 > 없음
  const t = tracks.find((x) => x.languageCode === "ko" && x.kind !== "asr") || tracks.find((x) => x.languageCode === "ko");
  if (!t) { console.log(`${id}: 한국어 자막 없음 (트랙 ${tracks.map((x) => x.languageCode).join(",") || "0"})`); return null; }
  await sleep(1500);
  const xml = await (await fetch(t.baseUrl.replace("&fmt=srv3", ""), { headers: { "User-Agent": UA } })).text();
  const lines = [...xml.matchAll(/<text start="([\d.]+)"[^>]*>([\s\S]*?)<\/text>/g)].map((m) => ({ t: fmtT(+m[1]), text: decode(decode(m[2])).replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim() })).filter((l) => l.text);
  fs.mkdirSync(TDIR, { recursive: true });
  const out = { id, title: j?.videoDetails?.title, channel: j?.videoDetails?.author, auto: t.kind === "asr", lines };
  fs.writeFileSync(path.join(TDIR, `${id}.json`), JSON.stringify(out, null, 1));
  console.log(`${id}: ${out.auto ? "자동" : "수동"} 자막 ${lines.length}줄 → data/transcripts/${id}.json`);
  return out;
}

const [cmd, arg] = process.argv.slice(2);
if (cmd === "scan") await scan(+arg || 7);
else if (cmd === "transcript" && arg) await transcript(arg);
else console.log("사용: node scripts/video-pick.mjs scan [일수] | transcript <videoId>");
