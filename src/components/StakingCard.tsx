interface StakingCardProps {
  plan: 'economy' | 'business' | 'first-6' | 'first-lifetime';
  lockedAmount: number;
}

const planFeatures: Record<string, string> = {
  economy: '30% of your staking balance will be locked for 6 months. Rewards are released monthly.',
  business: 'Business plan offers higher reward multipliers and faster unlocks.',
  'first-6': 'First Class (6 months) offers massive returns with shorter lock periods.',
  'first-lifetime': 'First Class (Lifetime) gives you the highest rewards with permanent benefits.',
};

const StakingCard = ({ plan, lockedAmount }: StakingCardProps) => {
  return (
    <div className="bg-gradient-to-br from-purple-600 to-indigo-800 text-white p-6 rounded-xl shadow-2xl flex flex-col justify-between">
      <div>
        <h2 className="text-xl font-bold mb-2">Staking Program</h2>
        <p className="text-sm text-gray-200">
          {planFeatures[plan] || planFeatures['economy']}
        </p>
      </div>

      <div className="mt-4 text-center">
        <p className="text-yellow-400 text-3xl font-bold">{lockedAmount} FSN</p>
        <p className="text-sm text-gray-300">Currently Locked</p>
      </div>
    </div>
  );
};

export default StakingCard;
