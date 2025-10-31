import { useState, useEffect, useRef } from 'react';
import { auth, db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { Copy, Download } from 'lucide-react';
import QRCode from 'react-qr-code';
import { toPng } from 'html-to-image';

interface Referral {
  email: string;
  status: 'Verified' | 'Pending' | 'Rejected';
}

const ReferralProgram = () => {
  const [referralLink, setReferralLink] = useState('');
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const qrRef = useRef<HTMLDivElement>(null);

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

  const getStatusColor = (status: string) => {
    if (status === 'Verified') return 'text-green-400';
    if (status === 'Pending') return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white p-6">
      <h1 className="text-3xl font-bold text-center mb-6">Referral Program</h1>

      <div className="bg-gray-800 p-6 rounded-xl shadow-lg max-w-xl mx-auto mb-6">
        <h2 className="text-xl font-semibold mb-2">Your Referral Link</h2>

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
            {copied && <p className="text-green-400 mt-2">Copied!</p>}

            {/* QR Code */}
            <div className="flex flex-col items-center mt-6">
              <div ref={qrRef} className="bg-white p-4 rounded-md shadow">
                <QRCode value={referralLink} size={160} />
              </div>
              <button
                onClick={handleDownloadQR}
                className="mt-2 flex items-center gap-1 bg-yellow-500 text-black px-3 py-1 rounded hover:bg-yellow-400"
              >
                <Download className="w-4 h-4" />
                Download QR
              </button>
              <p className="text-sm text-gray-400 text-center mt-1">
                Scan or download the QR code to share your link
              </p>
            </div>
          </>
        )}
      </div>

      {/* جدول الإحالات */}
      <div className="max-w-4xl mx-auto mt-12">
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
                  <td className="p-4 text-center text-gray-500" colSpan={2}>
                    No referrals yet.
                  </td>
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
    </div>
  );
};

export default ReferralProgram;
