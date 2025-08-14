// 📁 src/utils/userService.ts

import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

export interface FirebaseUser {
  id: string;
  fullName: string;
  email: string;
  createdAt: any; // Firebase Timestamp
  lastLogin?: any; // Firebase Timestamp or undefined
  lastUserAgent?: string;
  accountStatus: 'active' | 'suspended';
  country?: string;
  city?: string;
  referrals: number;
  referralCode: string;
  referredBy?: string;
  plan: string;
  planStartDate?: any; // Firebase Timestamp or undefined
  kycStatus: string;
  totalRewardsClaimed: number;
  totalDeposits: number;
  totalWithdrawals: number;
  balance: number;
  role?: string;
  membership?: {
    planName: string;
    purchaseDate: number;
    subscriptionEnd: number;
    paymentMethod: string;
  };
}

// Cache for users data to avoid repeated Firebase calls
let usersCache: FirebaseUser[] | null = null;
let lastFetchTime: number = 0;
const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes (shorter than other caches for more frequent updates)

/**
 * Fetch all users from Firebase with caching
 * @returns Promise<FirebaseUser[]>
 */
export const fetchUsersFromFirebase = async (): Promise<FirebaseUser[]> => {
  const now = Date.now();
  
  // Return cached data if still valid
  if (usersCache && (now - lastFetchTime) < CACHE_DURATION) {
    return usersCache;
  }

  try {
    console.log('🔍 Fetching users from Firebase...');
    const usersRef = collection(db, 'users');
    const snapshot = await getDocs(usersRef);
    
    if (snapshot.empty) {
      console.log('📝 No users found in Firebase');
      return [];
    }

    const usersData: FirebaseUser[] = [];
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      
      // Calculate total transactions
      const transactionHistory = data.transactionHistory || [];
      let totalDeposits = 0;
      let totalWithdrawals = 0;
      
      transactionHistory.forEach((tx: any) => {
        if (tx.type === 'deposit') totalDeposits += tx.amount || 0;
        if (tx.type === 'withdrawal') totalWithdrawals += tx.amount || 0;
      });
      
      // Calculate total rewards claimed
      const totalRewardsClaimed = (data.miningEarnings || 0) + 
                                 (data.stakingEarnings || 0) + 
                                 (data.referralReward || 0);
      
      usersData.push({
        id: doc.id,
        fullName: data.fullName || '',
        email: data.email || '',
        createdAt: data.createdAt,
        lastLogin: data.lastLogin,
        lastUserAgent: data.lastUserAgent,
        accountStatus: data.isActive === false ? 'suspended' : 'active',
        country: data.country,
        city: data.city,
        referrals: data.referrals || 0,
        referralCode: data.referralCode || '',
        referredBy: data.referredBy,
        plan: data.plan || 'economy',
        planStartDate: data.membership?.purchaseDate ? new Date(data.membership.purchaseDate) : undefined,
        kycStatus: data.kycStatus || 'Not activated',
        totalRewardsClaimed,
        totalDeposits,
        totalWithdrawals,
        balance: data.balance || 0,
        role: data.role,
        membership: data.membership,
      });
    });

    // Update cache
    usersCache = usersData;
    lastFetchTime = now;
    
    console.log(`✅ Successfully fetched ${usersData.length} users from Firebase`);
    return usersData;
    
  } catch (error) {
    console.error('❌ Error fetching users from Firebase:', error);
    // Return cached data if available, otherwise empty array
    return usersCache || [];
  }
};

/**
 * Clear the users cache to force a fresh fetch next time
 */
export const clearUsersCache = () => {
  usersCache = null;
  lastFetchTime = 0;
  console.log('🧹 Users cache cleared');
};

/**
 * Fetch a specific user by ID from Firebase
 * @param userId - The user ID to fetch
 * @returns Promise<FirebaseUser | null>
 */
export const fetchUserById = async (userId: string): Promise<FirebaseUser | null> => {
  try {
    // Check if user exists in cache first
    if (usersCache) {
      const cachedUser = usersCache.find(user => user.id === userId);
      if (cachedUser) return cachedUser;
    }
    
    // Fetch from Firebase if not in cache
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      console.log(`📝 No user found with ID: ${userId}`);
      return null;
    }
    
    const data = userSnap.data();
    
    // Calculate total transactions
    const transactionHistory = data.transactionHistory || [];
    let totalDeposits = 0;
    let totalWithdrawals = 0;
    
    transactionHistory.forEach((tx: any) => {
      if (tx.type === 'deposit') totalDeposits += tx.amount || 0;
      if (tx.type === 'withdrawal') totalWithdrawals += tx.amount || 0;
    });
    
    // Calculate total rewards claimed
    const totalRewardsClaimed = (data.miningEarnings || 0) + 
                               (data.stakingEarnings || 0) + 
                               (data.referralReward || 0);
    
    return {
      id: userSnap.id,
      fullName: data.fullName || '',
      email: data.email || '',
      createdAt: data.createdAt,
      lastLogin: data.lastLogin,
      lastUserAgent: data.lastUserAgent,
      accountStatus: data.isActive === false ? 'suspended' : 'active',
      country: data.country,
      city: data.city,
      referrals: data.referrals || 0,
      referralCode: data.referralCode || '',
      referredBy: data.referredBy,
      plan: data.plan || 'economy',
      planStartDate: data.membership?.purchaseDate ? new Date(data.membership.purchaseDate) : undefined,
      kycStatus: data.kycStatus || 'Not activated',
      totalRewardsClaimed,
      totalDeposits,
      totalWithdrawals,
      balance: data.balance || 0,
      role: data.role,
      membership: data.membership,
    };
    
  } catch (error) {
    console.error(`❌ Error fetching user with ID ${userId}:`, error);
    return null;
  }
}; 