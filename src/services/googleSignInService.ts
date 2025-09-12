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
      console.log('🔍 Capacitor available:', !!Capacitor);
      console.log('🔍 FirebaseAuthentication available:', !!FirebaseAuthentication);
      
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Google Sign In timeout after 30 seconds')), 30000);
      });
      
      const signInPromise = this.performSignIn(referralCode);
      
      return await Promise.race([signInPromise, timeoutPromise]);
    } catch (error: any) {
      console.error('❌ Google Sign In error:', error);
      
      return {
        success: false,
        error: error.message || 'Google Sign In failed'
      };
    }
  }

  private async performSignIn(referralCode?: string): Promise<GoogleSignInResult> {
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
        
        // For Android, if native auth fails, show proper error message
        if (platform === 'android') {
          throw new Error('Google Sign-In is not properly configured for Android. Please contact support.');
        }
        
        throw capacitorError;
      }
    } else {
      // Web platform - use standard popup
      console.log(`🌐 Using web Google Sign In approach for ${platform}`);
      const provider = new GoogleAuthProvider();
      provider.addScope('email');
      provider.addScope('profile');
      
      userCredential = await signInWithPopup(auth, provider);
      console.log('✅ Web popup sign-in successful');
    }

    const user = userCredential.user;
    console.log('✅ Google Sign In successful:', user.uid);
    console.log('🔍 Google Sign In - User details:', {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      emailVerified: user.emailVerified,
      providerData: user.providerData.map(p => ({ providerId: p.providerId, uid: p.uid }))
    });

    // Handle user data creation/update
    console.log('🔍 Starting user data handling...');
    await this.handleUserData(user, referralCode);
    console.log('✅ User data handling completed');

    // Request notification permission
    console.log('🔍 Starting notification permission request...');
    await requestPermissionAndToken(user.uid);
    console.log('✅ Notification permission request completed');

    console.log('🔍 Google Sign In - Returning success result');
    return {
      success: true,
      user: user
    };
  }

  /**
   * Handle user data creation and updates
   */
  private async handleUserData(user: User, referralCode?: string): Promise<GoogleUserData> {
    console.log('🔍 handleUserData: Starting user data processing for:', user.uid);
    
    const userRef = doc(db, 'users', user.uid);
    console.log('🔍 handleUserData: Getting user document from Firestore...');
    const userSnap = await getDoc(userRef);
    console.log('🔍 handleUserData: User document exists:', userSnap.exists());

    const isNewUser = !userSnap.exists();
    const finalReferral = referralCode?.trim() || '';
    console.log('🔍 handleUserData: isNewUser:', isNewUser, 'referralCode:', finalReferral);

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
      console.log('🔍 handleUserData: Setting user document...');
      await setDoc(userRef, userData);
      console.log('✅ handleUserData: User document created');

      // Handle referral if provided
      if (finalReferral) {
        console.log('🔍 handleUserData: Processing referral...');
        await this.registerReferral(finalReferral, user.email || '');
        console.log('✅ handleUserData: Referral processed');
      }

      // Send welcome message
      console.log('🔍 handleUserData: Sending welcome message...');
      await this.sendWelcomeMessage(user.uid);
      console.log('✅ handleUserData: Welcome message sent');
    } else {
      console.log('👤 Updating existing user with Google Sign In');
      console.log('🔍 handleUserData: Updating user document...');
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
      console.log('✅ handleUserData: User document updated');
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
      console.log('🔍 registerReferral: Starting referral registration for code:', referredCode);
      
      const q = query(collection(db, 'users'), where('referralCode', '==', referredCode));
      console.log('🔍 registerReferral: Executing Firestore query...');
      const querySnapshot = await getDocs(q);
      console.log('🔍 registerReferral: Query completed, results:', querySnapshot.size);

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
      console.log('🔍 sendWelcomeMessage: Starting welcome message creation for:', uid);
      const inboxRef = doc(db, 'users', uid, 'inbox', 'welcome');
      console.log('🔍 sendWelcomeMessage: Checking if welcome message exists...');
      const inboxSnap = await getDoc(inboxRef);
      console.log('🔍 sendWelcomeMessage: Welcome message exists:', inboxSnap.exists());

      if (!inboxSnap.exists()) {
        console.log('🔍 sendWelcomeMessage: Creating welcome message...');
        await setDoc(inboxRef, {
          title: 'Welcome to FlySky Network!',
          body: 'Welcome! You received 500 FSN as a welcome bonus!',
          timestamp: Date.now(),
          read: false,
          claimed: false,
          amount: 500,
          type: 'welcome_bonus',
        });
        console.log('✅ sendWelcomeMessage: Welcome message added to inbox');
      } else {
        console.log('🔍 sendWelcomeMessage: Welcome message already exists, skipping');
      }
    } catch (error) {
      console.error('❌ sendWelcomeMessage: Failed to send welcome message:', error);
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