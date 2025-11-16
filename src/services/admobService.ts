// AdMob Service - Handles all AdMob operations
import { AdMob, RewardedAdOptions, RewardedAdReward, AdMobRewardItem } from '@capacitor-community/admob';
import { Capacitor } from '@capacitor/core';
import { getRewardedAdUnitId, AdMobConfig } from '../utils/admobConfig';

export interface AdMobServiceCallbacks {
  onAdLoaded?: () => void;
  onAdFailedToLoad?: (error: string) => void;
  onAdRewarded?: (reward: AdMobRewardItem) => void;
  onAdClosed?: () => void;
  onAdOpened?: () => void;
}

class AdMobService {
  private isInitialized = false;
  private isAdLoading = false;
  private isAdShowing = false;
  private currentCallbacks: AdMobServiceCallbacks | null = null;

  /**
   * Initialize AdMob SDK
   * Must be called before using any ad functions
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('✅ AdMob already initialized');
      return;
    }

    // Only initialize on native platforms (Android/iOS)
    if (!Capacitor.isNativePlatform()) {
      console.warn('⚠️ AdMob only works on native platforms (Android/iOS). Skipping initialization on web.');
      return;
    }

    try {
      const platform = Capacitor.getPlatform();
    //   const appId = platform === 'ios' 
    //     ? AdMobConfig.appId.ios 
    //     : AdMobConfig.appId.android;

      await AdMob.initialize({
        requestTrackingAuthorization: true, // iOS only - request tracking permission
        testingDevices: AdMobConfig.testMode ? ['YOUR_TEST_DEVICE_ID'] : [],
        initializeForTesting: AdMobConfig.testMode,
      });

      // Set app ID (required for iOS, optional for Android)
      if (platform === 'ios') {
        await AdMob.setAppMuted({ value: false }); // Optional: mute/unmute ads
      }

      this.isInitialized = true;
      console.log(`✅ AdMob initialized successfully for ${platform}`);
    } catch (error: any) {
      console.error('❌ AdMob initialization failed:', error);
      throw new Error(`AdMob initialization failed: ${error.message}`);
    }
  }

  /**
   * Pre-load a rewarded ad
   * Call this when user might watch an ad soon (e.g., when they open Watch to Earn page)
   */
  async prepareRewardedAd(callbacks?: AdMobServiceCallbacks): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      console.warn('⚠️ AdMob only works on native platforms');
      return;
    }

    if (!this.isInitialized) {
      await this.initialize();
    }

    if (this.isAdLoading) {
      console.log('⏳ Ad is already loading...');
      return;
    }

    try {
      this.isAdLoading = true;
      this.currentCallbacks = callbacks || {};

      const platform = Capacitor.getPlatform();
      const adUnitId = getRewardedAdUnitId(platform);

      // Set up event listeners
      AdMob.addListener('onRewardedAdLoaded', () => {
        console.log('✅ Rewarded ad loaded successfully');
        this.isAdLoading = false;
        this.currentCallbacks?.onAdLoaded?.();
      });

      AdMob.addListener('onRewardedAdFailedToLoad', (error: any) => {
        console.error('❌ Rewarded ad failed to load:', error);
        this.isAdLoading = false;
        this.currentCallbacks?.onAdFailedToLoad?.(error.message || 'Failed to load ad');
      });

      AdMob.addListener('onRewardedAdRewarded', (reward: RewardedAdReward) => {
        console.log('🎉 User earned reward:', reward);
        this.currentCallbacks?.onAdRewarded?.(reward.reward);
      });

      AdMob.addListener('onRewardedAdClosed', () => {
        console.log('📱 Rewarded ad closed');
        this.isAdShowing = false;
        this.currentCallbacks?.onAdClosed?.();
        // Clean up listeners
        this.currentCallbacks = null;
      });

      AdMob.addListener('onRewardedAdOpened', () => {
        console.log('📱 Rewarded ad opened');
        this.isAdShowing = true;
        this.currentCallbacks?.onAdOpened?.();
      });

      // Prepare the rewarded ad
      const options: RewardedAdOptions = {
        adId: adUnitId,
      };

      await AdMob.prepareRewardVideoAd(options);
      console.log('⏳ Preparing rewarded ad...');
    } catch (error: any) {
      console.error('❌ Error preparing rewarded ad:', error);
      this.isAdLoading = false;
      this.currentCallbacks?.onAdFailedToLoad?.(error.message || 'Failed to prepare ad');
      throw error;
    }
  }

  /**
   * Show a rewarded ad
   * Make sure to call prepareRewardedAd first
   */
  async showRewardedAd(callbacks?: AdMobServiceCallbacks): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      console.warn('⚠️ AdMob only works on native platforms');
      // In web, simulate ad completion for testing
      if (callbacks?.onAdRewarded) {
        setTimeout(() => {
          callbacks.onAdRewarded?.({ type: 'reward', amount: 1 });
          callbacks.onAdClosed?.();
        }, 2000);
      }
      return;
    }

    if (!this.isInitialized) {
      await this.initialize();
    }

    if (this.isAdShowing) {
      console.warn('⚠️ Ad is already showing');
      return;
    }

    try {
      // Update callbacks if provided
      if (callbacks) {
        this.currentCallbacks = { ...this.currentCallbacks, ...callbacks };
      }

      const platform = Capacitor.getPlatform();
      const adUnitId = getRewardedAdUnitId(platform);

      const options: RewardedAdOptions = {
        adId: adUnitId,
      };

      await AdMob.showRewardVideoAd(options);
      console.log('📱 Showing rewarded ad...');
    } catch (error: any) {
      console.error('❌ Error showing rewarded ad:', error);
      this.currentCallbacks?.onAdFailedToLoad?.(error.message || 'Failed to show ad');
      throw error;
    }
  }

  /**
   * Check if an ad is ready to show
   */
  async isRewardedAdReady(): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) {
      return false;
    }

    try {
      // AdMob plugin doesn't have a direct "isReady" method
      // We'll track this ourselves via the loading state
      return !this.isAdLoading && this.isInitialized;
    } catch (error) {
      console.error('❌ Error checking ad readiness:', error);
      return false;
    }
  }

  /**
   * Get current loading state
   */
  getLoadingState(): { isLoading: boolean; isShowing: boolean } {
    return {
      isLoading: this.isAdLoading,
      isShowing: this.isAdShowing,
    };
  }

  /**
   * Reset service state (useful for cleanup)
   */
  reset(): void {
    this.isAdLoading = false;
    this.isAdShowing = false;
    this.currentCallbacks = null;
  }
}

// Export singleton instance
export const admobService = new AdMobService();
export default admobService;

