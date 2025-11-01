import { collection, getDocs, doc, getDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';

// Interface for Firebase rewards data structure
export interface FirebaseRewards {
  staking: StakingReward[];
  referrals: ReferralReward[];
  watchAds: WatchAdReward[];
}

export interface StakingReward {
  id: string;
  duration: number;
  durationUnit: 'days' | 'weeks' | 'months' | 'years';
  reward: number;
  status: 'active' | 'inactive';
  createdAt?: any;
  updatedAt?: any;
}

export interface ReferralReward {
  id: string;
  tier: number;
  name?: string;
  referralRange: {
    min: number;
    max: number;
  };
  referrals: number;
  reward: number;
  status: 'active' | 'inactive';
  createdAt?: any;
  updatedAt?: any;
}

export interface WatchAdReward {
  id: string;
  adsCount: number;
  reward: number;
  status: 'active' | 'inactive';
  createdAt?: any;
  updatedAt?: any;
}

// Cache for rewards data to avoid repeated Firebase calls
let rewardsCache: FirebaseRewards | null = null;
let lastFetchTime: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch all rewards from Firebase with caching
 * @returns Promise<FirebaseRewards>
 */
export const fetchRewardsFromFirebase = async (): Promise<FirebaseRewards> => {
  const now = Date.now();
  
  // Return cached data if still valid
  if (rewardsCache && (now - lastFetchTime) < CACHE_DURATION) {
    return rewardsCache;
  }

    try {
      // console.log('🔍 Fetching rewards from Firebase...');

      // Optional aggregate doc – used only as a fallback, never authoritative
      let docStaking: StakingReward[] = [];
      let docReferrals: ReferralReward[] = [];
      try {
        const rewardsRef = doc(db, 'rewards', 'rewards');
        const rewardsSnap = await getDoc(rewardsRef);
        if (rewardsSnap.exists()) {
          const data = rewardsSnap.data() as any;
          docStaking = Array.isArray(data.staking) ? data.staking : [];
          docReferrals = Array.isArray(data.referrals) ? data.referrals : [];
        }
      } catch {
        // ignore aggregate doc errors
      }

    // Method 2: Try to fetch from subcollections
    // console.log('🔎 Fetching from subcollections...');

    // Fetch staking rewards
    const stakingQuery = query(collection(db, 'rewards', 'staking', 'items'), orderBy('duration', 'asc'));
    const stakingSnap = await getDocs(stakingQuery);
    const stakingRewards: StakingReward[] = stakingSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data() as Omit<StakingReward, 'id'>
    }));
    
    // Fetch referral rewards
    const referralsQuery = query(collection(db, 'rewards', 'referrals', 'items'), orderBy('tier', 'asc'));
    const referralsSnap = await getDocs(referralsQuery);
    const referralRewards: ReferralReward[] = referralsSnap.docs.map(snap => {
      const raw = snap.data() as any;
      // Normalize legacy/variant shapes into ReferralReward
      const name: string | undefined = raw.name;
      const tierFromNameMatch = /([0-9]+)/.exec(String(name || ''));
      const tier: number = typeof raw.tier === 'number' ? raw.tier : (tierFromNameMatch ? Number(tierFromNameMatch[1]) : 1);
      let min = 0;
      let max = 0;
      if (raw.referralRange && typeof raw.referralRange.min === 'number' && typeof raw.referralRange.max === 'number') {
        min = raw.referralRange.min;
        max = raw.referralRange.max;
      } else if (typeof raw.min === 'number' || typeof raw.max === 'number') {
        min = Number(raw.min) || 0;
        max = Number(raw.max) || 0;
      } else if (typeof raw.range === 'string') {
        const [minStr, maxStr] = raw.range.split('-').map((s: string) => s.trim());
        min = Number(minStr) || 0;
        max = Number(maxStr) || 0;
      }
      const reward = typeof raw.reward === 'number' ? raw.reward : (typeof raw.referralBonus === 'number' ? raw.referralBonus : 0);
      const status: 'active' | 'inactive' = raw.status === 'inactive' ? 'inactive' : 'active';
      return {
        id: snap.id,
        name,
        tier,
        referralRange: { min, max },
        referrals: typeof raw.referrals === 'number' ? raw.referrals : 0,
        reward,
        status
      } as ReferralReward;
    });
    
    // Do NOT fetch watch ads from subcollection anymore; rely on single config doc only
    const watchAdRewards: WatchAdReward[] = [];
    
    let rewardsData: FirebaseRewards = {
      staking: stakingRewards.length ? stakingRewards : docStaking,
      referrals: referralRewards.length ? referralRewards : docReferrals,
      watchAds: watchAdRewards
    };

    // Method 3: Fallback – only if no subcollection items exist
    // referrals => { name: string, range: "min - max", referralBonus: number }
    if (rewardsData.referrals.length === 0) {
      try {
        const referralsDoc = await getDoc(doc(db, 'rewards', 'referrals'));
        if (referralsDoc.exists()) {
          const r = referralsDoc.data() as any;
          const [minStr, maxStr] = (r.range || '').toString().split('-').map((s: string) => s.trim());
          const min = Number(minStr) || 0;
          const max = Number(maxStr) || 0;
          const tierMatch = /([0-9]+)/.exec((r.name || '').toString());
          const tier = tierMatch ? Number(tierMatch[1]) : 1;
          rewardsData.referrals = [
            {
              id: 'referrals',
              tier,
              referralRange: { min, max },
              referrals: 0,
              reward: Number(r.referralBonus) || 0,
              status: 'active'
            }
          ];
        }
      } catch (e) {
        // noop – keep previously resolved structure
      }
    }

    try {
      const watchAdsDoc = await getDoc(doc(db, 'rewards', 'watchAds'));
      if (watchAdsDoc.exists()) {
        const w = watchAdsDoc.data() as any;
        rewardsData.watchAds = [
          {
            id: 'watchAds',
            adsCount: Number(w.dailyLimit) || 0,
            reward: Number(w.collectBonus) || 0,
            status: (typeof w.status === 'string' ? w.status : 'active') as 'active' | 'inactive'
          }
        ];
      } else {
        // No config doc present; ensure watchAds remains empty
        rewardsData.watchAds = [];
      }
    } catch (e) {
      // On error reading config, do not fabricate defaults
      rewardsData.watchAds = [];
    }

    try {
      const stakingDoc = await getDoc(doc(db, 'rewards', 'staking'));
      if (stakingDoc.exists()) {
        const s = stakingDoc.data() as any;
        // Support either { durations: [{ months: 1, apy: 5 }, ...] } or direct fields
        const durations: any[] = Array.isArray(s?.durations) ? s.durations : [];
        if (durations.length > 0) {
          rewardsData.staking = durations.map((d, idx) => ({
            id: d.id || `m${d.months || d.duration || idx}`,
            duration: Number(d.months || d.duration) || 0,
            durationUnit: 'months',
            // Store APY value in `reward` to reuse existing table rendering
            reward: typeof d.apy === 'number' ? (d.apy >= 1 ? d.apy : d.apy * 100) : 0,
            status: d.status === 'inactive' ? 'inactive' : 'active'
          }));
        }
      }
    } catch (e) {
      // noop
    }
    
    // Update cache
    rewardsCache = rewardsData;
    lastFetchTime = now;

    // console.log(`✅ Successfully fetched rewards from Firebase subcollections:`, {
    //   staking: rewardsData.staking.length,
    //   referrals: rewardsData.referrals.length,
    //   watchAds: rewardsData.watchAds.length
    // });

    return rewardsData;
    
  } catch (error) {
    console.error('❌ Error fetching rewards from Firebase:', error);
    // Return cached data if available, otherwise empty structure
    return rewardsCache || {
      staking: [],
      referrals: [],
      watchAds: []
    };
  }
};

