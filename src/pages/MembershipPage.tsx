import { useEffect, useState } from 'react';
import { useUserPlan } from '../contexts/UserPlanContext';
import SubscribeModal from '../components/SubscribeModal';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

interface Plan {
  id: string;
  name: string;
  price: number;
  durationDays: number;
  features: string[];
}

const MembershipPage = () => {
  const { currentPlan, subscriptionEnd, loading } = useUserPlan();
  const [modalPlan, setModalPlan] = useState<null | { index: number; price: string }>(null);
  const [plans, setPlans] = useState<Plan[]>([]);

  useEffect(() => {
    const fetchPlans = async () => {
      const snapshot = await getDocs(collection(db, 'plans'));
      const fetchedPlans: Plan[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Plan[];
      setPlans(fetchedPlans);
    };
    fetchPlans();
  }, []);

  if (loading) {
    return <p className="text-center text-white">Loading membership info...</p>;
  }

  const now = Math.floor(Date.now() / 1000);
  const isExpired = subscriptionEnd ? subscriptionEnd < now : true;

  const getPlanColors = (planId: string, isActive: boolean) => {
    if (isActive) {
      return 'border-yellow-400 bg-yellow-100 text-black';
    }
    switch (planId) {
      case 'business':
        return 'border-blue-500 bg-blue-100 text-blue-900';
      case 'first-6':
        return 'border-purple-500 bg-purple-100 text-purple-900';
      case 'first-lifetime':
        return 'border-yellow-500 bg-yellow-300 text-black';
      default:
        return 'border-gray-700 bg-[#1B263B] text-white';
    }
  };

  const getBonusAmount = (planId: string, price: number) => {
    if (planId === 'first-6' || planId === 'first') return 500000;
    if (planId === 'first-lifetime') return 1000000;
    return price * 10000;
  };

  return (
    <div className="max-w-5xl mx-auto text-white px-4 py-12">
      <h1 className="text-3xl font-bold mb-8 text-center">Your Membership</h1>

      <p className="text-center mb-2">
        Current Plan:{' '}
        <span className="font-semibold capitalize">{currentPlan || 'Not subscribed'}</span>
      </p>

      {subscriptionEnd && (
        <p className="text-center mb-8 text-sm text-gray-300">
          {isExpired ? 'Expired on' : 'Expires on'}:{' '}
          {new Date(subscriptionEnd * 1000).toLocaleDateString()}
        </p>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {plans
          .filter(plan => plan.id !== 'economy')
          .map((plan, index) => {
            const isActive = plan.id === currentPlan && !isExpired;
            const colors = getPlanColors(plan.id, isActive);
            const bonus = getBonusAmount(plan.id, plan.price);

            return (
              <div
                key={plan.id}
                className={`border rounded-xl p-6 shadow-md transition-all ${colors}`}
              >
                <h2 className="text-xl font-bold mb-2">{plan.name}</h2>
                <p className="mb-1 text-lg">{plan.price} BUSD</p>

                {/* 🎁 عرض البونص */}
                <p className="mb-1 text-sm font-semibold">
                  🎁 Bonus: <span className="text-yellow-700 font-bold">{bonus.toLocaleString()} FSN</span>
                </p>

                {/* ⚡️ عرض سرعة التعدين */}
                <p className="mb-4 text-sm font-semibold">
                  ⚡️ Mining Rate: <span className="text-green-400">{plan.id === 'business' ? '3000 FSN / 12 hours' : '6000 FSN / 12 hours'}</span>
                </p>

                <ul className="mb-6 text-sm space-y-1 text-left">
                  {plan.features.map((feature, i) => (
                    <li key={i}>✔️ {feature}</li>
                  ))}
                </ul>

                {isActive ? (
                  <button
                    className="w-full bg-green-500 text-white font-bold py-2 rounded"
                    disabled
                  >
                    Activated
                  </button>
                ) : (
                  <button
                    className="w-full bg-yellow-400 hover:bg-yellow-300 text-black font-bold py-2 rounded"
                    onClick={() => setModalPlan({ index, price: String(plan.price) })}
                  >
                    {plan.id === currentPlan && isExpired ? 'Renew' : 'Subscribe'}
                  </button>
                )}
              </div>
            );
          })}
      </div>

      {modalPlan && (
        <SubscribeModal
          planIndex={modalPlan.index}
          price={modalPlan.price}
          onClose={() => setModalPlan(null)}
        />
      )}
    </div>
  );
};

export default MembershipPage;
