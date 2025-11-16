// Type definitions for AdMob plugin
// This file helps TypeScript understand the AdMob plugin types

declare module '@capacitor-community/admob' {
  export interface AdMobInitializationOptions {
    requestTrackingAuthorization?: boolean;
    testingDevices?: string[];
    initializeForTesting?: boolean;
  }

  export interface RewardedAdOptions {
    adId: string;
  }

  export interface AdMobRewardItem {
    type: string;
    amount: number;
  }

  export interface RewardedAdReward {
    reward: AdMobRewardItem;
  }

  export interface AdMobPlugin {
    initialize(options: AdMobInitializationOptions): Promise<void>;
    setAppMuted(options: { value: boolean }): Promise<void>;
    prepareRewardVideoAd(options: RewardedAdOptions): Promise<void>;
    showRewardVideoAd(options: RewardedAdOptions): Promise<void>;
    addListener(
      eventName: string,
      listenerFunc: (data: any) => void
    ): Promise<any>;
    removeAllListeners(): Promise<void>;
  }

  export const AdMob: AdMobPlugin;
}

