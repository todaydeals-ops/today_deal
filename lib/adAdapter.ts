// 보상형 광고 어댑터 인터페이스.
// 지금은 목(mock) 구현으로 5초 가짜 광고를 재생. 추후 교체:
//   - 웹: Google Ad Manager(GPT) rewarded — rewardedSlotReady/Granted/Closed 이벤트
//   - 앱: AdMob rewarded (+ SSV 서버검증)
// UI/응모권 로직은 이 인터페이스만 의존하므로 어댑터만 갈아끼우면 됨.

export interface RewardedAdResult {
  completed: boolean; // 광고를 끝까지 시청(완주)했는가
  reason?: string;
}

export interface AdAdapter {
  readonly name: string;
  isAvailable(): boolean;
  // onTick: 남은 초 알림 (목 어댑터의 가짜 플레이어 진행 표시용).
  // 실제 어댑터는 광고사가 자체 전체화면을 띄우므로 onTick 없이도 동작 가능.
  showRewarded(onTick?: (remainingSec: number) => void): Promise<RewardedAdResult>;
}

const MOCK_DURATION = 5;

export const mockAdAdapter: AdAdapter = {
  name: "mock",
  isAvailable: () => true,
  showRewarded(onTick) {
    return new Promise<RewardedAdResult>((resolve) => {
      let remaining = MOCK_DURATION;
      onTick?.(remaining);
      const id = setInterval(() => {
        remaining -= 1;
        if (remaining <= 0) {
          clearInterval(id);
          onTick?.(0);
          resolve({ completed: true });
        } else {
          onTick?.(remaining);
        }
      }, 1000);
    });
  },
};

// 앱에서 실제로 사용할 어댑터. 지금은 목. (교체 지점)
export const adAdapter: AdAdapter = mockAdAdapter;
