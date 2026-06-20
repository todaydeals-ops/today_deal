// 일회용 — 매거진 첫 글 시드/갱신(음식물처리기 끝장비교). 편집국 보이스 v2 + 절제 팔레트.
const URL = process.env.SUPA_URL, KEY = process.env.SUPA_KEY;

const body_html = `
<p style="font-size:16px; color:#33312d; line-height:1.85; margin:0;">음식물 쓰레기통 옆을 지날 때마다 훅 끼치는 냄새, 여름이면 더 신경 쓰이죠. 그래서 음식물처리기를 알아보지만, 막상 검색하면 ‘미생물·건조분쇄·건조’ 방식이 뒤섞여 오히려 더 헷갈리는 편인데요. 광고는 저마다 ‘최고’라는데, 정작 <b style="font-weight:700;">3년을 쓰는 총비용</b>은 아무도 알려주지 않죠. 그래서 방식별로, 유지비까지 직접 따져봤습니다.</p>

<p style="font-size:16px; color:#33312d; line-height:1.85; margin:18px 0 0;">먼저 짚고 갈 게 있어요. ‘어떤 방식이 정답이냐’는 특정 제품이 아니라 <b style="font-weight:700;">내 상황</b>이 정하는 편이에요. 집 크기, 음식물 양, 소음에 예민한지에 따라 답이 갈리거든요. 아래 흐름부터 따라와 보세요.</p>

<div style="border:1px solid #e7e2d9; border-radius:16px; padding:24px; margin:28px 0; background:#fcfbf9;">
  <div style="display:flex; align-items:center; gap:8px; margin-bottom:18px;"><span style="font-size:11px; font-weight:700; letter-spacing:1px; color:#ff5a3c;">DECISION TREE</span><span style="font-size:13px; font-weight:700; color:#1a1a1a;">내 상황엔 어떤 방식?</span></div>
  <div style="background:#ff5a3c; color:#fff; border-radius:10px; padding:13px 16px; font-size:14px; font-weight:700;">Q1. 3~4인 이상이라 음식물이 많고, 잔여물까지 확 줄이고 싶나요?</div>
  <div style="display:grid; grid-template-columns:1fr 1fr; gap:14px; margin-top:12px;">
    <div style="display:flex; flex-direction:column; align-items:center; gap:8px;">
      <span style="font-size:11px; font-weight:700; color:#6f6b64;">YES ↓</span>
      <div style="width:100%; text-align:center; border:1.5px solid #d8d2c7; color:#1a1a1a; background:#faf8f5; border-radius:9px; padding:12px; font-size:13.5px; font-weight:700;">미생물식<br><span style="font-weight:500; font-size:11.5px; color:#76726b;">소멸형 90%+, 조용함</span></div>
    </div>
    <div style="display:flex; flex-direction:column; align-items:center; gap:8px;">
      <span style="font-size:11px; font-weight:700; color:#9a958c;">NO ↓</span>
      <div style="width:100%; background:#1a1a1a; color:#fff; border-radius:9px; padding:12px 14px; font-size:13.5px; font-weight:700;">Q2. 한 번에 빠르게(3~6시간) 끝내는 게 더 중요한가요?</div>
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; width:100%; margin-top:2px;">
        <div style="text-align:center; border:1.5px solid #d8d2c7; color:#1a1a1a; background:#faf8f5; border-radius:9px; padding:10px 6px; font-size:12px; font-weight:700;">YES<br>건조·분쇄식</div>
        <div style="text-align:center; border:1.5px solid #d8d2c7; color:#1a1a1a; background:#faf8f5; border-radius:9px; padding:10px 6px; font-size:12px; font-weight:700;">NO·유지비 최소<br>건조식</div>
      </div>
    </div>
  </div>
</div>

<h2 style="font-size:21px; font-weight:800; color:#1a1a1a; margin:34px 0 12px; letter-spacing:-0.4px;">세 방식, 원리부터 다릅니다</h2>
<p style="font-size:16px; color:#33312d; line-height:1.85; margin:0 0 16px;">세 방식은 음식물을 처리하는 원리부터 다른데요. <b style="font-weight:700;">미생물식</b>은 균이 음식물을 분해해 사실상 ‘소멸’시키는 구조예요. <b style="font-weight:700;">건조·분쇄식</b>은 고온(약 100~150℃)으로 말린 뒤 칼날로 갈아 부피를 80~95%까지 줄이고요. <b style="font-weight:700;">건조식</b>은 열풍으로 말리기만 해서, 처리는 느리지만 구조가 단순한 편입니다. 표로 한눈에 볼게요.</p>
<div style="border:1px solid #e7e2d9; border-radius:12px; overflow:hidden;">
  <div style="display:grid; grid-template-columns:0.9fr 1fr 1fr 1fr; background:#1a1a1a; color:#fff; font-size:12px; font-weight:600;"><div style="padding:11px 13px;">구분</div><div style="padding:11px 13px;">미생물</div><div style="padding:11px 13px;">건조·분쇄</div><div style="padding:11px 13px;">건조</div></div>
  <div style="display:grid; grid-template-columns:0.9fr 1fr 1fr 1fr; border-top:1px solid #efece7; font-size:12.5px;"><div style="padding:11px 13px; font-weight:700; color:#1a1a1a;">처리 원리</div><div style="padding:11px 13px; color:#46433d;">미생물 분해·소멸</div><div style="padding:11px 13px; color:#46433d;">건조 후 분쇄</div><div style="padding:11px 13px; color:#46433d;">열풍 건조</div></div>
  <div style="display:grid; grid-template-columns:0.9fr 1fr 1fr 1fr; border-top:1px solid #efece7; font-size:12.5px; background:#faf8f5;"><div style="padding:11px 13px; font-weight:700; color:#1a1a1a;">처리 시간</div><div style="padding:11px 13px; color:#46433d;">상시(24h)</div><div style="padding:11px 13px; color:#46433d;">3~6시간</div><div style="padding:11px 13px; color:#46433d;">6~20시간</div></div>
  <div style="display:grid; grid-template-columns:0.9fr 1fr 1fr 1fr; border-top:1px solid #efece7; font-size:12.5px;"><div style="padding:11px 13px; font-weight:700; color:#1a1a1a;">부피 감소</div><div style="padding:11px 13px; color:#46433d;">90%+ (소멸)</div><div style="padding:11px 13px; color:#46433d;">80~95%</div><div style="padding:11px 13px; color:#46433d;">50~70%</div></div>
  <div style="display:grid; grid-template-columns:0.9fr 1fr 1fr 1fr; border-top:1px solid #efece7; font-size:12.5px; background:#faf8f5;"><div style="padding:11px 13px; font-weight:700; color:#1a1a1a;">소음</div><div style="padding:11px 13px; color:#46433d;">낮음</div><div style="padding:11px 13px; color:#46433d;">중간</div><div style="padding:11px 13px; color:#46433d;">낮음</div></div>
  <div style="display:grid; grid-template-columns:0.9fr 1fr 1fr 1fr; border-top:1px solid #efece7; font-size:12.5px;"><div style="padding:11px 13px; font-weight:700; color:#1a1a1a;">소모품</div><div style="padding:11px 13px; color:#46433d;">미생물제</div><div style="padding:11px 13px; color:#46433d;">칼날·필터</div><div style="padding:11px 13px; color:#46433d;">탈취 필터</div></div>
</div>
<p style="font-size:16px; color:#33312d; line-height:1.85; margin:16px 0 0;">수치만 봐도 강점이 갈리는 게 보이죠. 미생물식은 조용하고 잔여물이 적은 대신 처리가 상시 돌아가고, 건조·분쇄식은 3~6시간이면 끝나지만 소음이 조금 있는 편이에요.</p>

<h2 style="font-size:21px; font-weight:800; color:#1a1a1a; margin:34px 0 6px; letter-spacing:-0.4px;">광고가 안 알려주는 ‘3년 유지비’</h2>
<p style="font-size:13px; color:#8a857c; margin:0 0 16px;">제조사 공개 스펙(소비전력·소모품 교체주기) 기준 <b style="font-weight:700; color:#6f6b64;">추정치</b> · 실사용 환경에 따라 달라집니다.</p>
<div style="border:1px solid #e7e2d9; border-radius:12px; padding:20px 22px; display:flex; flex-direction:column; gap:18px;">
  <div>
    <div style="display:flex; justify-content:space-between; align-items:baseline; margin-bottom:7px;"><span style="font-size:13.5px; font-weight:700; color:#1a1a1a;">미생물</span><span style="font-size:13px; font-weight:700; color:#1a1a1a;">약 16만원</span></div>
    <div style="display:flex; height:22px; border-radius:5px; overflow:hidden; background:#f1ede6;"><div style="width:31%; background:#1a1a1a;"></div><div style="width:69%; background:#cfc8bb;"></div></div>
    <div style="display:flex; gap:14px; margin-top:6px; font-size:10.5px; color:#76726b;"><span><span style="color:#1a1a1a;">■</span> 전기 5만</span><span><span style="color:#cfc8bb;">■</span> 미생물제 11만</span></div>
  </div>
  <div>
    <div style="display:flex; justify-content:space-between; align-items:baseline; margin-bottom:7px;"><span style="font-size:13.5px; font-weight:700; color:#1a1a1a;">건조·분쇄</span><span style="font-size:13px; font-weight:800; color:#ff5a3c;">약 23만원</span></div>
    <div style="display:flex; height:22px; border-radius:5px; overflow:hidden; background:#f1ede6;"><div style="width:61%; background:#1a1a1a;"></div><div style="width:39%; background:#cfc8bb;"></div></div>
    <div style="display:flex; gap:14px; margin-top:6px; font-size:10.5px; color:#76726b;"><span><span style="color:#1a1a1a;">■</span> 전기 14만</span><span><span style="color:#cfc8bb;">■</span> 칼날·필터 9만</span></div>
  </div>
  <div>
    <div style="display:flex; justify-content:space-between; align-items:baseline; margin-bottom:7px;"><span style="font-size:13.5px; font-weight:700; color:#1a1a1a;">건조</span><span style="font-size:13px; font-weight:700; color:#1a1a1a;">약 16만원</span></div>
    <div style="display:flex; height:22px; border-radius:5px; overflow:hidden; background:#f1ede6;"><div style="width:63%; background:#1a1a1a;"></div><div style="width:37%; background:#cfc8bb;"></div></div>
    <div style="display:flex; gap:14px; margin-top:6px; font-size:10.5px; color:#76726b;"><span><span style="color:#1a1a1a;">■</span> 전기 10만</span><span><span style="color:#cfc8bb;">■</span> 필터 6만</span></div>
  </div>
</div>
<p style="font-size:16px; color:#33312d; line-height:1.85; margin:16px 0 0;">건조·분쇄식이 빠르고 편한 대신, 3년 유지비는 약 23만 원으로 가장 높게 잡히는 편인데요. 고온 건조라 전기를 많이 먹는 구조이기 때문이에요. 반대로 미생물식은 전기는 적게 들지만, 미생물제(균)를 꾸준히 보충해야 한다는 점을 같이 봐야 하는 수준입니다.</p>

<div style="border:1px solid #e7e2d9; background:#faf8f5; border-radius:10px; padding:16px 18px; margin:24px 0;"><div style="font-size:11px; font-weight:700; letter-spacing:1px; color:#ff5a3c; margin-bottom:6px;">짚고 가요</div><p style="margin:0; font-size:14.5px; color:#33312d; line-height:1.75;">카탈로그에 적힌 소음(dB)과 실사용 소음은 차이가 큰 편이에요. 소음이 중요하다면 카탈로그 숫자보다 <b style="font-weight:700;">실사용 후기에서 ‘반복되는 불만’</b>을 확인하는 게 더 정확한 수준입니다.</p></div>

<h2 style="font-size:21px; font-weight:800; color:#1a1a1a; margin:34px 0 14px; letter-spacing:-0.4px;">사기 전 체크리스트</h2>
<div style="border:1px solid #e7e2d9; border-radius:12px; padding:8px 20px;">
  <div style="display:flex; align-items:center; gap:12px; padding:13px 0; border-bottom:1px solid #f1ede6;"><span style="width:20px; height:20px; border:2px solid #ff5a3c; border-radius:5px; display:flex; align-items:center; justify-content:center; flex:none;"><svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="#ff5a3c" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg></span><span style="font-size:14px; color:#33312d;">우리 집 하루 음식물 배출량(소형/대형)을 확인했다</span></div>
  <div style="display:flex; align-items:center; gap:12px; padding:13px 0; border-bottom:1px solid #f1ede6;"><span style="width:20px; height:20px; border:2px solid #ff5a3c; border-radius:5px; display:flex; align-items:center; justify-content:center; flex:none;"><svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="#ff5a3c" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg></span><span style="font-size:14px; color:#33312d;">소모품(미생물제·필터) 연간 비용을 더해봤다</span></div>
  <div style="display:flex; align-items:center; gap:12px; padding:13px 0; border-bottom:1px solid #f1ede6;"><span style="width:20px; height:20px; border:2px solid #ff5a3c; border-radius:5px; display:flex; align-items:center; justify-content:center; flex:none;"><svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="#ff5a3c" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg></span><span style="font-size:14px; color:#33312d;">설치 공간·배관 조건을 미리 쟀다</span></div>
  <div style="display:flex; align-items:center; gap:12px; padding:13px 0;"><span style="width:20px; height:20px; border:2px solid #ff5a3c; border-radius:5px; display:flex; align-items:center; justify-content:center; flex:none;"><svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="#ff5a3c" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg></span><span style="font-size:14px; color:#33312d;">A/S·소음 관련 실사용 후기의 ‘반복되는 불만’을 확인했다</span></div>
</div>
`.trim();

const article = {
  slug: "food-waste-disposer-compare",
  corner: "compare",
  field: "리빙·주방",
  title: "음식물처리기, 미생물 vs 건조분쇄 vs 건조",
  subtitle: "3년을 쓰면 뭐가 진짜 쌀까",
  excerpt: "방식마다 처리 원리도, 3년을 쓰는 총비용도 다른 편인데요. 광고가 안 알려주는 유지비까지 계산해 비교했습니다.",
  read_min: 7,
  body_html,
  closing: "‘최고의 방식’은 없습니다. 집밥이 잦고 조용함이 중요하면 미생물, 유지비 부담이 싫고 설치가 자유로우면 건조 쪽이 합리적인 편이에요. <b style=\"font-weight:800; color:#fff;\">선택은 당신의 몫입니다.</b>",
  is_published: true,
};

const res = await fetch(`${URL}/rest/v1/magazine?on_conflict=slug`, {
  method: "POST",
  headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": "application/json", Prefer: "resolution=merge-duplicates,return=representation" },
  body: JSON.stringify(article),
});
console.log("status:", res.status);
console.log((await res.text()).slice(0, 160));
