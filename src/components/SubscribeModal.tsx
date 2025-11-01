import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { useState, useEffect } from 'react';
import { getPlanBonus, getPlanFeatures, getPlanPrice, PLAN_CONFIG, PlanType } from '../utils/planConstants';
import { PurchasesPackage } from '@revenuecat/purchases-capacitor';
import IAPService from '../services/IAPService';
import { 
  CheckCircle, 
  X, 
  ShoppingCart,
  Gift,
  Zap,
  Crown,
  Star,
  RotateCcw,
} from 'lucide-react';

interface Props {
  planId: string;
  price: string;
  bonus?: number;
  features?: string[];
  onClose: () => void;
}

const SubscribeModal: React.FC<Props> = ({ planId, price, bonus, features, onClose }) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [, setError] = useState<string | null>(null);
  
  // console.log(error);

  // Get plan details from constants as fallback
  const planDetails = PLAN_CONFIG[planId as PlanType];
  const actualBonus = bonus || getPlanBonus(planId);
  const actualFeatures = features || getPlanFeatures(planId);
  const planPrice = parseFloat(price) || getPlanPrice(planId);

  // Initialize IAP and fetch packages
  useEffect(() => {
    const initIAP = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Initialize IAP service
        await IAPService.initialize();
        
        // Get packages for this plan
        const pkgs = await IAPService.getPackagesForPlan(planId);
        
        if (pkgs.length === 0) {
          setError('No purchase options available for this plan.');
          return;
        }
        
        setPackages(pkgs);
        
      } catch (err: any) {
        console.error('Failed to initialize IAP:', err);
        
        // Provide more specific error messages based on the error type
        if (err.message?.includes('API key')) {
          setError('Payment service configuration error. Please contact support.');
        } else if (err.message?.includes('Network')) {
          setError('Network error. Please check your internet connection and try again.');
        } else if (err.message?.includes('offerings')) {
          setError('Unable to load subscription options. Please try again later.');
        } else if (err.message?.includes('No packages found')) {
          setError('This subscription plan is not available. Please try a different plan.');
        } else if (err.message?.includes('No product ID found')) {
          setError('Subscription configuration error. Please contact support.');
        } else {
          setError('Failed to load purchase options. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    };

    initIAP();
  }, [planId]);

  const handlePurchase = async () => {
    if (packages.length === 0) {
      toast.error('No purchase options available');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Use the first package for this plan
      await IAPService.purchasePackage(packages[0], planId);
      
      // Close modal on successful purchase
      onClose();
      
    } catch (err: any) {
      console.error('Purchase failed:', err);
      
      // Don't show error for user cancellation
      if (err.message === 'Purchase cancelled') {
        return;
      }
      
      // Show error message
      setError('Purchase failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRestorePurchases = async () => {
    try {
      setLoading(true);
      setError(null);
      
      await IAPService.restorePurchases();
      
      // Close modal on successful restore
      onClose();
      
    } catch (err: any) {
      console.error('Restore failed:', err);
      setError(err.message || 'Failed to restore purchases. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  

  const getPlanIcon = () => {
    switch (planId) {
      case 'business': return <Crown className="w-6 h-6" />;
      case 'first-6': return <Star className="w-6 h-6" />;
      case 'first-lifetime': return <Zap className="w-6 h-6" />;
      default: return <Gift className="w-6 h-6" />;
    }
  };

  const getPlanColor = () => {
    return planDetails?.color || 'from-gray-500 to-gray-600';
  };

  const getPlanDuration = () => {
    switch (planId) {
      case 'business': return 'Monthly';
      case 'first-6': return '6 Months';
      case 'first-lifetime': return 'Lifetime';
      default: return 'One-time';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white text-black p-4 sm:p-6 rounded-2xl w-full max-w-sm sm:max-w-md lg:max-w-lg shadow-2xl relative max-h-[95vh] overflow-y-auto">
        <button 
          onClick={onClose} 
          className="absolute top-3 right-3 sm:top-4 sm:right-4 text-gray-500 hover:text-black transition-colors z-10"
        >
          <X className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-4 sm:mb-6">
          <div className={`w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r ${getPlanColor()} rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-lg`}>
            {getPlanIcon()}
          </div>
          <h2 className="text-lg sm:text-2xl font-bold mb-1 sm:mb-2">{planDetails?.name || planId}</h2>
          <p className="text-sm sm:text-base text-gray-600">{getPlanDuration()}</p>
        </div>

        {/* Plan Summary */}
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl sm:rounded-2xl p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="text-center mb-3 sm:mb-4">
            <div className="text-2xl sm:text-4xl font-bold text-gray-900 mb-1">${planPrice}</div>
            <div className="text-xs sm:text-sm text-gray-600">{planDetails?.priceLabel}</div>
          </div>

          {/* Required Subscription Information for Apple Guidelines */}
          <div className="bg-white/80 rounded-lg p-3 sm:p-4 mb-3 sm:mb-4 border border-gray-200">
            <h4 className="font-semibold text-gray-800 text-sm sm:text-base mb-2 text-center">Subscription Details</h4>
            <div className="space-y-1 text-xs sm:text-sm text-gray-700">
              <div className="flex justify-between">
                <span className="font-medium">Subscription:</span>
                <span>{planDetails?.name || planId}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Duration:</span>
                <span>{getPlanDuration()}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Price:</span>
                <span>${planPrice} USD</span>
              </div>
              {planId !== 'first-lifetime' && (
                <div className="flex justify-between">
                  <span className="font-medium">Auto-renewal:</span>
                  <span>Yes</span>
                </div>
              )}
            </div>
          </div>
          
          {/* Bonus Section */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg sm:rounded-xl p-3 sm:p-4 mb-3 sm:mb-4 border border-blue-200">
            <div className="flex items-center justify-center gap-2 mb-1 sm:mb-2">
              <Gift className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
              <span className="font-bold text-blue-800 text-sm sm:text-base">{t('bonus')}</span>
            </div>
            <div className="text-lg sm:text-2xl font-bold text-blue-600 text-center">{actualBonus.toLocaleString()} FSN</div>
            <div className="text-xs text-blue-600 text-center mt-1">Instant bonus upon purchase</div>
          </div>

          {/* Features */}
          <div className="space-y-2 sm:space-y-3">
            <h4 className="font-bold text-gray-800 text-center mb-2 sm:mb-3 text-sm sm:text-base">What's Included:</h4>
            {actualFeatures.map((feature, idx) => (
              <div key={idx} className="flex items-center gap-2 sm:gap-3">
                <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-500 flex-shrink-0" />
                <span className="text-xs sm:text-sm text-gray-700">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Important Notice */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg sm:rounded-xl p-3 sm:p-4 mb-4 sm:mb-6">
          <div className="flex items-start gap-2 sm:gap-3">
            <div className="w-4 h-4 sm:w-5 sm:h-5 bg-amber-500 rounded-full flex items-center justify-center mt-0.5 flex-shrink-0">
              <span className="text-white text-xs font-bold">!</span>
            </div>
            <div>
              <h4 className="font-semibold text-amber-800 text-xs sm:text-sm mb-1">{t('importantNotice')}</h4>
              <p className="text-xs text-amber-700 leading-relaxed">
                {t('fsnVirtualCurrency')} {t('fsnUsageDescription')}
              </p>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {/* {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-sm text-red-700">
            {error}
          </div>
        )} */}

        {/* Purchase Button */}
        <button
          onClick={handlePurchase}
          disabled={loading || packages.length === 0}
          className={`w-full bg-gradient-to-r ${getPlanColor()} hover:opacity-90 text-white font-bold py-3 sm:py-4 rounded-lg sm:rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center gap-2 sm:gap-3 text-sm sm:text-lg ${(loading || packages.length === 0) ? 'opacity-60 cursor-not-allowed' : ''}`}
        >
          {loading ? (
            <>
              <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              {t('processing')}
            </>
          ) : (
            <>
              <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" />
              {t('purchaseNow')} - ${planPrice}
            </>
          )}
        </button>

        {/* Restore Purchases Button */}
        <button
          onClick={handleRestorePurchases}
          disabled={loading}
          className={`w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 sm:py-3 rounded-lg sm:rounded-xl transition-all duration-300 flex items-center justify-center gap-2 sm:gap-3 text-sm sm:text-base ${loading ? 'opacity-60 cursor-not-allowed' : ''}`}
        >
          <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5" />
          {t('restorePurchases')}
        </button>


        {/* Terms and Links */}
        <div className="text-center mt-3 sm:mt-4">
          <p className="text-xs text-gray-500 leading-relaxed mb-2">
            {t('purchaseTerms')}
          </p>
          <div className="flex justify-center gap-4 text-xs">
            <a 
              href="/terms" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 underline"
            >
              Terms of Use
            </a>
            <a 
              href="/privacy-policy" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 underline"
            >
              Privacy Policy
            </a>
          </div>
        </div>
        
        {/* Platform Notice */}
        {/* <p className="text-xs text-gray-400 text-center mt-2">
          {Capacitor.getPlatform() === 'ios' ? t('purchaseAppleNotice') : t('purchaseGoogleNotice')}
        </p> */}
      </div>
    </div>
  );
};

export default SubscribeModal;
