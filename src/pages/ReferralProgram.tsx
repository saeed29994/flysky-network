import { useState, useEffect, useRef } from 'react';
import { auth, db } from '../firebase';
import { doc, getDoc, updateDoc, collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { Copy, Download, Gift, Users, Share2, Trophy, TrendingUp, CheckCircle, Clock, XCircle } from 'lucide-react';
import QRCode from 'react-qr-code';
import { toPng } from 'html-to-image';
// import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import ReferralBonusButton from '../components/ReferralBonusButton';

interface Referral {
  email: string;
  status: 'Verified' | 'Pending' | 'Rejected';
  claimed?: boolean;
}

const ReferralProgram = () => {
  // const { t } = useTranslation();
  const [referralLink, setReferralLink] = useState('');
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uid, setUid] = useState('');
  const [verifiedCount, setVerifiedCount] = useState(0);
  const [verifiedEmails, setVerifiedEmails] = useState<string[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [rejectedCount, setRejectedCount] = useState(0);
  const qrRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setLoading(false);
        return;
      }
      
      try {
        setUid(user.uid);

        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        const data = userSnap.data();
        
        if (!data) {
          setLoading(false);
          return;
        }

        const code = encodeURIComponent(data.referralCode || user.uid.slice(0, 8));
        setReferralLink(`${window.location.origin}/signup?ref=${code}`);

        const referralList: Referral[] = data.referralList || [];
        setReferrals(referralList);

        // Calculate counts
        const verifiedList = referralList.filter((r: any) => r.status === 'Verified');
        const pendingList = referralList.filter((r: any) => r.status === 'Pending');
        const rejectedList = referralList.filter((r: any) => r.status === 'Rejected');
        
        setVerifiedCount(verifiedList.length);
        setPendingCount(pendingList.length);
        setRejectedCount(rejectedList.length);
        setVerifiedEmails(verifiedList.map((r: any) => r.email));

        // Create inbox notifications for verified referrals (simplified version)
        try {
          for (const ref of verifiedList) {
            if (!ref.claimed) {
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
                  title: "🎁 Referral Bonus Available",
                  body: `You have a referral bonus ready to claim for referring ${ref.email}`,
                  timestamp: Date.now(),
                  read: false,
                  claimed: false,
                  type: 'referral',
                  refEmail: ref.email
                });
              }
            }
          }
        } catch (error) {
          console.error('Error creating inbox notifications:', error);
        }

        setLoading(false);
      } catch (error) {
        console.error('Error loading referral data:', error);
        setLoading(false);
      }
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
    try {
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

      await updateDoc(userRef, {
        referralList,
        balance: (data.balance || 0) + reward,
        transactionHistory: [...(data.transactionHistory || []), {
          description: `Referral bonus claimed for ${refEmail} (+${reward} FSN)`,
          timestamp: Date.now(),
        }]
      });

      setReferrals([...referralList]);
    } catch (error) {
      console.error('Error claiming referral bonus:', error);
    }
  };

  const getStatusColor = (status: string) => {
    if (status === 'Verified') return 'text-green-400';
    if (status === 'Pending') return 'text-yellow-400';
    return 'text-red-400';
  };

  const getStatusIcon = (status: string) => {
    if (status === 'Verified') return <CheckCircle className="w-4 h-4" />;
    if (status === 'Pending') return <Clock className="w-4 h-4" />;
    return <XCircle className="w-4 h-4" />;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
          <p>Loading referral data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Professional Header Section */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative overflow-hidden"
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 via-purple-500/5 to-green-500/5"></div>
        <div className="absolute inset-0 opacity-30" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.02'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}></div>
        
        <div className="relative px-4 py-8 lg:py-12">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-8 lg:mb-12">
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="w-20 h-20 lg:w-24 lg:h-24 mx-auto mb-6 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center shadow-2xl"
              >
                <Users className="w-10 h-10 lg:w-12 lg:h-12 text-white" />
              </motion.div>
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="text-3xl lg:text-5xl font-bold text-white mb-4 tracking-tight"
              >
                👥 Referral Program
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="text-gray-300 text-lg lg:text-xl max-w-2xl mx-auto leading-relaxed"
              >
                Invite friends and earn rewards together. Share your referral link and start earning FSN tokens!
              </motion.p>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto px-4 pb-12">
        {/* Main Content Grid - Professional Layout */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
          
          {/* Left Column - Referral Stats & Link (8 columns on xl) */}
          <div className="xl:col-span-8 space-y-8">
            
            {/* Referral Stats Cards */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="space-y-4"
            >
              {/* Mobile: Single Compact Stats Card */}
              <div className="md:hidden bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20 shadow-xl">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Referral Overview</h3>
                    <p className="text-xs text-gray-400">Your referral performance</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center">
                    <div className="text-lg font-bold text-white">{referrals.length}</div>
                    <div className="text-xs text-blue-400 font-medium">Total</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-green-400">{verifiedCount}</div>
                    <div className="text-xs text-green-400 font-medium">Verified</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-yellow-400">{pendingCount}</div>
                    <div className="text-xs text-yellow-400 font-medium">Pending</div>
                  </div>
                </div>
              </div>

              {/* Desktop: Three Separate Cards */}
              <div className="hidden md:grid md:grid-cols-3 gap-4">
                {/* Total Referrals Card */}
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20 shadow-xl">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
                      <Users className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">Total Referrals</h3>
                      <p className="text-xs text-gray-400">All time</p>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-white">
                      {referrals.length}
                    </div>
                    <div className="text-xs text-blue-400 font-semibold">Referrals</div>
                  </div>
                </div>

                {/* Verified Referrals Card */}
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20 shadow-xl">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg">
                      <CheckCircle className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">Verified</h3>
                      <p className="text-xs text-gray-400">Confirmed</p>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-white">{verifiedCount}</div>
                    <div className="text-xs text-green-400 font-semibold">Ready to Claim</div>
                  </div>
                </div>

                {/* Pending Referrals Card */}
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20 shadow-xl">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                      <Clock className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">Pending</h3>
                      <p className="text-xs text-gray-400">Awaiting</p>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-white">{pendingCount}</div>
                    <div className="text-xs text-yellow-400 font-semibold">In Review</div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Referral Link Card */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-xl"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg">
                  <Share2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Your Referral Link</h2>
                  <p className="text-gray-400">Share this link with friends to earn rewards</p>
                </div>
              </div>

              <div className="space-y-4">
                {/* Link Input */}
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    readOnly
                    value={referralLink}
                    className="flex-1 bg-white/5 px-4 py-3 rounded-xl border border-white/10 text-white focus:outline-none focus:border-green-500 transition-all duration-300"
                  />
                  <button
                    onClick={handleCopy}
                    className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-4 py-3 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    <Copy className="w-5 h-5" />
                  </button>
                </div>
                
                {copied && (
                  <motion.p 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-green-400 text-sm font-medium"
                  >
                    ✅ Copied!
                  </motion.p>
                )}

                {/* QR Code Section */}
                <div className="flex flex-col items-center pt-6 border-t border-white/10">
                  <div ref={qrRef} className="bg-white p-4 rounded-xl shadow-lg">
                    <QRCode value={referralLink} size={160} />
                  </div>
                  <button
                    onClick={handleDownloadQR}
                    className="mt-4 flex items-center gap-2 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white px-4 py-2 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    <Download className="w-4 h-4" />
                    Download QR
                  </button>
                  <p className="text-sm text-gray-400 text-center mt-2">
                    Scan to share
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Referral Bonus Button */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-xl"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                  <Gift className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Referral Bonus</h3>
                  <p className="text-gray-400">Claim your available bonuses</p>
                </div>
              </div>
              <ReferralBonusButton />
            </motion.div>

            {/* Referrals Table */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 shadow-xl overflow-hidden"
            >
              <div className="p-6 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-xl flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Your Referrals</h3>
                    <p className="text-gray-400">Track your referral progress</p>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-white/5">
                    <tr>
                      <th className="p-4 text-left text-sm font-semibold text-gray-300">Email</th>
                      <th className="p-4 text-left text-sm font-semibold text-gray-300">Status</th>
                      <th className="p-4 text-left text-sm font-semibold text-gray-300">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {referrals.length === 0 ? (
                      <tr>
                        <td className="p-6 text-center text-gray-500" colSpan={3}>
                          <div className="flex flex-col items-center gap-2">
                            <Users className="w-8 h-8 text-gray-600" />
                            <p>No referrals yet</p>
                            <p className="text-sm">Share your referral link to get started!</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      referrals.map((ref, idx) => (
                        <tr key={idx} className="border-t border-white/5 hover:bg-white/5 transition-colors">
                          <td className="p-4 text-white font-medium">{ref.email}</td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              {getStatusIcon(ref.status)}
                              <span className={`${getStatusColor(ref.status)} font-medium`}>
                                {ref.status}
                              </span>
                            </div>
                          </td>
                          <td className="p-4">
                            {ref.status === 'Verified' && !ref.claimed ? (
                              <button
                                onClick={() => handleClaim(ref.email)}
                                className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-black px-4 py-2 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center gap-2"
                              >
                                <Gift className="w-4 h-4" />
                                Claim
                              </button>
                            ) : ref.claimed ? (
                              <span className="text-green-400 font-medium flex items-center gap-2">
                                <CheckCircle className="w-4 h-4" />
                                Claimed
                              </span>
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
            </motion.div>
          </div>

          {/* Right Column - Bonus Tiers & Info (4 columns on xl) */}
          <div className="xl:col-span-4">
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="space-y-6 sticky top-8"
            >
              {/* Bonus Tiers Card */}
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-xl">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                    <Trophy className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Bonus Tiers</h3>
                    <p className="text-sm text-gray-400">Reward structure</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-xl p-4 border border-green-500/30">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white font-semibold">Tier 1</span>
                      <span className="text-green-400 font-bold">100 FSN</span>
                    </div>
                    <p className="text-sm text-gray-300">1-10 Verified Referrals</p>
                  </div>

                  <div className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-xl p-4 border border-blue-500/30">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white font-semibold">Tier 2</span>
                      <span className="text-blue-400 font-bold">200 FSN</span>
                    </div>
                    <p className="text-sm text-gray-300">11-20 Verified Referrals</p>
                  </div>

                  <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl p-4 border border-purple-500/30">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white font-semibold">Tier 3</span>
                      <span className="text-purple-400 font-bold">300 FSN</span>
                    </div>
                    <p className="text-sm text-gray-300">21+ Verified Referrals</p>
                  </div>
                </div>
              </div>

              {/* Referral Stats Summary */}
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-xl">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-xl flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Referral Summary</h3>
                    <p className="text-sm text-gray-400">Performance overview</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-sm">Total Referrals</span>
                    <span className="text-white font-semibold">{referrals.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-sm">Verified</span>
                    <span className="text-green-400 font-semibold">{verifiedCount}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-sm">Pending</span>
                    <span className="text-yellow-400 font-semibold">{pendingCount}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-sm">Rejected</span>
                    <span className="text-red-400 font-semibold">{rejectedCount}</span>
                  </div>
                </div>

                {verifiedCount > 0 && (
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <p className="text-sm text-gray-400 mb-2">Verified Emails:</p>
                    <div className="text-xs text-gray-300 space-y-1">
                      {verifiedEmails.map((email, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <CheckCircle className="w-3 h-3 text-green-400" />
                          <span className="truncate">{email}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReferralProgram;
