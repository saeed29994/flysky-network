import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import SubscribeModal from '../components/SubscribeModal';
import { getPlanBonus, getPlanPrice, getPlanFeatures, PLAN_CONFIG } from '../utils/planConstants';
import { motion } from 'framer-motion';
import { 
  Crown, 
  CheckCircle, 
  Calendar,
  ShoppingCart,
  Gift,
} from 'lucide-react';
import { auth, db } from '../firebase';
import { doc, collection, getDocs, onSnapshot } from 'firebase/firestore';

interface Plan {
  id: string;
  price?: number;
  bonus?: number;
  features?: string[];
}

const MembershipPage = () => {
  const { t } = useTranslation();
  const [modalPlan, setModalPlan] = useState<null | { id: string; price: string; bonus: number; features: string[] }>(null);
  const [loading, setLoading] = useState(true);
  const [membershipData, setMembershipData] = useState<any>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const now = Math.floor(Date.now() / 1000);

  // Real-time membership data listener
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      setLoading(false);
      return;
    }

    // console.log('🔄 Setting up real-time membership listener for user:', user.uid);
    setLoading(true);

    const userRef = doc(db, 'users', user.uid);
    
    // Set up real-time listener for membership updates
    const unsubscribe = onSnapshot(userRef, (userSnap) => {
      try {
        if (userSnap.exists()) {
          const userData = userSnap.data();
          // console.log('📊 Real-time Firebase User Data Update:', {
          //   userId: user.uid,
          //   userData: userData,
          //   membershipData: userData.membership,
          //   hasMembership: !!userData.membership,
          //   timestamp: new Date().toLocaleString()
          // });

          if (userData.membership) {
            setMembershipData(userData.membership);
            // console.log('✅ Real-time membership data updated:', userData.membership);
          } else {
            // console.log('⚠️ No membership data found in user document');
            setMembershipData(null);
          }
        } else {
          // console.log('❌ User document does not exist');
          setMembershipData(null);
        }
      } catch (error) {
        console.error('❌ Error in real-time membership listener:', error);
      } finally {
        setLoading(false);
      }
    }, (error) => {
      console.error('❌ Real-time listener error:', error);
      setLoading(false);
    });

    // Cleanup listener on unmount
    return () => {
      // console.log('🧹 Cleaning up real-time membership listener');
      unsubscribe();
    };
  }, []);

  // Fetch plans from Firestore, fallback to plan constants
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
          // Sort plans by price (ascending order)
          const sortedPlans = plansData.sort((a, b) => (a.price || 0) - (b.price || 0));
          // console.log('📋 Plans loaded from Firebase:', sortedPlans);

          // Debug: Show plan durations
          // console.log('🔍 Plan Duration Analysis:');
          sortedPlans.forEach(plan => {
            const durationDays = (plan as any).durationDays || 'Not set';
            // console.log(`  ${plan.id}: ${durationDays} days`);

            if (durationDays !== 'Not set') {
              // const subscriptionEnd = now + (durationDays * 24 * 60 * 60);
              // console.log(`    If purchased now, would expire: ${new Date(subscriptionEnd * 1000).toLocaleString()}`);
            }
          });
          
          setPlans(sortedPlans);
        } else {
          // Fallback to plan constants if Firestore is empty
          const fallbackPlans = Object.values(PLAN_CONFIG).filter(plan => plan.id !== 'economy') as Plan[];
          // Sort fallback plans by price as well
          const sortedFallbackPlans = fallbackPlans.sort((a, b) => (a.price || 0) - (b.price || 0));
          // console.log('📋 Using fallback plans from constants:', sortedFallbackPlans);
          setPlans(sortedFallbackPlans);
        }
      } catch (error) {
        console.error('Error fetching plans:', error);
        // Fallback to plan constants on error
        const fallbackPlans = Object.values(PLAN_CONFIG).filter(plan => plan.id !== 'economy') as Plan[];
        // Sort fallback plans by price as well
        const sortedFallbackPlans = fallbackPlans.sort((a, b) => (a.price || 0) - (b.price || 0));
        setPlans(sortedFallbackPlans);
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
    if (planId === 'business') return t('planNames.business');
    
    return planId;
  };

  // Get actual plan from Firebase membership data only
  const getActualPlan = () => {
    if (membershipData && membershipData.planName) {
      return membershipData.planName;
    }
    return 'economy'; // Default to economy if no membership data
  };

  const actualPlan = getActualPlan();
  const displayPlanName = getPlanDisplayName(actualPlan);
  
  // Get subscription end date from Firebase membership data only
  const getActualSubscriptionEnd = () => {
    if (membershipData && membershipData.subscriptionEnd) {
      return membershipData.subscriptionEnd;
    }
    return null; // No subscription end date means no active subscription
  };
  
  const actualSubscriptionEnd = getActualSubscriptionEnd();
  const actualIsExpired = actualSubscriptionEnd ? actualSubscriptionEnd < now : true;

  // Console logging for debugging user plan info
  // console.log('🔍 Membership Page State Debug:', {
  //   // Raw membership data from Firebase
  //   membershipData: membershipData,
  //
  //   // Calculated plan info
  //   actualPlan: actualPlan,
  //   displayPlanName: displayPlanName,
  //
  //   // Subscription timing info
  //   actualSubscriptionEnd: actualSubscriptionEnd,
  //   actualIsExpired: actualIsExpired,
  //   currentTime: now,
  //   currentTimeFormatted: new Date(now * 1000).toLocaleString(),
  //
  //   // Subscription start info
  //   subscriptionStart: membershipData?.subscriptionStart,
  //   subscriptionStartFormatted: membershipData?.subscriptionStart ? new Date(membershipData.subscriptionStart * 1000).toLocaleString() : 'No start date',
  //
  //   // Expiration details
  //   expirationDate: actualSubscriptionEnd ? new Date(actualSubscriptionEnd * 1000).toLocaleString() : 'No expiration date',
  //   timeUntilExpiration: actualSubscriptionEnd ? Math.floor((actualSubscriptionEnd - now) / (24 * 60 * 60)) : 'N/A',
  //
  //   // Duration calculation
  //   subscriptionDuration: membershipData?.subscriptionStart && actualSubscriptionEnd ?
  //     Math.floor((actualSubscriptionEnd - membershipData.subscriptionStart) / (24 * 60 * 60)) : 'Unknown',
  //
  //   // Plan status summary
  //   planStatus: {
  //     plan: actualPlan,
  //     isActive: !actualIsExpired,
  //     isExpired: actualIsExpired,
  //     hasSubscription: !!actualSubscriptionEnd,
  //     daysRemaining: actualSubscriptionEnd ? Math.floor((actualSubscriptionEnd - now) / (24 * 60 * 60)) : 0,
  //     hasStartDate: !!membershipData?.subscriptionStart
  //   }
  // });

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
              // Use the actual plan without incorrect normalization
              const isActive = plan.id === actualPlan && !actualIsExpired;
              const bonus = plan.bonus || getPlanBonus(plan.id);
              const price = plan.price || getPlanPrice(plan.id);
              const features = plan.features || getPlanFeatures(plan.id);
              
              // Console log for each plan comparison
              // console.log(`🔍 Plan ${plan.id} comparison:`, {
              //   planId: plan.id,
              //   actualPlan: actualPlan,
              //   isActive: isActive,
              //   actualIsExpired: actualIsExpired,
              //   planMatches: plan.id === actualPlan,
              //   willShowAsActive: isActive
              // });
              
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
                      {features?.map((feature: string, i: number) => (
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
                        onClick={() => setModalPlan({ 
                          id: plan.id, 
                          price: String(price), 
                          bonus: bonus,
                          features: features
                        })}
                      >
                        <ShoppingCart className="w-6 h-6" />
                        {plan.id === actualPlan && actualIsExpired ? t('membershipPage.renew') : t('membershipPage.subscribeNow')}
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>


        {modalPlan && (
          <SubscribeModal 
            planId={String(modalPlan.id)} 
            price={modalPlan.price} 
            bonus={modalPlan.bonus}
            features={modalPlan.features}
            onClose={() => {
              setModalPlan(null);
              // Modal closed - real-time listener will handle updates
              // console.log('🔄 Modal closed, real-time listener will handle updates');
            }}
          />
        )}
      </div>
    </div>
  );
};

export default MembershipPage;
