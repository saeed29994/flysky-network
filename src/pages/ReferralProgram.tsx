import { useState, useEffect, useRef } from 'react';
import { auth, db } from '../firebase';
import { doc, getDoc, updateDoc, collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { Copy, Download, Gift } from 'lucide-react';
import QRCode from 'react-qr-code';
import { toPng } from 'html-to-image';
import { useTranslation } from 'react-i18next';
import ReferralBonusButton from '../components/ReferralBonusButton';
import { translateText } from '@/utils/translateAPI';

interface Referral {
  email: string;
  status: 'Verified' | 'Pending' | 'Rejected';
  claimed?: boolean;
}

const ReferralProgram = () => {
  const { t, i18n } = useTranslation();
  const [referralLink, setReferralLink] = useState('');
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uid, setUid] = useState('');
  const [verifiedCount, setVerifiedCount] = useState(0);
  const [verifiedEmails, setVerifiedEmails] = useState<string[]>([]);
  const qrRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) return;
      setUid(user.uid);

      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      const data = userSnap.data();
      if (!data) return;

      const code = encodeURIComponent(data.referralCode || user.uid.slice(0, 8));
      setReferralLink(`${window.location.origin}/signup?ref=${code}`);

      const referralList: Referral[] = data.referralList || [];
      setReferrals(referralList);

      const verifiedList = referralList.filter((r: any) => r.status === 'Verified');
      setVerifiedCount(verifiedList.length);
      setVerifiedEmails(verifiedList.map((r: any) => r.email));

      // ✅ إرسال إشعارات للبريد الداخلي لكل إحالة غير محصلة
      for (const ref of verifiedList) {
        const q = query(
          collection(db, 'inbox'),
          where('userId', '==', user.uid),
          where('type', '==', 'referral'),
          where('refEmail', '==', ref.email),
          where('claimed', '==', false)
        );
        const existing = await getDocs(q);
        if (existing.empty) {
          await addDoc(collection(db, 'inbox'), {
            userId: user.uid,
           title: await translateText("🎁 Referral Bonus Available", i18n.language),
           body: await translateText(`You have a referral bonus ready to claim for referring ${ref.email}`, i18n.language),

            timestamp: Date.now(),
            read: false,
            claimed: false,
            type: 'referral',
            refEmail: ref.email
          });
        }
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadQR = async () => {
    if (!qrRef.current) return;
    try {
      const dataUrl = await toPng(qrRef.current);
      const link = document.createElement('a');
      link.download = 'referral-qr.png';
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('❌ QR download error:', err);
    }
  };

  const handleClaim = async (refEmail: string) => {
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);
    const data = userSnap.data();
    if (!data) return;

    const referralList = data.referralList || [];
    const index = referralList.findIndex((r: any) => r.email === refEmail);
    if (index === -1) return;

    if (referralList[index].status !== 'Verified' || referralList[index].claimed) return;

    const verifiedCount = referralList.filter((r: any) => r.status === 'Verified' && r.claimed).length;
    let reward = 0;
    if (verifiedCount < 10) reward = 100;
    else if (verifiedCount < 20) reward = 200;
    else reward = 300;

    referralList[index].claimed = true;

    const rawDescription = `Referral bonus claimed for ${refEmail} (+${reward} FSN)`;
    const translatedDescription = await translateText(rawDescription, i18n.language);

    await updateDoc(userRef, {
      referralList,
      balance: (data.balance || 0) + reward,
      transactionHistory: [...(data.transactionHistory || []), {
        description: translatedDescription,
        timestamp: Date.now(),
      }]
    });

    setReferrals([...referralList]);
  };

  const getStatusColor = (status: string) => {
    if (status === 'Verified') return 'text-green-400';
    if (status === 'Pending') return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white p-6">
      <h1 className="text-3xl font-bold text-center mb-6">{t('referralProgram')}</h1>

      <ReferralBonusButton />

      <div className="bg-gray-800 p-6 rounded-xl shadow-lg max-w-xl mx-auto mb-6">
        <h2 className="text-xl font-semibold mb-2">{t('yourReferralLink')}</h2>

        {loading ? (
          <p className="text-gray-400">Loading...</p>
        ) : (
          <>
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
            {copied && <p className="text-green-400 mt-2">{t('copied')}</p>}

            <div className="flex flex-col items-center mt-6">
              <div ref={qrRef} className="bg-white p-4 rounded-md shadow">
                <QRCode value={referralLink} size={160} />
              </div>
              <button
                onClick={handleDownloadQR}
                className="mt-2 flex items-center gap-1 bg-yellow-500 text-black px-3 py-1 rounded hover:bg-yellow-400"
              >
                <Download className="w-4 h-4" />
                {t('downloadQR')}
              </button>
              <p className="text-sm text-gray-400 text-center mt-1">
                {t('scanToShare')}
              </p>
            </div>
          </>
        )}
      </div>

      <div className="max-w-4xl mx-auto mt-12">
        <div className="mb-6 text-center text-sm text-gray-300">
          <p>
            ✅ {t('verifiedCount')}: <span className="font-bold text-white">{verifiedCount}</span>
          </p>
          {verifiedCount > 0 && (
            <p className="mt-1 text-xs">
              {t('verifiedEmails')}: {verifiedEmails.join(', ')}
            </p>
          )}
        </div>

        <h3 className="text-lg font-semibold mb-4">{t('yourReferrals')}</h3>
        <div className="overflow-x-auto rounded-lg shadow">
          <table className="w-full text-sm bg-gray-800">
            <thead className="bg-gray-700 text-gray-300">
              <tr>
                <th className="p-3 text-left">{t('email')}</th>
                <th className="p-3 text-left">{t('status')}</th>
                <th className="p-3 text-left">{t('action')}</th>
              </tr>
            </thead>
            <tbody>
              {referrals.length === 0 ? (
                <tr>
                  <td className="p-4 text-center text-gray-500" colSpan={3}>
                    {t('noReferrals')}
                  </td>
                </tr>
              ) : (
                referrals.map((ref, idx) => (
                  <tr key={idx} className="border-t border-gray-700">
                    <td className="p-3 text-white">{ref.email}</td>
                    <td className={`p-3 ${getStatusColor(ref.status)}`}>{t(ref.status.toLowerCase())}</td>
                    <td className="p-3">
                      {ref.status === 'Verified' && !ref.claimed ? (
                        <button
                          onClick={() => handleClaim(ref.email)}
                          className="bg-yellow-500 text-black px-3 py-1 rounded hover:bg-yellow-400 flex items-center gap-1"
                        >
                          <Gift className="w-4 h-4" /> {t('claim')}
                        </button>
                      ) : ref.claimed ? (
                        <span className="text-green-400">{t('claimed')}</span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="max-w-2xl mx-auto mt-16 text-sm bg-gray-700 rounded-lg p-6">
        <h4 className="text-lg font-semibold mb-4">{t('bonusTiers')}</h4>
        <ul className="list-disc pl-6 text-gray-300 space-y-2">
          <li>{t('bonusTier1')}</li>
          <li>{t('bonusTier2')}</li>
          <li>{t('bonusTier3')}</li>
        </ul>
      </div>
    </div>
  );
};

export default ReferralProgram;
