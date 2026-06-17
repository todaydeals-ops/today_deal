// 가중 무작위 추첨 — 응모권(weight) 수에 비례해 당첨 확률 부여, 중복 없이 N명 선정.
// 순수 함수(브라우저/서버 무관). 실서비스에선 서버에서 시드 고정·감사로그와 함께 수행 권장.

export interface Participant {
  id: string;
  name: string; // 표시용 (마스킹된 이름)
  weight: number; // 응모권 수
}

export function weightedDraw(pool: Participant[], count: number): Participant[] {
  const remaining = pool.filter((p) => p.weight > 0);
  const winners: Participant[] = [];

  for (let i = 0; i < count && remaining.length > 0; i++) {
    const total = remaining.reduce((sum, p) => sum + p.weight, 0);
    let r = Math.random() * total;
    let idx = 0;
    for (let j = 0; j < remaining.length; j++) {
      r -= remaining[j].weight;
      if (r <= 0) {
        idx = j;
        break;
      }
    }
    winners.push(remaining[idx]);
    remaining.splice(idx, 1); // 중복 당첨 방지
  }
  return winners;
}

// ── 데모용 합성 응모자 풀 생성 ──
const SURNAMES = ["김", "이", "박", "최", "정", "강", "조", "윤", "장", "임", "한", "오", "서", "신", "권"];

// poolSize명을 무작위 응모권(1~maxEntries)으로 생성
export function makeSyntheticPool(poolSize: number, maxEntries = 6): Participant[] {
  const pool: Participant[] = [];
  for (let i = 0; i < poolSize; i++) {
    const sn = SURNAMES[Math.floor(Math.random() * SURNAMES.length)];
    pool.push({
      id: `p${i}`,
      name: `${sn}**`,
      weight: 1 + Math.floor(Math.random() * maxEntries),
    });
  }
  return pool;
}
