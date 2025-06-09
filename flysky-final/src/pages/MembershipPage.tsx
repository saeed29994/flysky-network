import { useState } from 'react';
import { useUserPlan } from '../contexts/UserPlanContext';
import SubscribeModal from '../components/SubscribeModal';

const MembershipPage = () => {
  const { currentPlan, subscriptionEnd, loading } = useUserPlan();
  const [modalPlan, setModalPlan] = useState<null | { index: number; price: string }>(null);

  if (loading) {
    return <p className="text-center text-white">Loading membership info...</p>;
  }

  const now = Math.floor(Date.now() / 1000);
  const isExpired = subscriptionEnd ? subscriptionEnd < now : true;

  // ✅ خطط الباقات مع البونص وسرعة التعدين
  const plans = [
    {
      name: 'business',
      label: 'Business Class',
      price: '10',
      priceLabel: '10 BUSD / month',
      index: 0,
      bonus: 100000,
      miningRate: '3000 FSN / 12 hours',
      benefits: ['Faster mining', 'Staking access', 'Referral bonus'],
    },
    {
      name: 'first-6',
      label: 'First Class (6 Months)',
      price: '49',
      priceLabel: '49 BUSD / 6 months',
      index: 1,
      bonus: 500000,
      miningRate: '6000 FSN / 12 hours',
      benefits: ['All business features', 'Priority support', 'Bonus rewards'],
    },
    {
      name: 'first-lifetime',
      label: 'First Class (Lifetime)',
      price: '99',
      priceLabel: '99 BUSD one-time',
      index: 2,
      bonus: 1000000,
      miningRate: '6000 FSN / 12 hours', // ✅ عدلتها من "Unlimited" إلى "6000 FSN / 12 hours"
      benefits: ['Everything unlocked forever', 'Lifetime perks', 'Event access'],
    },
  ];

  const getPlanColors = (planName: string, isActive: boolean) => {
    if (isActive) {
      return 'border-yellow-400 bg-yellow-100 text-black';
    }
    switch (planName) {
      case 'business':
        return 'border-blue-500 bg-blue-100 text-blue-900';
      case 'first-6':
        return 'border-purple-500 bg-purple-100 text-purple-900';
      case 'first-lifetime':
        return 'border-green-500 bg-green-100 text-green-900';
      default:
        return 'border-gray-700 bg-[#1B263B] text-white';
    }
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
        {plans.map((plan) => {
          const isActive = plan.name === currentPlan && !isExpired;
          const colors = getPlanColors(plan.name, isActive);

          return (
            <div
              key={plan.name}
              className={`border rounded-xl p-6 shadow-md transition-all ${colors}`}
            >
              <h2 className="text-xl font-bold mb-2">{plan.label}</h2>
              <p className="mb-1 text-lg">{plan.priceLabel}</p>

              {/* 🎁 عرض البونص */}
              <p className="mb-1 text-sm font-semibold">
                🎁 Bonus: <span className="text-yellow-400">{plan.bonus} FSN</span>
              </p>

              {/* ⚡️ عرض سرعة التعدين */}
              <p className="mb-4 text-sm font-semibold">
                ⚡️ Mining Rate: <span className="text-green-400">{plan.miningRate}</span>
              </p>

              <ul className="mb-6 text-sm space-y-1">
                {plan.benefits.map((b, i) => (
                  <li key={i}>✔️ {b}</li>
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
                  onClick={() => setModalPlan({ index: plan.index, price: plan.price })}
                >
                  {plan.name === currentPlan && isExpired ? 'Renew' : 'Subscribe'}
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
