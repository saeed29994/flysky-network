interface StakingCardProps {
  plan: 'economy' | 'business' | 'first-6' | 'first-lifetime';
  lockedAmount: number;
}

const planFeatures: Record<string, string> = {
  economy: 'Earn 0% for short terms. Get up to 25% return by locking for 12 months. Best for patient holders.',
  business: 'Get up to 30% return. Ideal for growing your FSN with better flexibility.',
  'first-6': 'Up to 50% return over 6 months. High-yield plan for ambitious users.',
  'first-lifetime': 'Get the highest return (up to 60%) with permanent staking privileges.',
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
