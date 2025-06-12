// StakingCard.tsx
interface StakingCardProps {
  plan: 'economy' | 'business' | 'first-6' | 'first-lifetime';
  lockedAmount: number;
}

const planFeatures: Record<string, string> = {
  economy: 'Earn 0% to 40% return. Locking for 12 months gives you the highest reward.',
  business: 'From 10% to 60% APR based on duration. Best for consistent growth.',
  'first-6': 'Up to 80% APR for long-term staking. Excellent balance between speed and profit.',
  'first-lifetime': 'Highest returns up to 100%. Best for committed holders with long-term vision.',
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
