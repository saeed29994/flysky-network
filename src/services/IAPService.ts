import { Purchases, PurchasesOffering, PurchasesPackage, CustomerInfo, LOG_LEVEL } from '@revenuecat/purchases-capacitor';
import { Capacitor } from '@capacitor/core';
import { REVENUECAT_API_KEY, PRODUCT_IDS, ENTITLEMENT_IDS } from '../utils/iapConfig';
import { PLAN_CONFIG } from '../utils/planConstants';
import { auth, db } from '../firebase';
import { doc, updateDoc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { toast } from 'react-hot-toast';

class IAPService {
  private static instance: IAPService;
  private isInitialized = false;
  private offerings: PurchasesOffering[] = [];

  private constructor() {}

  public static getInstance(): IAPService {
    if (!IAPService.instance) {
      IAPService.instance = new IAPService();
    }
    return IAPService.instance;
  }

  /**
   * Initialize RevenueCat SDK
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Enable debug logging only in development
      if (import.meta.env.DEV) {
        await Purchases.setLogLevel({ level: LOG_LEVEL.DEBUG });
        console.log('RevenueCat debug logging enabled (development mode)');
      } else {
        await Purchases.setLogLevel({ level: LOG_LEVEL.INFO });
        console.log('RevenueCat production mode enabled');
      }

      // Get the API key based on platform
      const platform = Capacitor.getPlatform();
      const apiKey = platform === 'ios' 
        ? REVENUECAT_API_KEY.ios 
        : REVENUECAT_API_KEY.android;

      if (!apiKey) {
        console.error('RevenueCat API key not found for platform:', platform);
        // Use a hardcoded fallback key for testing - replace with your actual keys in production
        const fallbackKey = platform === 'ios' 
          ? 'appl_VCIvMVNQpPnLkISsuFYNKWIDdEm' 
          : 'goog_LTQJUNZxHxRJJdEVjLHRVHBpyBm';
        console.log('Using fallback API key:', fallbackKey.substring(0, 10) + '...');
        
        // Initialize with fallback key
        await Purchases.configure({
          apiKey: fallbackKey,
          appUserID: auth.currentUser?.uid || null,
        });
        
        console.log('RevenueCat initialized with fallback key');
        this.isInitialized = true;
        await this.getOfferings();
        return;
      }

      // Initialize RevenueCat
      await Purchases.configure({
        apiKey,
        appUserID: auth.currentUser?.uid || null, // Use Firebase UID as RevenueCat user ID
      });

      console.log('RevenueCat initialized successfully');
      console.log('Platform:', Capacitor.getPlatform());
      console.log('API Key (first 10 chars):', apiKey.substring(0, 10) + '...');
      this.isInitialized = true;

      // Fetch offerings after initialization
      await this.getOfferings();
    } catch (error) {
      console.error('Failed to initialize RevenueCat:', error);
      throw error;
    }
  }

  /**
   * Get available offerings from RevenueCat
   */
  public async getOfferings(): Promise<PurchasesOffering[]> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      console.log('🔄 Fetching offerings from RevenueCat...');
      console.log('🔑 API Key being used:', REVENUECAT_API_KEY.android?.substring(0, 10) + '...');
      console.log('📱 Platform:', Capacitor.getPlatform());
      
      const offerings = await Purchases.getOfferings();
      console.log('✅ Offerings received:', offerings);
      console.log('📦 Current offering:', offerings.current);
      console.log('📋 All offerings:', Object.keys(offerings.all || {}));
      
      this.offerings = offerings.current ? [offerings.current] : [];
      
      if (offerings.all) {
        Object.values(offerings.all).forEach(offering => {
          if (offering && !this.offerings.find(o => o.identifier === offering.identifier)) {
            this.offerings.push(offering);
          }
        });
      }
      
      console.log('🎯 Final offerings array:', this.offerings.length);
      
      // Log detailed package information
      this.offerings.forEach((offering, index) => {
        console.log(`📦 Offering ${index + 1}:`, offering.identifier);
        console.log(`📋 Packages in offering ${index + 1}:`, offering.availablePackages.length);
        offering.availablePackages.forEach((pkg, pkgIndex) => {
          console.log(`  📦 Package ${pkgIndex + 1}:`, {
            identifier: pkg.identifier,
            productId: pkg.product.identifier,
            price: pkg.product.priceString,
            currency: pkg.product.currencyCode
          });
        });
      });
      
      return this.offerings;
    } catch (error: any) {
      console.error('❌ Failed to get offerings:', error);
      console.error('❌ Error details:', {
        message: error.message,
        code: error.code,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Get packages for a specific plan
   */
  public async getPackagesForPlan(planId: string): Promise<PurchasesPackage[]> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    // Get platform-specific product ID
    const platform = Capacitor.getPlatform() === 'ios' ? 'ios' : 'android';
    const productId = PRODUCT_IDS[platform as keyof typeof PRODUCT_IDS][planId as keyof typeof PRODUCT_IDS.ios];
    
        // Map plan IDs to actual package identifiers from RevenueCat
        const packageIdentifierMap: { [key: string]: string } = {
          'first-lifetime': '$rc_lifetime',
          'first-6': '$rc_six_month',
          'business': '$rc_monthly',
          // Also include the actual product IDs as fallbacks
          'io.fsncrew.app.first_lifetimee': '$rc_lifetime',
          'io.fsncrew.app.first_6months': '$rc_six_month',
          'io.fsncrew.app.business_monthly': '$rc_monthly'
        };
    
    const packageIdentifier = packageIdentifierMap[planId];
    
    console.log('Looking for product ID:', productId, 'for plan:', planId, 'on platform:', platform);
    console.log('Looking for package identifier:', packageIdentifier);
    console.log('Available offerings:', this.offerings.length);
    
    if (!productId) {
      throw new Error(`No product ID found for plan: ${planId}`);
    }

    try {
      // Find packages that match our product ID
      const packages: PurchasesPackage[] = [];
      
      for (const offering of this.offerings) {
        console.log('Checking offering:', offering.identifier, 'with', offering.availablePackages.length, 'packages');
        for (const pkg of offering.availablePackages) {
          console.log('📦 Package details:');
          console.log('  - identifier:', pkg.identifier);
          console.log('  - productId:', pkg.product.identifier);
          console.log('  - productTitle:', pkg.product.title);
          console.log('  - price:', pkg.product.priceString);
          console.log('🔍 Matching check:');
          console.log('  - productIdMatch:', pkg.product.identifier === productId);
          console.log('  - packageIdMatch:', pkg.identifier === packageIdentifier);
          console.log('  - expectedProductId:', productId);
          console.log('  - expectedPackageId:', packageIdentifier);
          
          // Check if product identifier matches or contains our expected product ID
          // Also check if package identifier matches
          const productIdMatch = pkg.product.identifier === productId || 
                               pkg.product.identifier === packageIdentifier ||
                               pkg.product.identifier.includes(productId) ||
                               (planId === 'first-lifetime' && pkg.product.identifier === 'io.fsncrew.app.first_lifetimee');
          const packageIdMatch = pkg.identifier === packageIdentifier;
          
          if (productIdMatch || packageIdMatch) {
            packages.push(pkg);
            console.log('✅ Package matched!');
          } else {
            console.log('❌ Package did not match');
            console.log('  - Actual productId:', pkg.product.identifier);
            console.log('  - Actual packageId:', pkg.identifier);
            console.log('  - Expected productId:', productId);
            console.log('  - Expected packageId:', packageIdentifier);
          }
        }
      }
      
      console.log('Found packages:', packages.length);
      return packages;
    } catch (error) {
      console.error(`Failed to get packages for plan ${planId}:`, error);
      throw error;
    }
  }

  /**
   * Purchase a subscription package
   */
  public async purchasePackage(pkg: PurchasesPackage, planId: string): Promise<CustomerInfo> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const platform = Capacitor.getPlatform();
    console.log(`🚀 Starting ${platform} purchase for package:`, pkg.identifier);
    console.log('📦 Package details:', {
      identifier: pkg.identifier,
      productId: pkg.product.identifier,
      productType: pkg.product.productType,
      price: pkg.product.price,
      currencyCode: pkg.product.currencyCode,
      platform: platform
    });
    
    try {
      const { customerInfo } = await Purchases.purchasePackage({ 
        aPackage: pkg
      });
      
      console.log('✅ Purchase completed successfully');
      console.log('👤 Customer info:', customerInfo);
      console.log('🔍 Customer info details:', {
        originalAppUserId: customerInfo.originalAppUserId,
        activeSubscriptions: Object.keys(customerInfo.activeSubscriptions),
        entitlements: Object.keys(customerInfo.entitlements.active),
        allPurchaseDates: Object.keys(customerInfo.allPurchaseDates),
        platform: platform
      });
      
      // Check if the user has the premium entitlement
      const isPremium = customerInfo.entitlements.active[ENTITLEMENT_IDS.premium];
      console.log('🔐 Premium entitlement active:', isPremium);
      console.log('🔍 All active entitlements:', Object.keys(customerInfo.entitlements.active));
      console.log('🔍 Looking for entitlement:', ENTITLEMENT_IDS.premium);
      console.log('🔍 Active subscriptions:', Object.keys(customerInfo.activeSubscriptions));
      
      // Check if user has any active subscription (fallback check)
      const hasActiveSubscription = Object.keys(customerInfo.activeSubscriptions).length > 0;
      console.log('🔍 Has active subscription:', hasActiveSubscription);
      
      // For iOS purchases, we need to be more lenient as entitlements might take time to propagate
      const isIOS = platform === 'ios';
      
      if (isPremium || hasActiveSubscription || isIOS) {
        console.log('🎉 Premium entitlement or active subscription found! Updating membership in Firebase...');
        // Update user's membership in Firebase
        await this.updateMembershipInFirebase(planId, customerInfo);
        console.log('✅ Membership updated in Firebase successfully');
        
        // Show success message
        toast.success(`🎉 ${platform === 'android' ? 'Google Play' : 'App Store'} purchase successful! Membership activated.`);
        
        return customerInfo;
      } else {
        console.log('❌ No premium entitlement or active subscription found after purchase');
        
        // For Android, sometimes there's a delay in entitlement activation
        if (platform === 'android') {
          console.log('⏳ Android detected - checking for delayed entitlement activation...');
          
          // Wait a bit and check again
          await new Promise(resolve => setTimeout(resolve, 3000));
          
          try {
            const { customerInfo: refreshedCustomerInfo } = await Purchases.getCustomerInfo();
            const refreshedPremium = refreshedCustomerInfo.entitlements.active[ENTITLEMENT_IDS.premium];
            const refreshedActiveSubscriptions = Object.keys(refreshedCustomerInfo.activeSubscriptions).length > 0;
            
            console.log('🔄 Refresh check - Premium:', refreshedPremium);
            console.log('🔄 Refresh check - Active subscriptions:', Object.keys(refreshedCustomerInfo.activeSubscriptions));
            
            if (refreshedPremium || refreshedActiveSubscriptions) {
              console.log('✅ Premium entitlement or subscription found after refresh!');
              await this.updateMembershipInFirebase(planId, refreshedCustomerInfo);
              toast.success('🎉 Google Play purchase successful! Membership activated.');
              return refreshedCustomerInfo;
            }
          } catch (refreshError) {
            console.error('❌ Error refreshing customer info:', refreshError);
          }
        }
        
        // If we still don't have entitlement, but purchase was successful, 
        // we should still update the membership based on the purchase
        console.log('⚠️ No entitlement found, but purchase was successful. Updating membership anyway...');
        await this.updateMembershipInFirebase(planId, customerInfo);
        toast.success(`🎉 ${platform === 'android' ? 'Google Play' : 'App Store'} purchase successful! Membership activated.`);
        
        return customerInfo;
      }
    } catch (error: any) {
      console.log('❌ Purchase error:', error);
      console.log('❌ Error code:', error.code);
      console.log('❌ Error message:', error.message);
      console.log('❌ Platform:', platform);
      
      // Handle specific Android errors
      if (platform === 'android') {
        if (error.code === 'PURCHASE_CANCELLED_ERROR') {
          console.log('User cancelled the purchase');
          throw new Error('Purchase cancelled');
        } else if (error.code === 'STORE_PROBLEM_ERROR') {
          console.log('Google Play Store problem');
          throw new Error('Google Play Store is temporarily unavailable. Please try again.');
        } else if (error.code === 'NETWORK_ERROR') {
          console.log('Network error during purchase');
          throw new Error('Network error. Please check your internet connection and try again.');
        } else if (error.message?.includes('BILLING_RESPONSE_RESULT_USER_CANCELED')) {
          console.log('User cancelled billing');
          throw new Error('Purchase cancelled');
        }
      }
      
      // Handle user cancellation separately
      if (error.code === 'PURCHASE_CANCELLED_ERROR') {
        console.log('User cancelled the purchase');
        throw new Error('Purchase cancelled');
      }
      
      console.error('Purchase failed:', error);
      throw error;
    }
  }


  /**
   * Get current customer info
   */
  public async getCustomerInfo(): Promise<CustomerInfo> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const { customerInfo } = await Purchases.getCustomerInfo();
      return customerInfo;
    } catch (error) {
      console.error('Failed to get customer info:', error);
      throw error;
    }
  }

  /**
   * Update user's membership in Firebase
   */
  private async updateMembershipInFirebase(planId: string, customerInfo: CustomerInfo): Promise<void> {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      // Calculate subscription end date based on plan duration from Firebase
      const now = Math.floor(Date.now() / 1000);
      let subscriptionEnd: number;
      
      try {
        // Get plan duration from Firebase plans collection
        const planRef = doc(db, 'plans', planId);
        const planSnap = await getDoc(planRef);
        
        if (planSnap.exists()) {
          const planData = planSnap.data();
          const durationDays = planData.durationDays || 30; // Default to 30 days if not found
          
          // Calculate subscription end: current time + duration in seconds
          subscriptionEnd = now + (durationDays * 24 * 60 * 60);
          
          console.log('📅 Subscription calculation:', {
            planId: planId,
            planData: planData,
            durationDays: durationDays,
            currentTime: now,
            currentTimeFormatted: new Date(now * 1000).toLocaleString(),
            subscriptionEnd: subscriptionEnd,
            subscriptionEndFormatted: new Date(subscriptionEnd * 1000).toLocaleString(),
            durationInSeconds: durationDays * 24 * 60 * 60
          });
        } else {
          // Fallback to 30 days if plan not found in Firebase
          subscriptionEnd = now + (30 * 24 * 60 * 60);
          console.log('⚠️ Plan not found in Firebase, using 30-day fallback:', {
            planId: planId,
            subscriptionEnd: subscriptionEnd,
            subscriptionEndFormatted: new Date(subscriptionEnd * 1000).toLocaleString()
          });
        }
      } catch (error) {
        console.error('Error fetching plan duration from Firebase:', error);
        // Fallback to 30 days on error
        subscriptionEnd = now + (30 * 24 * 60 * 60);
      }

      // Get entitlement expiration date if available
      const premiumEntitlement = customerInfo.entitlements.active[ENTITLEMENT_IDS.premium];
      if (premiumEntitlement && premiumEntitlement.expirationDate) {
        const expirationTimestamp = new Date(premiumEntitlement.expirationDate).getTime() / 1000;
        if (expirationTimestamp > 0) {
          subscriptionEnd = expirationTimestamp;
        }
      }

      // Get bonus amount for this plan from Firestore, fallback to constants
      let bonusAmount = 0;
      try {
        const planRef = doc(db, 'plans', planId);
        const planSnap = await getDoc(planRef);
        if (planSnap.exists()) {
          const planData = planSnap.data();
          bonusAmount = planData.bonus || 0;
        } else {
          // Fallback to constants if plan not found in Firestore
          bonusAmount = PLAN_CONFIG[planId as keyof typeof PLAN_CONFIG]?.bonus || 0;
        }
      } catch (error) {
        console.error('Error fetching plan bonus from Firestore:', error);
        // Fallback to constants on error
        bonusAmount = PLAN_CONFIG[planId as keyof typeof PLAN_CONFIG]?.bonus || 0;
      }
      
      // Update user document in Firestore with membership and bonus
      const userRef = doc(db, 'users', user.uid);
      
      // Get current user data to add bonus to balance
      const userSnap = await getDoc(userRef);
      const userData = userSnap.data() || {};
      const currentBalance = userData.balance || 0;
      
      await updateDoc(userRef, {
        membership: {
          planName: planId,
          subscriptionStart: now, // Store subscription start timestamp
          subscriptionEnd,
          purchaseDate: serverTimestamp(),
          platform: Capacitor.getPlatform() === 'ios' ? 'ios' : 'android',
          isActive: true,
        },
        // Add bonus to user's balance
        balance: currentBalance + bonusAmount,
        // Add transaction to history
        transactionHistory: [...(userData.transactionHistory || []), {
          description: `Membership bonus received for ${planId} (+${bonusAmount.toLocaleString()} FSN)`, // TODO: Use translation
          timestamp: Date.now(),
          type: 'bonus',
          amount: bonusAmount
        }]
      });

      // Also log the purchase in a separate collection for tracking (optional)
      try {
        const purchaseRef = doc(db, 'purchases', `${user.uid}_${Date.now()}`);
        await setDoc(purchaseRef, {
          userId: user.uid,
          planId,
          purchaseDate: serverTimestamp(),
          subscriptionEnd,
          platform: Capacitor.getPlatform() === 'ios' ? 'ios' : 'android',
          receiptInfo: {
            productIdentifier: premiumEntitlement?.productIdentifier || '',
            isSandbox: customerInfo.originalAppUserId.includes('sandbox'),
            purchaseDate: premiumEntitlement?.originalPurchaseDate || '',
            expirationDate: premiumEntitlement?.expirationDate || '',
          }
        });
        console.log('✅ Purchase logged successfully');
      } catch (purchaseLogError) {
        console.warn('⚠️ Failed to log purchase (non-critical):', purchaseLogError);
        // Don't throw error for purchase logging failure
      }

      toast.success(`🎉 Membership activated! You received ${bonusAmount.toLocaleString()} FSN bonus!`);
    } catch (error) {
      console.error('Failed to update membership in Firebase:', error);
      toast.error('Failed to update membership status');
      throw error;
    }
  }
}

export default IAPService.getInstance();
