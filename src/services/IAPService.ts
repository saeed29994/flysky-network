import { Purchases, PurchasesOffering, PurchasesPackage, CustomerInfo, LOG_LEVEL } from '@revenuecat/purchases-capacitor';
import { Capacitor } from '@capacitor/core';
import { REVENUECAT_API_KEY, PRODUCT_IDS, ENTITLEMENT_IDS, PLAN_SUBSCRIPTION_TYPE } from '../utils/iapConfig';
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
      const apiKey = Capacitor.getPlatform() === 'ios' 
        ? REVENUECAT_API_KEY.ios 
        : REVENUECAT_API_KEY.android;

      if (!apiKey) {
        throw new Error('RevenueCat API key not found. Please check your environment variables.');
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
          'first-6': 'io.fsncrew.app.first_6months:firsclass-6',
          'business': '$rc_monthly'
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
                                pkg.product.identifier.includes(productId);
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

    try {
      console.log('🚀 Starting purchase for package:', pkg.identifier);
      console.log('📦 Package details:', {
        identifier: pkg.identifier,
        productId: pkg.product.identifier,
        productType: pkg.product.productType,
        price: pkg.product.price,
        currencyCode: pkg.product.currencyCode
      });
      
      const { customerInfo } = await Purchases.purchasePackage({ 
        aPackage: pkg
      });
      
      console.log('✅ Purchase completed successfully');
      console.log('👤 Customer info:', customerInfo);
      
      // Check if the user has the premium entitlement
      const isPremium = customerInfo.entitlements.active[ENTITLEMENT_IDS.premium];
      console.log('🔐 Premium entitlement active:', isPremium);
      
      if (isPremium) {
        console.log('🎉 Updating membership in Firebase...');
        // Update user's membership in Firebase
        await this.updateMembershipInFirebase(planId, customerInfo);
        console.log('✅ Membership updated in Firebase');
        return customerInfo;
      } else {
        console.log('❌ Premium entitlement not found after purchase');
        throw new Error('Purchase completed but premium entitlement not found');
      }
    } catch (error: any) {
      console.log('❌ Purchase error:', error);
      console.log('❌ Error code:', error.code);
      console.log('❌ Error message:', error.message);
      
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
   * Restore purchases
   */
  public async restorePurchases(): Promise<CustomerInfo> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const { customerInfo } = await Purchases.restorePurchases();
      
      // Check if the user has the premium entitlement
      const isPremium = customerInfo.entitlements.active[ENTITLEMENT_IDS.premium];
      
      if (isPremium) {
        // Find the plan ID from the product identifier
        const platform = Capacitor.getPlatform() === 'ios' ? 'ios' : 'android';
        const productIds = PRODUCT_IDS[platform as keyof typeof PRODUCT_IDS];
        let restoredPlanId: string | null = null;
        
        for (const [planId, productId] of Object.entries(productIds)) {
          const activeEntitlement = Object.values(customerInfo.entitlements.active).find(
            (entitlement: any) => entitlement.productIdentifier === productId
          );
          
          if (activeEntitlement) {
            restoredPlanId = planId;
            break;
          }
        }
        
        if (restoredPlanId) {
          // Update user's membership in Firebase
          await this.updateMembershipInFirebase(restoredPlanId, customerInfo);
          toast.success('Your purchases have been restored!');
          return customerInfo;
        }
      }
      
      toast.error('No purchases to restore');
      throw new Error('No purchases to restore');
    } catch (error) {
      console.error('Restore purchases failed:', error);
      toast.error('Failed to restore purchases');
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
      // Calculate subscription end date based on plan type
      const now = Math.floor(Date.now() / 1000);
      let subscriptionEnd: number;
      
      switch (PLAN_SUBSCRIPTION_TYPE[planId as keyof typeof PLAN_SUBSCRIPTION_TYPE]) {
        case 'lifetime':
          // Set a very far future date for lifetime (10 years)
          subscriptionEnd = now + (10 * 365 * 24 * 60 * 60);
          break;
        case 'six_months':
          // 6 months in seconds
          subscriptionEnd = now + (6 * 30 * 24 * 60 * 60);
          break;
        case 'monthly':
          // 1 month in seconds
          subscriptionEnd = now + (30 * 24 * 60 * 60);
          break;
        default:
          // Default to 1 month
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

      // Also log the purchase in a separate collection for tracking
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

      toast.success(`🎉 Membership activated! You received ${bonusAmount.toLocaleString()} FSN bonus!`);
    } catch (error) {
      console.error('Failed to update membership in Firebase:', error);
      toast.error('Failed to update membership status');
      throw error;
    }
  }
}

export default IAPService.getInstance();
