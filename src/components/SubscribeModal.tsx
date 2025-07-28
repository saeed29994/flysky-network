import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { getPlanBonus, getPlanFeatures, getPlanPrice, PLAN_CONFIG, PlanType } from '../utils/planConstants';
import { 
  CreditCard, 
  CheckCircle, 
  X, 
  ShoppingCart,
  DollarSign,
  Gift,
  Zap,
  Crown,
  Star,
  Lock
} from 'lucide-react';

interface Props {
  planId: string;
  price: string;
  onClose: () => void;
}

const SubscribeModal: React.FC<Props> = ({ planId, onClose }) => {
  const { t } = useTranslation();

  // Get plan details from constants
  const planDetails = PLAN_CONFIG[planId as PlanType];
  const bonus = getPlanBonus(planId);
  const features = getPlanFeatures(planId);
  const planPrice = getPlanPrice(planId);

  // Remove unused useEffect that fetches plan data

  // const handlePurchase = async () => {
  //   setLoading(true);
    
  //   try {
  //     // TODO: Integrate with Google Play Billing / Apple In-App Purchases
  //     // This is where the actual billing integration will happen
      
  //     // For now, simulate a successful purchase
  //     await new Promise(resolve => setTimeout(resolve, 2000));
      
  //     // Update user data after successful purchase
  //     const user = auth.currentUser;
  //     if (user) {
  //       const userRef = doc(db, 'users', user.uid);
  //       const subscriptionDuration = plan?.duration || (30 * 24 * 60 * 60); // 30 days default

  //       await updateDoc(userRef, {
  //         'membership.planName': planId,
  //         'membership.subscriptionEnd': Math.floor(Date.now() / 1000) + subscriptionDuration,
  //         'membership.purchaseDate': Date.now(),
  //         'membership.paymentMethod': 'in_app_purchase',
  //         balance: increment(bonus),
  //       });

  //       // Add to inbox
  //       const inboxRef = collection(db, 'users', user.uid, 'inbox');
  //       await addDoc(inboxRef, {
  //         title: t('subscriptionBonusTitle'),
  //         body: t('subscriptionBonusBody', {
  //           amount: bonus,
  //           plan: planDetails?.name || planId,
  //         }),
  //         amount: bonus,
  //         claimed: false,
  //         read: false,
  //         timestamp: Date.now(),
  //         type: 'subscription_bonus',
  //       });

  //       toast.success(t('subscriptionBonusToast', { amount: bonus }));
  //     }

  //     setShowConfirmation(true);
      
  //     setTimeout(() => {
  //       setShowConfirmation(false);
  //       onClose();
  //     }, 3000);
      
  //   } catch (error) {
  //     console.error('Purchase error:', error);
  //     toast.error(t('purchaseFailed'));
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const handlePurchase = () => {
    toast.success('Payment Integration Coming Soon');
  };

  const getPlanIcon = () => {
    switch (planId) {
      case 'business': return <Crown className="w-5 h-5" />;
      case 'first-6': return <Star className="w-5 h-5" />;
      case 'first-lifetime': return <Zap className="w-5 h-5" />;
      default: return <Gift className="w-5 h-5" />;
    }
  };

  const getPlanColor = () => {
    switch (planId) {
      case 'business': return 'from-purple-500 to-pink-500';
      case 'first-6': return 'from-blue-500 to-cyan-500';
      case 'first-lifetime': return 'from-yellow-500 to-orange-500';
      default: return 'from-green-500 to-emerald-500';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white text-black p-6 rounded-2xl w-full max-w-sm shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button 
          onClick={onClose} 
          className="absolute top-3 right-3 text-gray-500 hover:text-black transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-4">
          <div className={`w-12 h-12 bg-gradient-to-r ${getPlanColor()} rounded-xl flex items-center justify-center mx-auto mb-3`}>
            {getPlanIcon()}
          </div>
          <h2 className="text-lg font-bold mb-1">{t('subscribeToPlan')}</h2>
          <p className="text-gray-600 text-sm">Secure in-app purchase</p>
        </div>

        {/* Plan Summary */}
        <div className="bg-gray-50 rounded-xl p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-semibold text-sm text-gray-800">{planDetails?.name || planId}</h3>
              <p className="text-xs text-gray-500">{planDetails?.priceLabel || 'Premium Plan'}</p>
            </div>
            <div className="text-right">
              <div className="text-xl font-bold text-blue-600">${planPrice}</div>
              <div className="text-xs text-gray-500">{planId === 'first-lifetime' ? 'Lifetime' : t('oneTimePayment')}</div>
            </div>
          </div>
          
          <div className="bg-blue-50 rounded-lg p-3 mb-3">
            <div className="flex items-center gap-2 mb-1">
              <Gift className="w-4 h-4 text-blue-600" />
              <span className="font-semibold text-blue-800 text-sm">{t('bonus')}</span>
            </div>
            <div className="text-lg font-bold text-blue-600">{bonus.toLocaleString()} FSN</div>
          </div>

          {/* Key Features - Dynamic */}
          <div className="space-y-1">
            <h4 className="font-semibold text-gray-800 text-sm mb-2">{t('planFeatures')}:</h4>
            {features.slice(0, 3).map((feature, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" />
                <span className="text-xs text-gray-700">{t(`feature.${feature}`)}</span>
              </div>
            ))}
            {features.length > 3 && (
              <div className="text-xs text-gray-500 mt-1">
                +{features.length - 3} more features
              </div>
            )}
          </div>
        </div>

        {/* Payment Method */}
        <div className="bg-gray-50 rounded-xl p-3 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <CreditCard className="w-4 h-4 text-gray-600" />
            <span className="font-semibold text-gray-800 text-sm">{t('paymentMethod')}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-white rounded-lg px-2 py-1 border text-xs">
              <DollarSign className="w-3 h-3 text-green-600" />
              <span className="font-medium">{t('inAppPurchase')}</span>
            </div>
            <div className="flex items-center gap-1 bg-white rounded-lg px-2 py-1 border text-xs">
              <Lock className="w-3 h-3 text-blue-600" />
              <span className="font-medium">{t('securePayment')}</span>
            </div>
          </div>
        </div>

        {/* Important Notice - Compact */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
          <div className="flex items-start gap-2">
            <div className="w-4 h-4 bg-yellow-500 rounded-full flex items-center justify-center mt-0.5">
              <span className="text-white text-xs font-bold">!</span>
            </div>
            <div>
              <h4 className="font-semibold text-yellow-800 text-sm mb-1">{t('importantNotice')}</h4>
              <p className="text-xs text-yellow-700">
                {t('fsnVirtualCurrency')} {t('fsnUsageDescription')}
              </p>
            </div>
          </div>
        </div>

        {/* Purchase Button */}
        <button
          onClick={handlePurchase}
          disabled={false}
          className={`w-full bg-gradient-to-r ${getPlanColor()} hover:opacity-90 text-white font-bold py-3 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          <ShoppingCart className="w-4 h-4" />
          {t('purchaseNow')} - ${planPrice}
        </button>

        {/* Terms */}
        <p className="text-xs text-gray-500 text-center mt-3">
          {t('purchaseTerms')}
        </p>
      </div>
    </div>
  );
};

export default SubscribeModal;
