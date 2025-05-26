import { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Copy } from 'lucide-react';

const ReferralCard = () => {
  const [verifiedCount, setVerifiedCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [referralLink, setReferralLink] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchReferralData = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      const userData = userSnap.data();

      const referralList = userData?.referralList || [];
      const verified = referralList.filter((r: any) => r.status === 'Verified').length;
      const pending = referralList.filter((r: any) => r.status === 'Pending').length;

      setVerifiedCount(verified);
      setPendingCount(pending);

      const code = userData?.referralCode || user.uid;
      setReferralLink(`${window.location.origin}/signup?ref=${code}`);
    };

    fetchReferralData();
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getRewardPerReferral = () => {
    if (verifiedCount < 10) return 100;
    if (verifiedCount < 20) return 200;
    if (verifiedCount < 30) return 300;
    return 0;
  };

  return (
    <div className="bg-gray-800 p-6 rounded-xl shadow-lg text-white max-w-md w-full mt-6">
      <h3 className="text-xl font-bold mb-4">Referral Program</h3>
      <p className="text-sm text-gray-300 mb-2">
        Invite your friends and earn FSN when they join.
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
      {copied && <p className="text-green-400 text-sm">Copied!</p>}

      <div className="mt-4">
        <p className="text-sm text-gray-300 mb-1">
          Verified Referrals: {verifiedCount}/30
        </p>
        <div className="w-full h-3 bg-gray-700 rounded-full overflow-hidden mb-2">
          <div
            className="h-full bg-green-400 transition-all duration-500"
            style={{ width: `${Math.min(verifiedCount, 30) / 30 * 100}%` }}
          />
        </div>

        <p className="text-sm text-gray-300 mb-1">
          Pending Referrals: {pendingCount}/30
        </p>
        <div className="w-full h-3 bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-yellow-400 transition-all duration-500"
            style={{ width: `${Math.min(pendingCount, 30) / 30 * 100}%` }}
          />
        </div>
      </div>

      <div className="mt-4 text-sm text-yellow-300">
        Current Reward per Verified Referral: {getRewardPerReferral()} FSN
      </div>

      <div className="mt-4 text-xs text-gray-400">
        <p>Reward Tiers:</p>
        <ul className="list-disc list-inside">
          <li>First 10 verified referrals: 100 FSN each</li>
          <li>Next 10 verified referrals: 200 FSN each</li>
          <li>Final 10 verified referrals: 300 FSN each</li>
        </ul>
      </div>
    </div>
  );
};

export default ReferralCard;
