import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useUserPlan } from '../contexts/UserPlanContext';
import SubscribeModal from '../components/SubscribeModal';
import { getPlanBonus, getPlanPrice, getPlanFeatures } from '../utils/planConstants';
import { motion } from 'framer-motion';
import { 
  Crown, 
  CheckCircle, 
  Calendar,
  ShoppingCart,
  Gift,
} from 'lucide-react';
import { auth, db } from '../firebase';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';

interface Plan {
  id: string;
  price?: number;
  bonus?: number;
  features?: string[];
}

const MembershipPage = () => {
  const { t } = useTranslation();
  const { currentPlan, subscriptionEnd } = useUserPlan();
  const [modalPlan, setModalPlan] = useState<null | { id: string; price: string }>(null);
  const [loading, setLoading] = useState(true);
  const [membershipData, setMembershipData] = useState<any>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const now = Math.floor(Date.now() / 1000);

  // Fetch membership data directly from Firestore
  useEffect(() => {
    const fetchMembershipData = async () => {
      setLoading(true);
      const user = auth.currentUser;
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
          const userData = userSnap.data();
          if (userData.membership) {
            setMembershipData(userData.membership);
          }
        }
      } catch (error) {
        console.error('Error fetching membership data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMembershipData();
  }, []);

  // Fetch plans from Firestore
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const plansCollection = collection(db, 'plans');
        const plansSnapshot = await getDocs(plansCollection);
        const plansData = plansSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Plan[];
        
        if (plansData.length > 0) {
          setPlans(plansData);
        }
      } catch (error) {
        console.error('Error fetching plans:', error);
      }
    };

    fetchPlans();
  }, []);


  // Get user-friendly plan name
  const getPlanDisplayName = (planId: string | null) => {
    if (!planId || planId === 'economy') return t('membershipPage.notSubscribed');
    
    // Handle plan name formatting
    if (planId === 'first-lifetime') return t('planNames.first-lifetime');
    if (planId === 'first-6') return t('planNames.first-6');
    if (planId === 'first') return t('planNames.first-lifetime'); // Legacy handling
    if (planId === 'business') return t('planNames.business');
    
    return planId;
  };

  // Get actual plan from Firestore data first, then fall back to context
  const getActualPlan = () => {
    // First check Firestore data
    if (membershipData && membershipData.planName && membershipData.subscriptionEnd && membershipData.subscriptionEnd > now) {
      return membershipData.planName;
    }
    
    // Fall back to context data
    return currentPlan;
  };

  const actualPlan = getActualPlan();
  const displayPlanName = getPlanDisplayName(actualPlan);
  
  // Get actual subscription end date
  const getActualSubscriptionEnd = () => {
    if (membershipData && membershipData.subscriptionEnd) {
      return membershipData.subscriptionEnd;
    }
    return subscriptionEnd;
  };
  
  const actualSubscriptionEnd = getActualSubscriptionEnd();
  const actualIsExpired = actualSubscriptionEnd ? actualSubscriptionEnd < now : true;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
          <p>{t('loading.membershipData')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 pb-12 pt-8">
        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="w-20 h-20 lg:w-24 lg:h-24 mx-auto mb-6 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-2xl flex items-center justify-center shadow-2xl"
          >
            <Crown className="w-10 h-10 lg:w-12 lg:h-12 text-white" />
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-3xl lg:text-5xl font-bold text-white mb-4 tracking-tight"
          >
            👑 {t('membershipPage.title')}
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-gray-300 text-lg lg:text-xl max-w-3xl mx-auto leading-relaxed"
          >
            {t('membershipPage.description')}
          </motion.p>
        </motion.div>

        {/* Current Plan Status */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-12"
        >
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 shadow-xl p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Crown className="w-6 h-6 text-yellow-400" />
                <span className="text-gray-300">{t('membershipPage.currentPlan')}:</span>
              </div>
              <span className="text-xl font-bold text-white capitalize">
                {displayPlanName}
              </span>
            </div>
            
            {actualSubscriptionEnd && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-300">{t('membershipPage.status')}:</span>
                </div>
                <span className={`font-semibold ${actualIsExpired ? 'text-red-400' : 'text-green-400'}`}>
                  {actualIsExpired ? t('membershipPage.expired') : t('membershipPage.active')} - {new Date(actualSubscriptionEnd * 1000).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>
        </motion.div>

        {/* Membership Plans */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mb-12"
        >
          <div className="text-center mb-8">
            <h2 className="text-2xl lg:text-3xl font-bold text-white mb-4">{t('membershipPage.chooseYourPlan')}</h2>
            <p className="text-gray-400 text-lg">{t('membershipPage.unlockPremiumFeatures')}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {plans.map((plan, index) => {
              // Handle legacy 'first' plan mapping to 'first-lifetime'
              const normalizedCurrentPlan = actualPlan === 'first' ? 'first-lifetime' : actualPlan;
              const isActive = plan.id === normalizedCurrentPlan && !actualIsExpired;
              const bonus = plan.bonus || getPlanBonus(plan.id);
              const price = plan.price || getPlanPrice(plan.id);
              const features = plan.features || getPlanFeatures(plan.id);
              
              const getPlanGradient = () => {
                if (plan.id === 'business') return 'from-green-500 to-emerald-500';
                if (plan.id === 'first-6') return 'from-blue-500 to-cyan-500';
                if (plan.id === 'first-lifetime') return 'from-purple-500 to-pink-500';
                return 'from-gray-500 to-gray-600';
              };

              return (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 + index * 0.1 }}
                  className={`relative overflow-hidden rounded-3xl border transition-all duration-300 hover:scale-105 ${
                    isActive 
                      ? 'border-yellow-400 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 shadow-2xl' 
                      : 'border-white/20 bg-white/10 backdrop-blur-sm shadow-xl hover:shadow-2xl'
                  }`}
                >
                  {isActive && (
                    <div className="absolute top-4 right-4">
                      <div className="bg-yellow-400 text-black px-4 py-2 rounded-full text-sm font-bold shadow-lg">
                        {t('membershipPage.active')}
                      </div>
                    </div>
                  )}

                  <div className="p-8">
                    <div className="text-center mb-8">
                      <div className={`w-20 h-20 bg-gradient-to-r ${getPlanGradient()} rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl`}>
                        <Crown className="w-10 h-10 text-white" />
                      </div>
                      <h3 className="text-3xl font-bold text-white mb-3">{t(`planNames.${plan.id}`)}</h3>
                      <div className="text-4xl font-bold text-yellow-400 mb-2">${price}</div>
                      <div className="text-sm text-gray-400 mb-6">
                        <div className="flex items-center justify-center gap-2">
                          <Gift className="w-4 h-4 text-yellow-400" />
                          <span className="text-yellow-400 font-bold">{bonus.toLocaleString()} FSN</span>
                          <span className="text-gray-400">{t('membershipPage.bonus')}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4 mb-8">
                      {features.map((feature: string, i: number) => (
                        <div key={i} className="flex items-center gap-4">
                          <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0" />
                          <span className="text-gray-300">{t(`feature.${feature}`) || feature}</span>
                        </div>
                      ))}
                    </div>

                    {isActive ? (
                      <button className="w-full bg-green-500 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-3 text-lg shadow-lg" disabled>
                        <CheckCircle className="w-6 h-6" />
                        {t('membershipPage.activated')}
                      </button>
                    ) : (
                      <button
                        className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-black font-bold py-4 rounded-2xl transition-all duration-300 flex items-center justify-center gap-3 text-lg shadow-lg hover:shadow-xl transform hover:scale-105"
                        onClick={() => setModalPlan({ id: plan.id, price: String(price) })}
                      >
                        <ShoppingCart className="w-6 h-6" />
                        {plan.id === normalizedCurrentPlan && actualIsExpired ? t('membershipPage.renew') : t('membershipPage.subscribeNow')}
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>


        {modalPlan && (
          <SubscribeModal planId={String(modalPlan.id)} price={modalPlan.price} onClose={() => setModalPlan(null)} />
        )}
      </div>
    </div>
  );
};

export default MembershipPage;