/**
 * Fetch a specific reward type from Firebase
 * @param rewardType - The type of reward to fetch ('staking', 'referrals', 'watchAds')
 * @returns Promise<StakingReward[] | ReferralReward[] | WatchAdReward[]>
 */
export const fetchRewardTypeFromFirebase = async (
  rewardType: keyof FirebaseRewards
): Promise<StakingReward[] | ReferralReward[] | WatchAdReward[]> => {
  try {
    const rewards = await fetchRewardsFromFirebase();
    return rewards[rewardType];
  } catch (error) {
    console.error(`❌ Error fetching ${rewardType} rewards:`, error);
    return [];
  }
};

/**
 * Clear the rewards cache (useful for forcing refresh)
 */
export const clearRewardsCache = (): void => {
  rewardsCache = null;
  lastFetchTime = 0;
  // console.log('🧹 Rewards cache cleared');
};

/**
 * Get the maximum number of referrals allowed based on referral tiers
 * @returns Promise<number> - Maximum referral limit
 */
export const getMaxReferralsFromTiers = async (): Promise<number> => {
  try {
    const rewards = await fetchRewardsFromFirebase();
    const referralTiers = rewards.referrals;

    if (referralTiers.length === 0) {
      return 0; // No tiers configured
    }

    // Find the maximum referral limit from all tiers
    const maxReferral = Math.max(...referralTiers.map(tier => tier.referralRange?.max || 0));
    return maxReferral;
  } catch (error) {
    console.error('❌ Error getting max referrals from tiers:', error);
    return 0;
  }
};

/**
 * Get rewards statistics
 * @returns Promise<{totalRewards: number, activeRewards: number, totalValue: number}>
 */
export const getRewardsStats = async (): Promise<{
  totalRewards: number;
  activeRewards: number;
  totalValue: number;
}> => {
  try {
    const rewards = await fetchRewardsFromFirebase();

    const allRewards = [
      ...rewards.staking,
      ...rewards.referrals,
      ...rewards.watchAds
    ];

    const totalRewards = allRewards.length;
    const activeRewards = allRewards.filter(r => r.status === 'active').length;
    const totalValue = allRewards.reduce((sum, r) => {
      if ('reward' in r) {
        return sum + (r.reward || 0);
      }
      return sum;
    }, 0);

    return {
      totalRewards,
      activeRewards,
      totalValue
    };
  } catch (error) {
    console.error('❌ Error getting rewards stats:', error);
    return {
      totalRewards: 0,
      activeRewards: 0,
      totalValue: 0
    };
  }
};