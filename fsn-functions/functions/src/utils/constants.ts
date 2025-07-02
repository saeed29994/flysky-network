// 🌐 روابط افتراضية للموقع
export const DEFAULT_DASHBOARD_URL = 'https://fsncrew.io/dashboard';
export const DEFAULT_ICON_URL = 'https://fsncrew.io/fsn-logo.png';

// 💰 نظام المكافآت للإحالات حسب عدد المحالين
export const REFERRAL_REWARDS = {
  tier1: 100,   // إذا كان عدد الإحالات أقل من 10
  tier2: 200,   // إذا كان بين 10 و 19
  tier3: 300,   // إذا كان 20 أو أكثر
  maxTier1: 10,
  maxTier2: 20
};

// 📬 قوالب الإشعارات الموحدة (قبل الترجمة)
export const NOTIFICATION_TEMPLATES = {
  referralVerified: {
    title: '🎉 Referral Verified!',
    body: (email: string) => `Your referral ${email} has been verified. You can now claim your reward!`
  },
  rewardClaimed: {
    title: '✅ Reward Claimed',
    body: (email: string) => `You have successfully claimed your reward for referring ${email}.`
  }
};
