// 카테고리별 리저브 부족분 — 목표 20편 기준. 인수인계·진행 점검용.
// 사용: node scripts/magazine-gap.mjs
import fs from "node:fs";
for (const l of fs.readFileSync("d:/today_deal/.env.local","utf8").split(/\r?\n/)) { const m=l.match(/^([A-Z0-9_]+)=(.*)$/); if(m) process.env[m[1]]=m[2].trim(); }
const S=process.env.NEXT_PUBLIC_SUPABASE_URL,K=process.env.SUPABASE_SERVICE_ROLE_KEY;
const r=await fetch(`${S}/rest/v1/magazine?select=slug,field,corner,is_published&limit=3000`,{headers:{apikey:K,Authorization:`Bearer ${K}`}});
const rows=await r.json();

// 택소노미 파일에서 slug -> 카테고리 매핑을 그대로 읽는다(정본이 거기다)
function loadCats(file){
  const t=fs.readFileSync(`d:/today_deal/lib/magazine/${file}.ts`,"utf8");
  const out={};
  const re=/key:\s*"([a-z0-9]+)"[\s\S]*?slugs:\s*\[([\s\S]*?)\]/g;
  let m; while((m=re.exec(t))){ for(const s of m[2].match(/"[^"]+"/g)||[]) out[s.slice(1,-1)]=m[1]; }
  return out;
}
const MAP={ "수면·침구":loadCats("sleepCategories"), "건강기능식품":loadCats("pillCategories"), "뷰티·성분":loadCats("beautyCategories") };
const B4AS=loadCats("b4asCategories");
const TARGET=20;
const tally={};
for(const a of rows){
  if(a.is_published) continue;
  if(a.corner==="report") continue;
  let brand,cat;
  if(MAP[a.field]){ brand={"수면·침구":"잠자리","건강기능식품":"알약","뷰티·성분":"성분"}[a.field]; cat=MAP[a.field][a.slug]||"(미등록)"; }
  else if(a.corner==="repair"){ brand="AS"; cat=B4AS[a.slug]||"(미등록)"; }
  else { brand="매거진"; cat=a.corner; }
  (tally[brand] ||= {}); tally[brand][cat]=(tally[brand][cat]||0)+1;
}
const ORDER={잠자리:["growth","study","work","harmony","ageless","gear"],알약:["eye","joint","vital","shield","flow","basics","care"],성분:["barrier","renew","clear","shield","hair","body"],AS:["major","mobile","kitchen","living","av","pc","wellness","service","car"],매거진:["factcheck","smartguide","trendlab"]};
let need=0, cats=0;
for(const [b,list] of Object.entries(ORDER)){
  console.log(`\n■ ${b}`);
  for(const c of list){ const have=tally[b]?.[c]||0; const gap=Math.max(0,TARGET-have); need+=gap; cats++;
    console.log(`   ${c.padEnd(10)} 보유 ${String(have).padStart(2)} / 20   ${gap?("부족 "+gap):"충족"}`); }
  const extra=Object.keys(tally[b]||{}).filter(c=>!list.includes(c));
  for(const c of extra) console.log(`   ${c.padEnd(10)} 보유 ${String(tally[b][c]).padStart(2)}   (목록 밖)`);
}
console.log(`\n카테고리 ${cats}개 · 목표 ${cats*TARGET}편 · 현재 리저브 ${rows.filter(x=>!x.is_published&&x.corner!=="report").length}편 · 추가 필요 ${need}편`);
