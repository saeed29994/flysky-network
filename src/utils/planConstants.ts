// Plan configuration constants - Centralized plan data for all components
// Updated for Google Play and Apple Store billing with USD pricing

// Type definitions
export type PlanType = 'economy' | 'business' | 'first-6' | 'first-lifetime';

export const PLAN_LIMITS: Record<PlanType, number> = {
  economy: 600,
  business: 3000,
  'first-6': 6000,
  'first-lifetime': 6000,
};

export const MINING_CYCLE_SECONDS = 43200; // 12 hours in seconds

// Comprehensive plan configuration - Updated for USD and in-app purchases
export const PLAN_CONFIG: Record<PlanType, {
  id: string;
  name: string;
  price: number;
  priceLabel: string;
  bonus: number;
  miningRate: string;
  features: string[];
  color: string;
  bgColor: string;
  icon: string;
  popular: boolean;
  index: number;
  productId?: string; // For Google Play/Apple Store product IDs
}> = {
  economy: {
    id: 'economy',
    name: 'Economy Class',
    price: 0,
    priceLabel: 'Free',
    bonus: 0,
    miningRate: '600 FSN / 12 hours',
    features: ['Basic mining', 'Standard support', 'Community access'],
    color: 'from-amber-500 to-orange-500',
    bgColor: 'from-amber-500/20 to-orange-500/20',
    icon: '💰',
    popular: false,
    index: -1, // No subscription index for economy
  },
  business: {
    id: 'business',
    name: 'Business Class',
    price: 14.99,
    priceLabel: '$14.99 USD / month',
    bonus: 100000,
    miningRate: '3000 FSN / 12 hours',
    features: ['Advanced mining', 'Priority support', 'Staking access', 'Faster mining'],
    color: 'from-emerald-500 to-green-500',
    bgColor: 'from-emerald-500/20 to-green-500/20',
    icon: '💼',
    popular: false,
    index: 0,
    productId: 'business_monthly', // Google Play/Apple Store product ID
  },
  'first-6': {
    id: 'first-6',
    name: 'First Class (6 Months)',
    price: 119.99,
    priceLabel: '$119.99 USD / 6 months',
    bonus: 1000000,
    miningRate: '6000 FSN / 12 hours',
    features: ['All business features', 'Faster mining', 'Event access', 'Priority support', 'Highest mining', 'Premium access'],
    color: 'from-purple-500 to-indigo-500',
    bgColor: 'from-purple-500/20 to-indigo-500/20',
    icon: '👑',
    popular: true,
    index: 1,
    productId: 'first_6months', // Google Play/Apple Store product ID
  },
  'first-lifetime': {
    id: 'first-lifetime',
    name: 'First Class (Lifetime)',
    price: 199.99,
    priceLabel: '$199.99 USD one-time',
    bonus: 1500000,
    miningRate: '6000 FSN / 12 hours',
    features: ['Highest mining', 'Lifetime access', 'Premium access', 'Priority support', 'Unlocked forever', 'Lifetime perks', 'Event access'],
    color: 'from-pink-500 to-rose-500',
    bgColor: 'from-pink-500/20 to-rose-500/20',
    icon: '💎',
    popular: false,
    index: 2,
    productId: 'first_lifetime', // Google Play/Apple Store product ID
  },
};

// Staking return rates by plan
export const STAKING_RETURN_RATES: Record<PlanType, number[]> = {
  economy: [0, 0, 0.15, 0.4],
  business: [0, 0.10, 0.25, 0.6],
  'first-6': [0.03, 0.15, 0.35, 0.8],
  'first-lifetime': [0.05, 0.2, 0.45, 1.0],
};

// Plan mapping for legacy support
export const PLAN_MAPPING: Record<string, PlanType> = {
  economy: 'economy',
  business: 'business',
  'first-6': 'first-6',
  first: 'first-lifetime', // Legacy mapping
  'first-lifetime': 'first-lifetime',
};

// Get plan configuration with translation support
export const getPlanConfig = (t: any) => ({
  economy: {
    name: t('miningPage.planNames.economy'),
    color: PLAN_CONFIG.economy.color,
    bgColor: PLAN_CONFIG.economy.bgColor,
    icon: PLAN_CONFIG.economy.icon
  },
  business: {
    name: t('miningPage.planNames.business'),
    color: PLAN_CONFIG.business.color,
    bgColor: PLAN_CONFIG.business.bgColor,
    icon: PLAN_CONFIG.business.icon
  },
  'first-6': {
    name: t('miningPage.planNames.first-6'),
    color: PLAN_CONFIG['first-6'].color,
    bgColor: PLAN_CONFIG['first-6'].bgColor,
    icon: PLAN_CONFIG['first-6'].icon
  },
  'first-lifetime': {
    name: t('miningPage.planNames.first-lifetime'),
    color: PLAN_CONFIG['first-lifetime'].color,
    bgColor: PLAN_CONFIG['first-lifetime'].bgColor,
    icon: PLAN_CONFIG['first-lifetime'].icon
  }
});

// Get mining rate for a plan
export const getMiningRate = (plan: string): number => {
  return PLAN_LIMITS[plan as PlanType] ? PLAN_LIMITS[plan as PlanType] / MINING_CYCLE_SECONDS : 0;
};

// Get plan by index (for subscription modal)
export const getPlanByIndex = (index: number) => {
  return Object.values(PLAN_CONFIG).find(plan => plan.index === index);
};

// Get all subscription plans (excluding economy)
export const getSubscriptionPlans = () => {
  return Object.values(PLAN_CONFIG).filter(plan => plan.index >= 0);
};

// Get plan label with translation
export const getPlanLabel = (plan: string, t: any) => {
  switch (plan) {
    case 'business': return t('plans.business');
    case 'first-6': return t('first6');
    case 'first-lifetime': return t('firstLifetime');
    default: return t('plans.economy');
  }
};

// Get staking return rate for a plan
export const getStakingReturnRate = (plan: string) => {
  return STAKING_RETURN_RATES[plan as PlanType] || STAKING_RETURN_RATES.economy;
};

// Get plan bonus amount
export const getPlanBonus = (plan: string): number => {
  return PLAN_CONFIG[plan as PlanType]?.bonus || 0;
};

// Get plan price
export const getPlanPrice = (plan: string): number => {
  return PLAN_CONFIG[plan as PlanType]?.price || 0;
};

// Get plan features
export const getPlanFeatures = (plan: string): string[] => {
  return PLAN_CONFIG[plan as PlanType]?.features || [];
}; 