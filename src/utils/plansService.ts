import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

// Interface for Firebase plan data
export interface FirebasePlan {
  id: string;
  name: string;
  price: number;
  durationDays: number;
  dailyMiningReward: number;
  bonus: number;
  features: string[];
  color: string; // Gradient color classes for UI styling
  createdAt?: any;
}

// Cache for plans data to avoid repeated Firebase calls
let plansCache: Record<string, FirebasePlan> | null = null;
let lastFetchTime: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch all plans from Firebase with caching
 * @returns Promise<Record<string, FirebasePlan>>
 */
export const fetchPlansFromFirebase = async (): Promise<Record<string, FirebasePlan>> => {
  const now = Date.now();
  
  // Return cached data if still valid
  if (plansCache && (now - lastFetchTime) < CACHE_DURATION) {
    return plansCache;
  }

  try {
    // console.log('🔍 Fetching plans from Firebase...');
    const plansRef = collection(db, 'plans');
    const snapshot = await getDocs(plansRef);

    if (snapshot.empty) {
      // console.log('📝 No plans found in Firebase');
      return {};
    }

    const plansData: Record<string, FirebasePlan> = {};
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      plansData[doc.id] = {
        id: doc.id,
        name: data.name || '',
        price: data.price || 0,
        durationDays: data.durationDays || 30,
        dailyMiningReward: data.dailyMiningReward || 0,
        bonus: data.bonus || 0,
        features: data.features || [],
        color: data.color || '', // Assuming 'color' is a field in your Firebase document
        createdAt: data.createdAt
      };
    });

    // Update cache
    plansCache = plansData;
    lastFetchTime = now;
    
    // console.log(`✅ Successfully fetched ${Object.keys(plansData).length} plans from Firebase`);
    return plansData;
    
  } catch (error) {
    console.error('❌ Error fetching plans from Firebase:', error);
    // Return cached data if available, otherwise empty object
    return plansCache || {};
  }
};

/**
 * Fetch a specific plan by ID from Firebase
 * @param planId - The plan ID to fetch
 * @returns Promise<FirebasePlan | null>
 */
export const fetchPlanById = async (planId: string): Promise<FirebasePlan | null> => {
  try {
    const planRef = doc(db, 'plans', planId);
    const planSnap = await getDoc(planRef);
    
    if (!planSnap.exists()) {
      // console.log(`📝 Plan ${planId} not found in Firebase`);
      return null;
    }

    const data = planSnap.data();
    return {
      id: planSnap.id,
      name: data.name || '',
      price: data.price || 0,
      durationDays: data.durationDays || 30,
      dailyMiningReward: data.dailyMiningReward || 0,
      bonus: data.bonus || 0,
      features: data.features || [],
      color: data.color || '', // Assuming 'color' is a field in your Firebase document
      createdAt: data.createdAt
    };
    
  } catch (error) {
    console.error(`❌ Error fetching plan ${planId} from Firebase:`, error);
    return null;
  }
};

/**
 * Get daily mining reward for a specific plan
 * @param planId - The plan ID
 * @returns Promise<number> - The daily mining reward in FSN
 */
export const getPlanDailyMiningReward = async (planId: string): Promise<number> => {
  try {
    // First try to get from cache
    if (plansCache && plansCache[planId]) {
      return plansCache[planId].dailyMiningReward;
    }

    // If not in cache, fetch from Firebase
    const plan = await fetchPlanById(planId);
    return plan?.dailyMiningReward || 0;
    
  } catch (error) {
    console.error(`❌ Error getting daily mining reward for plan ${planId}:`, error);
    return 0;
  }
};

/**
 * Get all plans with their daily mining rewards
 * @returns Promise<Record<string, number>> - Plan ID to daily mining reward mapping
 */
export const getAllPlansDailyMiningRewards = async (): Promise<Record<string, number>> => {
  try {
    const plans = await fetchPlansFromFirebase();
    const rewards: Record<string, number> = {};
    
    Object.keys(plans).forEach(planId => {
      rewards[planId] = plans[planId].dailyMiningReward;
    });
    
    return rewards;
    
  } catch (error) {
    console.error('❌ Error getting all plans daily mining rewards:', error);
    return {};
  }
};

/**
 * Clear the plans cache (useful for testing or when data needs to be refreshed)
 */
export const clearPlansCache = () => {
  plansCache = null;
  lastFetchTime = 0;
  // console.log('🗑️ Plans cache cleared');
};

/**
 * Check if plans cache is valid
 * @returns boolean
 */
export const isPlansCacheValid = (): boolean => {
  if (!plansCache || !lastFetchTime) return false;
  return (Date.now() - lastFetchTime) < CACHE_DURATION;
};

/**
 * Get plan information for display purposes
 * @param planId - The plan ID
 * @returns Promise<{ name: string; dailyMiningReward: number; price: number; bonus: number } | null>
 */
export const getPlanDisplayInfo = async (planId: string) => {
  try {
    const plan = await fetchPlanById(planId);
    if (!plan) return null;
    
    return {
      name: plan.name,
      dailyMiningReward: plan.dailyMiningReward,
      price: plan.price,
      bonus: plan.bonus
    };
    
  } catch (error) {
    console.error(`❌ Error getting plan display info for ${planId}:`, error);
    return null;
  }
};

/**
 * Get bonus amount for a specific plan
 * @param planId - The plan ID
 * @returns Promise<number> - The bonus amount
 */
export const getPlanBonus = async (planId: string): Promise<number> => {
  try {
    const plan = await fetchPlanById(planId);
    return plan?.bonus || 0;
    
  } catch (error) {
    console.error(`❌ Error getting bonus for plan ${planId}:`, error);
    return 0;
  }
}; 