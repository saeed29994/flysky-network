// 📁 src/services/googleSignInService.ts

import { Capacitor } from '@capacitor/core';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import { 
  signInWithCredential,
  signInWithPopup,
  GoogleAuthProvider, 
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

export interface GoogleSignInResult {
  success: boolean;
  user?: User;
  error?: string;
}

export interface GoogleUserData {
  uid: string;
  email: string | null;
  fullName: string | null;
  isNewUser: boolean;
}

class GoogleSignInService {
  private static instance: GoogleSignInService;

  public static getInstance(): GoogleSignInService {
    if (!GoogleSignInService.instance) {
      GoogleSignInService.instance = new GoogleSignInService();
    }
    return GoogleSignInService.instance;
  }

  /**
   * Check if Google Sign In is available on the current platform
   */
  public isAvailable(): boolean {
    // Google Sign In is available on all platforms
    return true;
  }

  /**
   * Sign in with Google
   */
  public async signIn(referralCode?: string): Promise<GoogleSignInResult> {
    try {
      console.log('🔍 Starting Google Sign In...');
      console.log('🔍 Current platform:', Capacitor.getPlatform());
      
      const platform = Capacitor.getPlatform();
      let userCredential: UserCredential;

      if (platform === 'android' || platform === 'ios') {
        // For mobile platforms, use Capacitor Firebase Authentication
        console.log(`📱 Using Capacitor Firebase Auth for ${platform}`);
        
        try {
          // Use Capacitor Firebase Authentication plugin
          const result = await FirebaseAuthentication.signInWithGoogle();
          console.log('✅ Capacitor Firebase Auth successful:', result);
          
          // Create Firebase credential from Capacitor result
          const credential = GoogleAuthProvider.credential(result.credential?.idToken);
          
          if (!credential) {
            throw new Error('Failed to create Firebase credential from Google Sign-In result');
          }
          
          // Sign in to Firebase with the credential
          userCredential = await signInWithCredential(auth, credential);
          console.log('✅ Firebase authentication successful:', userCredential.user.uid);
          
        } catch (capacitorError: any) {
          console.error('❌ Capacitor Firebase Auth failed:', capacitorError);
          
          // Fallback to web-based auth for mobile if Capacitor fails
          console.log('🔄 Falling back to web-based authentication...');
          
          const provider = new GoogleAuthProvider();
          provider.addScope('email');
          provider.addScope('profile');
          provider.setCustomParameters({
            prompt: 'select_account'
          });

          // Add timeout to prevent indefinite loading
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => {
              reject(new Error('Google Sign In timed out. Please try again.'));
            }, 30000); // 30 second timeout
          });

          try {
            userCredential = await Promise.race([
              signInWithPopup(auth, provider),
              timeoutPromise
            ]) as UserCredential;
            
            console.log('✅ Fallback web auth successful');
          } catch (fallbackError: any) {
            console.error('❌ Fallback web auth failed:', fallbackError);
            
            if (fallbackError.message?.includes('timed out')) {
              throw new Error('Google Sign In timed out. Please try again.');
            }
            
            if (fallbackError.code === 'auth/popup-closed-by-user') {
              throw new Error('Sign in was cancelled');
            }
            
            if (fallbackError.code === 'auth/popup-blocked') {
              throw new Error('Popup was blocked. Please allow popups and try again.');
            }
            
            if (fallbackError.code === 'auth/network-request-failed') {
              throw new Error('Network error. Please check your internet connection and try again.');
            }
            
            throw new Error('Google Sign In failed. Please try again.');
          }
        }
      } else {
        // Web platform - use standard popup
        console.log('🌐 Using web Google Sign In approach');
        const provider = new GoogleAuthProvider();
        provider.addScope('email');
        provider.addScope('profile');
        
        // Add timeout for web as well
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => {
            reject(new Error('Google Sign In timed out. Please try again.'));
          }, 30000); // 30 second timeout
        });

        try {
          userCredential = await Promise.race([
            signInWithPopup(auth, provider),
            timeoutPromise
          ]) as UserCredential;
          
          console.log('✅ Web popup sign-in successful');
        } catch (popupError: any) {
          console.log('⚠️ Web popup failed:', popupError);
          
          if (popupError.message?.includes('timed out')) {
            throw new Error('Google Sign In timed out. Please try again.');
          }
          
          if (popupError.code === 'auth/popup-closed-by-user') {
            throw new Error('Sign in was cancelled');
          }
          
          if (popupError.code === 'auth/popup-blocked') {
            throw new Error('Popup was blocked. Please allow popups and try again.');
          }
          
          if (popupError.code === 'auth/network-request-failed') {
            throw new Error('Network error. Please check your internet connection and try again.');
          }
          
          throw new Error('Google Sign In failed. Please try again.');
        }
      }

      const user = userCredential.user;
      console.log('✅ Google Sign In successful:', user.uid);

      // Handle user data creation/update
      await this.handleUserData(user, referralCode);

      // Request notification permission
      await requestPermissionAndToken(user.uid);

      return {
        success: true,
        user: user
      };

    } catch (error: any) {
      console.error('❌ Google Sign In error:', error);
      
      // Handle specific error cases
      if (error.message?.includes('timed out')) {
        return {
          success: false,
          error: 'Google Sign In timed out. Please try again.'
        };
      }
      
      if (error.message?.includes('cancelled')) {
        return {
          success: false,
          error: 'Sign in was cancelled'
        };
      }
      
      if (error.message?.includes('blocked')) {
        return {
          success: false,
          error: 'Popup was blocked. Please allow popups and try again.'
        };
      }
      
      if (error.message?.includes('Network error')) {
        return {
          success: false,
          error: 'Network error. Please check your internet connection and try again.'
        };
      }

      return {
        success: false,
        error: error.message || 'Google Sign In failed'
      };
    }
  }

  /**
   * Handle user data creation and updates
   */
  private async handleUserData(user: User, referralCode?: string): Promise<GoogleUserData> {
    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);

    const isNewUser = !userSnap.exists();
    const finalReferral = referralCode?.trim() || '';

    const userData = {
      fullName: user.displayName || '',
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
      // Google Sign In specific fields
      googleUserId: user.uid,
      signInMethod: 'google'
    };

    if (isNewUser) {
      console.log('👤 Creating new user with Google Sign In');
      await setDoc(userRef, userData);

      // Handle referral if provided
      if (finalReferral) {
        await this.registerReferral(finalReferral, user.email || '');
      }

      // Send welcome message
      await this.sendWelcomeMessage(user.uid);
    } else {
      console.log('👤 Updating existing user with Google Sign In');
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
        // Update Google-specific fields
        googleUserId: user.uid,
        signInMethod: 'google',
        lastSignIn: serverTimestamp()
      }, { merge: true });
    }

    return {
      uid: user.uid,
      email: user.email,
      fullName: user.displayName,
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
   * Sign out from Google (if needed)
   */
  public async signOut(): Promise<void> {
    try {
      const platform = Capacitor.getPlatform();
      
      if (platform === 'android' || platform === 'ios') {
        // Use Capacitor Firebase Authentication for mobile
        await FirebaseAuthentication.signOut();
        console.log('✅ Google Sign Out via Capacitor Firebase Auth');
      } else {
        // For web, Firebase auth handles sign out
        console.log('✅ Google Sign Out handled by Firebase');
      }
    } catch (error) {
      console.error('❌ Google Sign Out error:', error);
    }
  }
}

export default GoogleSignInService.getInstance();