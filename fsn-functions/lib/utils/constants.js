"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NOTIFICATION_TEMPLATES = exports.REFERRAL_REWARDS = exports.DEFAULT_ICON_URL = exports.DEFAULT_DASHBOARD_URL = void 0;
// 🌐 روابط افتراضية للموقع
exports.DEFAULT_DASHBOARD_URL = 'https://fsncrew.io/dashboard';
exports.DEFAULT_ICON_URL = 'https://fsncrew.io/fsn-logo.png';
// 💰 نظام المكافآت للإحالات حسب عدد المحالين
exports.REFERRAL_REWARDS = {
    tier1: 100, // إذا كان عدد الإحالات أقل من 10
    tier2: 200, // إذا كان بين 10 و 19
    tier3: 300, // إذا كان 20 أو أكثر
    maxTier1: 10,
    maxTier2: 20
};
// 📬 قوالب الإشعارات الموحدة (قبل الترجمة)
exports.NOTIFICATION_TEMPLATES = {
    referralVerified: {
        title: '🎉 Referral Verified!',
        body: (email) => `Your referral ${email} has been verified. You can now claim your reward!`
    },
    rewardClaimed: {
        title: '✅ Reward Claimed',
        body: (email) => `You have successfully claimed your reward for referring ${email}.`
    }
};
