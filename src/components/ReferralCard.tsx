import { useState, useEffect } from 'react';
import { auth } from '../firebase';
import { Copy } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useUserPlan } from '../contexts/UserPlanContext';

const ReferralCard = () => {
  const { t } = useTranslation();
  const { userData, referralReward } = useUserPlan();
  const [verifiedCount, setVerifiedCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [referralLink, setReferralLink] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user || !userData) return;

    // Process referral data from context
    const referralList = userData.referralList || [];
    const verified = referralList.filter((r: any) => r.status === 'Verified').length;
    const pending = referralList.filter((r: any) => r.status === 'Pending').length;

    setVerifiedCount(verified);
    setPendingCount(pending);

    const code = userData.referralCode || user.uid;
    setReferralLink(`${window.location.origin}/signup?ref=${code}`);
  }, [userData]);

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-gray-800 p-6 rounded-xl shadow-lg text-white max-w-md w-full mt-6">
      <h3 className="text-xl font-bold mb-4">{t('referralProgram')}</h3>
      <p className="text-sm text-gray-300 mb-2">
        {t('inviteFriendsEarn')}
      </p>

      {referralLink && (
        <div className="flex items-center gap-2 bg-gray-700 px-3 py-2 rounded-md mb-3">
          <input
            readOnly
            value={referralLink}
            className="bg-transparent text-white text-sm flex-1 outline-none"
          />
          <button onClick={handleCopy} className="text-yellow-400 hover:text-yellow-300">
            <Copy size={18} />
          </button>
        </div>
      )}
      {copied && <p className="text-green-400 text-sm">{t('copied')}</p>}

      <div className="mt-4">
        <p className="text-sm text-gray-300 mb-1">
          {t('verifiedReferrals')}: {verifiedCount}/30
        </p>
        <div className="w-full h-3 bg-gray-700 rounded-full overflow-hidden mb-2">
          <div
            className="h-full bg-green-400 transition-all duration-500"
            style={{ width: `${Math.min(verifiedCount, 30) / 30 * 100}%` }}
          />
        </div>

        <p className="text-sm text-gray-300 mb-1">
          {t('pendingReferrals')}: {pendingCount}/30
        </p>
        <div className="w-full h-3 bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-yellow-400 transition-all duration-500"
            style={{ width: `${Math.min(pendingCount, 30) / 30 * 100}%` }}
          />
        </div>
      </div>

      <div className="mt-4 text-sm text-yellow-300">
        {t('currentReward')}: {referralReward} FSN
      </div>

      <div className="mt-4 text-xs text-gray-400">
        <p>{t('rewardTiers')}:</p>
        <ul className="list-disc list-inside">
          <li>{t('bonusTier1')}</li>
          <li>{t('bonusTier2')}</li>
          <li>{t('bonusTier3')}</li>
        </ul>
      </div>
    </div>
  );
};

export default ReferralCard;
