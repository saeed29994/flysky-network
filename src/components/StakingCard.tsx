// 📁 StakingCard.tsx
import { useTranslation } from 'react-i18next';

interface StakingCardProps {
  plan: 'economy' | 'business' | 'first-6' | 'first-lifetime';
  lockedAmount: number;
}

const StakingCard = ({ plan, lockedAmount }: StakingCardProps) => {
  const { t } = useTranslation();

  const planFeatures: Record<string, string> = {
    economy: t('stakingCard.economy'),
    business: t('stakingCard.business'),
    'first-6': t('stakingCard.first6'),
    'first-lifetime': t('stakingCard.firstLifetime'),
  };

  return (
    <div className="bg-gradient-to-br from-purple-600 to-indigo-800 text-white p-6 rounded-xl shadow-2xl flex flex-col justify-between">
      <div>
        <h2 className="text-xl font-bold mb-2">{t('stakingCard.title')}</h2>
        <p className="text-sm text-gray-200">
          {planFeatures[plan] || planFeatures['economy']}
        </p>
      </div>

      <div className="mt-4 text-center">
        <p className="text-yellow-400 text-3xl font-bold">{lockedAmount} FSN</p>
        <p className="text-sm text-gray-300">{t('stakingCard.currentlyLocked')}</p>
      </div>
    </div>
  );
};

export default StakingCard;
