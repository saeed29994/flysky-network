import { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { Copy, Bell, X } from 'lucide-react';

interface Referral {
  email: string;
  status: 'Verified' | 'Pending' | 'Rejected';
}

interface Message {
  title: string;
  body: string;
  read: boolean;
  timestamp: number;
}

const ReferralProgram = () => {
  const [referralLink, setReferralLink] = useState('');
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [totalReward, setTotalReward] = useState(0);
  const [claimableReward, setClaimableReward] = useState(0);
  const [hasUnreadNotification, setHasUnreadNotification] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [inboxMessages, setInboxMessages] = useState<Message[]>([]);

  const verifiedCount = referrals.filter(r => r.status === 'Verified').length;
  const pendingCount = referrals.filter(r => r.status === 'Pending').length;
  const rejectedCount = referrals.filter(r => r.status === 'Rejected').length;

  let progressMsg = '';
  if (verifiedCount >= 30) progressMsg = '🏆 Max level reached!';
  else if (verifiedCount >= 20) progressMsg = '🚀 Final stage unlocked!';
  else if (verifiedCount >= 10) progressMsg = '🔥 Keep going, great work!';
  else if (verifiedCount > 0) progressMsg = '👏 Good start, invite more!';
  else progressMsg = '🚀 Start inviting your friends now!';

  let badgeLabel = '🚀 Beginner';
  let badgeColor = 'bg-gray-700 text-gray-300';

  if (verifiedCount >= 30) {
    badgeLabel = '👑 Referral Master';
    badgeColor = 'bg-yellow-500 text-black';
  } else if (verifiedCount >= 20) {
    badgeLabel = '🚀 Power Referrer';
    badgeColor = 'bg-purple-600 text-white';
  } else if (verifiedCount >= 10) {
    badgeLabel = '🔥 Rising Referrer';
    badgeColor = 'bg-orange-500 text-white';
  } else if (verifiedCount >= 1) {
    badgeLabel = '🔓 Getting Started';
    badgeColor = 'bg-blue-500 text-white';
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) return;

      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      const data = userSnap.data();
      if (!data) return;

      const code = encodeURIComponent(data.referralCode || user.uid.slice(0, 8));
      setReferralLink(`${window.location.origin}/signup?ref=${code}`);

      const referralList: Referral[] = data.referralList || [];
      setReferrals(referralList);

      const verified = referralList.filter((r: Referral) => r.status === 'Verified');
      const totalJoined = referralList.length;

      let expectedReward = 0;
      for (let i = 0; i < totalJoined; i++) {
        if (i < 10) expectedReward += 100;
        else if (i < 20) expectedReward += 200;
        else expectedReward += 300;
      }

      let actualClaimable = 0;
      for (let i = 0; i < verified.length; i++) {
        if (i < 10) actualClaimable += 100;
        else if (i < 20) actualClaimable += 200;
        else actualClaimable += 300;
      }

      setTotalReward(expectedReward);
      setClaimableReward(actualClaimable - (data.referralReward || 0));

      const inbox: Message[] = (data.inbox || []).filter((msg: Message) => !msg.read);
      setHasUnreadNotification(inbox.length > 0);
      setInboxMessages(inbox);

      setLoading(false);
    });

    return () => unsubscribe();
  }, [showNotifications]);

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClaim = async () => {
    const user = auth.currentUser;
    if (!user || claimableReward <= 0) return;

    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);
    const data = userSnap.data();
    const currentBalance = data?.balance || 0;

    await updateDoc(userRef, {
      referralReward: totalReward,
      balance: currentBalance + claimableReward,
      inbox: arrayUnion({
        title: 'Referral Bonus Added',
        body: `${claimableReward} FSN has been added to your balance from referrals.`,
        read: false,
        timestamp: Date.now(),
      })
    });

    setClaimableReward(0);
    setHasUnreadNotification(true);
  };

  const getStatusColor = (status: string) => {
    if (status === 'Verified') return 'text-green-400';
    if (status === 'Pending') return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white p-6">
      <div className="flex justify-end mb-4">
        <button onClick={() => setShowNotifications(true)} className="relative">
          <Bell className="text-yellow-400 w-6 h-6" />
          {hasUnreadNotification && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">
              !
            </span>
          )}
        </button>
      </div>

      {showNotifications && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-gray-900 p-6 rounded shadow-lg w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-yellow-400">Notifications</h2>
              <button onClick={() => setShowNotifications(false)} className="text-white">
                <X size={20} />
              </button>
            </div>
            {inboxMessages.length > 0 ? (
              <ul className="space-y-2 text-sm text-gray-300">
                {inboxMessages.map((msg, idx) => (
                  <li key={idx} className="bg-gray-800 p-3 rounded-md border-l-4 border-yellow-400">
                    <strong className="block text-yellow-300">{msg.title}</strong>
                    <p>{msg.body}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-400">No new notifications.</p>
            )}
          </div>
        </div>
      )}

      <h1 className="text-3xl font-bold text-center mb-6">Referral Program</h1>

      <div className="bg-gray-800 p-6 rounded-xl shadow-lg max-w-xl mx-auto mb-6">
        <h2 className="text-xl font-semibold mb-2">Your Referral Link</h2>
        {loading ? (
          <p className="text-gray-400">Loading your referral link...</p>
        ) : (
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={referralLink}
              className="bg-gray-700 px-4 py-2 rounded-md w-full text-white focus:outline-none"
            />
            <button
              onClick={handleCopy}
              className="bg-yellow-500 text-black px-3 py-2 rounded-md hover:bg-yellow-400"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>
        )}
        {copied && <p className="text-green-400 mt-2">Copied!</p>}
      </div>

      <div className="bg-gray-900 p-6 rounded-xl shadow-md max-w-xl mx-auto mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-yellow-400">📊 Referral Stats</h3>
          <span className={`text-xs font-bold px-3 py-1 rounded-full ${badgeColor}`}>
            {badgeLabel}
          </span>
        </div>

        <div className="mb-4">
          <p className="text-sm text-gray-300 mb-1">✅ Verified: {verifiedCount}</p>
          <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
            <div className="h-full bg-green-400 transition-all duration-300" style={{ width: `${(verifiedCount / 30) * 100}%` }} />
          </div>
        </div>

        <div className="mb-4">
          <p className="text-sm text-gray-300 mb-1">🕓 Pending: {pendingCount}</p>
          <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
            <div className="h-full bg-yellow-400 transition-all duration-300" style={{ width: `${(pendingCount / 30) * 100}%` }} />
          </div>
        </div>

        <div>
          <p className="text-sm text-gray-300 mb-1">❌ Rejected: {rejectedCount}</p>
          <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
            <div className="h-full bg-red-400 transition-all duration-300" style={{ width: `${(rejectedCount / 30) * 100}%` }} />
          </div>
        </div>

        <p className="text-sm mt-3 text-center text-gray-400 italic">{progressMsg}</p>
      </div>

      <div className="max-w-xl mx-auto bg-gray-800 p-6 rounded-xl shadow-md mb-10">
        <p className="mb-2 text-sm">💰 Expected Total Earnings (All Referrals): <span className="text-yellow-400 font-bold">{totalReward} FSN</span></p>
        <p className="mb-2 text-sm">✅ Claimable (Verified Only): <span className="text-green-400 font-bold">{claimableReward} FSN</span></p>
        <button
          onClick={handleClaim}
          disabled={claimableReward === 0}
          className="w-full bg-yellow-500 text-black font-bold py-2 rounded-md hover:bg-yellow-400 disabled:opacity-50"
        >
          Send to Balance
        </button>
      </div>

      <div className="max-w-4xl mx-auto">
        <h3 className="text-lg font-semibold mb-4">Your Referrals</h3>
        <div className="overflow-x-auto rounded-lg shadow">
          <table className="w-full text-sm bg-gray-800">
            <thead className="bg-gray-700 text-gray-300">
              <tr>
                <th className="p-3 text-left">Email</th>
                <th className="p-3 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {referrals.length === 0 ? (
                <tr>
                  <td className="p-4 text-center text-gray-500" colSpan={2}>No referrals yet.</td>
                </tr>
              ) : (
                referrals.map((ref, idx) => (
                  <tr key={idx} className="border-t border-gray-700">
                    <td className="p-3 text-white">{ref.email}</td>
                    <td className={`p-3 ${getStatusColor(ref.status)}`}>{ref.status}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <footer className="text-center text-gray-500 text-sm mt-16">
        © 2025 FlySky Network. All rights reserved.
      </footer>
    </div>
  );
};

export default ReferralProgram;
