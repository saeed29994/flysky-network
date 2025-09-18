// 📁 src/services/appleSignInService.ts

import { Capacitor } from '@capacitor/core';
import { SignInWithApple } from '@capacitor-community/apple-sign-in';
import { 
  signInWithCredential, 
  signInWithPopup,
  OAuthProvider, 
  User,
  UserCredential 
} from 'firebase/auth';
import { auth, db } from '../firebase';
import { 
  doc, 
  getDoc, 
  setDoc, 
  serverTimestamp, 
  Timestamp,
  arrayUnion,
  increment,
  collection,
  query,
  where,
  getDocs
} from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import { requestPermissionAndToken } from '../utils/pushNotification';

export interface AppleSignInResult {
  success: boolean;
  user?: User;
  error?: string;
}

export interface AppleUserData {
  uid: string;
  email: string | null;
  fullName: string | null;
  isNewUser: boolean;
}

class AppleSignInService {
  private static instance: AppleSignInService;

  public static getInstance(): AppleSignInService {
    if (!AppleSignInService.instance) {
      AppleSignInService.instance = new AppleSignInService();
    }
    return AppleSignInService.instance;
  }

  /**
   * Check if Apple Sign In is available on the current platform
   */
  public isAvailable(): boolean {
    // Apple Sign In is available on iOS natively and on web via Firebase
    return Capacitor.getPlatform() === 'ios' || Capacitor.getPlatform() === 'web';
  }

  /**
   * Initialize Apple Sign In (iOS only)
   */
  public async initialize(): Promise<void> {
    if (!this.isAvailable()) {
      console.log('Apple Sign In is only available on iOS');
      return;
    }

    try {
      // Apple Sign In doesn't require explicit initialization in the current plugin version
      console.log('✅ Apple Sign In ready');
    } catch (error) {
      console.error('❌ Failed to initialize Apple Sign In:', error);
      throw error;
    }
  }

