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
    console.log('🔍 Fetching rewards from Firebase...');
    
    // Method 1: Try to fetch from a single 'rewards' document first
    const rewardsRef = doc(db, 'rewards', 'rewards');
    const rewardsSnap = await getDoc(rewardsRef);
    
    if (rewardsSnap.exists()) {
      const data = rewardsSnap.data();
      const rewardsData: FirebaseRewards = {
        staking: data.staking || [],
        referrals: data.referrals || [],
        watchAds: data.watchAds || []
      };

      // Update cache
      rewardsCache = rewardsData;
      lastFetchTime = now;
      
      console.log(`✅ Successfully fetched rewards from Firebase document:`, {
        staking: rewardsData.staking.length,
        referrals: rewardsData.referrals.length,
        watchAds: rewardsData.watchAds.length
      });
      
      return rewardsData;
    } 
    
    // Method 2: If document doesn't exist, try to fetch from subcollections
    console.log('📝 No rewards document found, trying subcollections...');
    
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
    const referralRewards: ReferralReward[] = referralsSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data() as Omit<ReferralReward, 'id'>
    }));
    
    // Fetch watch ads rewards
    const watchAdsQuery = query(collection(db, 'rewards', 'watchAds', 'items'), orderBy('adsCount', 'asc'));
    const watchAdsSnap = await getDocs(watchAdsQuery);
    const watchAdRewards: WatchAdReward[] = watchAdsSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data() as Omit<WatchAdReward, 'id'>
    }));
    
    const rewardsData: FirebaseRewards = {
      staking: stakingRewards,
      referrals: referralRewards,
      watchAds: watchAdRewards
    };
    
    // Update cache
    rewardsCache = rewardsData;
    lastFetchTime = now;
    
    console.log(`✅ Successfully fetched rewards from Firebase subcollections:`, {
      staking: rewardsData.staking.length,
      referrals: rewardsData.referrals.length,
      watchAds: rewardsData.watchAds.length
    });
    
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
  console.log('🧹 Rewards cache cleared');
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