  /**
   * Sign in with Apple
   */
  public async signIn(referralCode?: string): Promise<AppleSignInResult> {
    try {
      if (!this.isAvailable()) {
        return {
          success: false,
          error: 'Apple Sign In is not available on this platform'
        };
      }

      console.log('🍎 Starting Apple Sign In...');
      
      const platform = Capacitor.getPlatform();
      
      if (platform === 'ios') {
        // Native iOS implementation using original Apple Sign In plugin
        console.log('🍎 Using original Apple Sign In plugin for iOS');
        
        try {
          await this.initialize();
          console.log('🍎 Calling SignInWithApple.authorize()...');
          
          // Add timeout to prevent hanging
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Apple Sign In timeout after 30 seconds')), 30000);
          });
          
          const signInPromise = SignInWithApple.authorize();
          const result = await Promise.race([signInPromise, timeoutPromise]) as any;
          
          console.log('🍎 Apple Sign In result:', JSON.stringify(result, null, 2));

          if (!result.response) {
            return {
              success: false,
              error: 'Apple Sign In was cancelled or failed'
            };
          }

          // Create Firebase credential for iOS
          const provider = new OAuthProvider('apple.com');
          const credential = provider.credential({
            idToken: result.response.identityToken,
            rawNonce: undefined
          });

          if (!credential) {
            throw new Error('Failed to create Firebase credential from Apple Sign-In result');
          }

          // Sign in to Firebase
          console.log('🔥 Signing in to Firebase with Apple credential...');
          const userCredential: UserCredential = await signInWithCredential(auth, credential);
          const user = userCredential.user;

          console.log('✅ Firebase authentication successful:', user.uid);

          // Handle user data creation/update
          await this.handleUserData(user, result.response, referralCode);

          // Request notification permission
          await requestPermissionAndToken(user.uid);

          return {
            success: true,
            user: user
          };
          
        } catch (error: any) {
          console.error('❌ Apple Sign In failed:', error);
          console.error('Error details:', JSON.stringify(error, null, 2));
          
          // Handle timeout specifically
          if (error.message?.includes('timeout')) {
            return {
              success: false,
              error: 'Apple Sign In timed out. Please try again.'
            };
          }
          
          // Handle cancellation
          if (error.message?.includes('cancel') || error.message?.includes('cancelled')) {
            return {
              success: false,
              error: 'Apple Sign In was cancelled by user'
            };
          }
          
          throw error;
        }
      } else if (platform === 'web') {
        // Web implementation using Firebase
        const provider = new OAuthProvider('apple.com');
        provider.addScope('email');
        provider.addScope('name');
        
        const result = await signInWithPopup(auth, provider);
        const user = result.user;

        console.log('✅ Web Apple Sign In successful:', user.uid);

        // Handle user data creation/update
        await this.handleUserData(user, {
          user: user.uid,
          email: user.email,
          givenName: user.displayName?.split(' ')[0] || null,
          familyName: user.displayName?.split(' ').slice(1).join(' ') || null,
          identityToken: await user.getIdToken(),
          authorizationCode: ''
        }, referralCode);

        // Request notification permission
        await requestPermissionAndToken(user.uid);

        return {
          success: true,
          user: user
        };
      } else {
        return {
          success: false,
          error: 'Apple Sign In is not supported on this platform'
        };
      }

    } catch (error: any) {
      console.error('❌ Apple Sign In error:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      
      // Handle specific error cases
      if (error.code === 'SignInWithAppleError' || error.message?.includes('cancel') || error.message?.includes('cancelled')) {
        return {
          success: false,
          error: 'Apple Sign In was cancelled by user'
        };
      }
      
      // Handle Firebase authentication errors
      if (error.code?.startsWith('auth/')) {
        return {
          success: false,
          error: `Authentication error: ${error.message || error.code}`
        };
      }

      return {
        success: false,
        error: error.message || 'Apple Sign In failed'
      };
    }
  }

  /**
   * Handle user data creation and updates
   */
  private async handleUserData(
    user: User, 
    appleResponse: any, 
    referralCode?: string
  ): Promise<AppleUserData> {
    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);

    const isNewUser = !userSnap.exists();
    const finalReferral = referralCode?.trim() || '';

    // Extract user information from Apple response
    const fullName = appleResponse.fullName ? 
      `${appleResponse.fullName.givenName || ''} ${appleResponse.fullName.familyName || ''}`.trim() : 
      null;

    const userData = {
      fullName: fullName || user.displayName || '',
      email: user.email || '',
      balance: 0,
      watchedAdsToday: 0,
      adsLastWatched: Timestamp.fromMillis(0),
      plan: 'economy',
      createdAt: serverTimestamp(),
      referralCode: uuidv4().slice(0, 8),
      referredBy: finalReferral,
      language: 'en',
      theme: 'dark',
      kycStatus: 'Not Actived',
      dailyMined: 0,
      lockedFromStaking: 0,
      stakingEarnings: 0,
      referralReward: 0,
      referrals: 0,
      agreedToTerms: true,
      transactionHistory: [],
      // Apple Sign In specific fields
      appleUserId: appleResponse.user,
      signInMethod: 'apple'
    };

    if (isNewUser) {
      console.log('👤 Creating new user with Apple Sign In');
      await setDoc(userRef, userData);

      // Handle referral if provided
      if (finalReferral) {
        await this.registerReferral(finalReferral, user.email || '');
      }

      // Send welcome message
      await this.sendWelcomeMessage(user.uid);
    } else {
      console.log('👤 Updating existing user with Apple Sign In');
      // Update only specific fields for existing users
      await setDoc(userRef, {
        ...userData,
        // Don't overwrite existing data
        balance: userSnap.data()?.balance || 0,
        watchedAdsToday: userSnap.data()?.watchedAdsToday || 0,
        adsLastWatched: userSnap.data()?.adsLastWatched || Timestamp.fromMillis(0),
        plan: userSnap.data()?.plan || 'economy',
        createdAt: userSnap.data()?.createdAt || serverTimestamp(),
        referralCode: userSnap.data()?.referralCode || uuidv4().slice(0, 8),
        referredBy: userSnap.data()?.referredBy || finalReferral,
        language: userSnap.data()?.language || 'en',
        theme: userSnap.data()?.theme || 'dark',
        kycStatus: userSnap.data()?.kycStatus || 'Not Actived',
        dailyMined: userSnap.data()?.dailyMined || 0,
        lockedFromStaking: userSnap.data()?.lockedFromStaking || 0,
        stakingEarnings: userSnap.data()?.stakingEarnings || 0,
        referralReward: userSnap.data()?.referralReward || 0,
        referrals: userSnap.data()?.referrals || 0,
        transactionHistory: userSnap.data()?.transactionHistory || [],
        // Update Apple-specific fields
        appleUserId: appleResponse.user,
        signInMethod: 'apple',
        lastSignIn: serverTimestamp()
      }, { merge: true });
    }

    return {
      uid: user.uid,
      email: user.email,
      fullName: fullName || user.displayName,
      isNewUser
    };
  }

  /**
   * Register referral for new user
   */
  private async registerReferral(referredCode: string, referredEmail: string): Promise<void> {
    try {
      console.log('🔍 Searching for referrer with code:', referredCode);
      
      const q = query(collection(db, 'users'), where('referralCode', '==', referredCode));
      const querySnapshot = await getDocs(q);

      let refUserRef = null;
      let refData = null;

      if (!querySnapshot.empty) {
        const refUser = querySnapshot.docs[0];
        refUserRef = refUser.ref;
        refData = refUser.data();
        console.log('✅ Found referrer by referral code:', refUser.id);
      } else {
        console.log('🔍 Trying alternative lookup by UID...');
        const altRef = doc(db, 'users', referredCode);
        const altSnap = await getDoc(altRef);
        if (altSnap.exists()) {
          refUserRef = altRef;
          refData = altSnap.data();
          console.log('✅ Found referrer by UID:', referredCode);
        }
      }

      if (refUserRef && refData) {
        console.log('📝 Updating referrer document:', refUserRef.id);
        
        await setDoc(refUserRef, {
          referralList: arrayUnion({
            email: referredEmail,
            status: 'Pending',
            timestamp: Date.now(),
          }),
          referrals: increment(1),
        }, { merge: true });
        
        console.log('✅ Referral registered successfully');
      } else {
        console.warn('⚠️ No matching referrer found for code:', referredCode);
      }
    } catch (err: any) {
      console.error('❌ Failed to update referral list:', err);
    }
  }

  /**
   * Send welcome message to new user
   */
  private async sendWelcomeMessage(uid: string): Promise<void> {
    try {
      const inboxRef = doc(db, 'users', uid, 'inbox', 'welcome');
      const inboxSnap = await getDoc(inboxRef);

      if (!inboxSnap.exists()) {
        await setDoc(inboxRef, {
          title: 'Welcome to FlySky Network!',
          body: 'Welcome! You received 500 FSN as a welcome bonus!',
          timestamp: Date.now(),
          read: false,
          claimed: false,
          amount: 500,
          type: 'welcome_bonus',
        });
        console.log('✅ Welcome message added to inbox');
      }
    } catch (error) {
      console.error('❌ Failed to send welcome message:', error);
    }
  }

  /**
   * Sign out from Apple (if needed)
   */
  public async signOut(): Promise<void> {
    try {
      if (this.isAvailable()) {
        // Apple Sign In doesn't have a specific signOut method
        // The user will be signed out when Firebase auth is cleared
        console.log('✅ Apple Sign Out handled by Firebase');
      }
    } catch (error) {
      console.error('❌ Apple Sign Out error:', error);
    }
  }
}

export default AppleSignInService.getInstance();
