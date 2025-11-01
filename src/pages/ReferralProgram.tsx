import { useState, useEffect, useRef } from 'react';
import { auth, db } from '../firebase';
import { doc, getDoc, updateDoc, collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { Copy, Download, Gift, Users, Share2, Trophy, TrendingUp, CheckCircle, Clock, XCircle } from 'lucide-react';
import QRCode from 'react-qr-code';
import { toPng } from 'html-to-image';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { fetchRewardTypeFromFirebase, type ReferralReward } from '../utils/rewardsService';
import ReferralBonusButton from '../components/ReferralBonusButton';

interface Referral {
  email: string;
  status: 'Verified' | 'Pending' | 'Rejected';
  claimed?: boolean;
}

const ReferralProgram = () => {
  const { t } = useTranslation();
  const [referralLink, setReferralLink] = useState('');
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uid, setUid] = useState('');
  const [verifiedCount, setVerifiedCount] = useState(0);
  const [unclaimedVerifiedCount, setUnclaimedVerifiedCount] = useState(0);
  const [verifiedEmails, setVerifiedEmails] = useState<string[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [rejectedCount, setRejectedCount] = useState(0);
  const qrRef = useRef<HTMLDivElement>(null);
  const [bonusTiers, setBonusTiers] = useState<ReferralReward[]>([]);

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
        const unclaimedVerifiedList = verifiedList.filter((r: any) => !r.claimed);
        const pendingList = referralList.filter((r: any) => r.status === 'Pending');
        const rejectedList = referralList.filter((r: any) => r.status === 'Rejected');
        
        setVerifiedCount(verifiedList.length);
        setUnclaimedVerifiedCount(unclaimedVerifiedList.length);
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

  // Load Referral Bonus Tiers from Firebase
  useEffect(() => {
    const loadBonusTiers = async () => {
      try {
        const tiers = (await fetchRewardTypeFromFirebase('referrals')) as ReferralReward[];
        // Sort by tier ascending for consistent order
        const sorted = [...tiers].sort((a, b) => (a.tier || 0) - (b.tier || 0));
        setBonusTiers(sorted);
      } catch (e) {
        setBonusTiers([]);
      }
    };
    loadBonusTiers();
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
          <p>{t('referralPage.loading')}</p>
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
                className="text-2xl sm:text-3xl lg:text-5xl font-bold text-white mb-3 sm:mb-4 tracking-tight"
              >
                👥 {t('referralPage.title')}
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="text-gray-300 text-base sm:text-lg lg:text-xl max-w-2xl mx-auto leading-relaxed"
              >
                {t('referralPage.description')}
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
                    <h3 className="text-xs sm:text-sm font-bold text-white">{t('referralPage.overview')}</h3>
                    <p className="text-[10px] sm:text-xs text-gray-400">{t('referralPage.performance')}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center">
                    <div className="text-base sm:text-lg font-bold text-white">{referrals.length}</div>
                    <div className="text-[10px] sm:text-xs text-blue-400 font-medium">Total</div>
                  </div>
                  <div className="text-center">
                    <div className="text-base sm:text-lg font-bold text-green-400">{verifiedCount}</div>
                    <div className="text-[10px] sm:text-xs text-green-400 font-medium">Verified</div>
                  </div>
                  <div className="text-center">
                    <div className="text-base sm:text-lg font-bold text-yellow-400">{pendingCount}</div>
                    <div className="text-[10px] sm:text-xs text-yellow-400 font-medium">Pending</div>
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
                        <h3 className="text-xs sm:text-sm font-bold text-white">{t('referralPage.totalReferrals')}</h3>
                        <p className="text-[10px] sm:text-xs text-gray-400">{t('referralPage.allTime')}</p>
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg sm:text-xl font-bold text-white">
                        {referrals.length}
                      </div>
                      <div className="text-[10px] sm:text-xs text-blue-400 font-semibold">{t('referralPage.referrals')}</div>
                  </div>
                </div>

                {/* Verified Referrals Card */}
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20 shadow-xl">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg">
                      <CheckCircle className="w-5 h-5 text-white" />
                    </div>
                                          <div>
                        <h3 className="text-xs sm:text-sm font-bold text-white">{t('referralPage.verified')}</h3>
                        <p className="text-[10px] sm:text-xs text-gray-400">{t('referralPage.confirmed')}</p>
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg sm:text-xl font-bold text-white">{verifiedCount}</div>
                      <div className="text-[10px] sm:text-xs text-green-400 font-semibold">
                        {unclaimedVerifiedCount > 0 ? t('referralPage.readyToClaim') : t('referralPage.verified')}
                      </div>
                    </div>
                </div>

                {/* Pending Referrals Card */}
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20 shadow-xl">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                      <Clock className="w-5 h-5 text-white" />
                    </div>
                                          <div>
                        <h3 className="text-xs sm:text-sm font-bold text-white">{t('referralPage.pending')}</h3>
                        <p className="text-[10px] sm:text-xs text-gray-400">{t('referralPage.awaiting')}</p>
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg sm:text-xl font-bold text-white">{pendingCount}</div>
                      <div className="text-[10px] sm:text-xs text-yellow-400 font-semibold">{t('referralPage.inReview')}</div>
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
                  <h2 className="text-lg sm:text-xl font-bold text-white">{t('referralPage.yourReferralLink')}</h2>
                  <p className="text-xs sm:text-sm text-gray-400">{t('referralPage.shareLinkToEarn')}</p>
                </div>
              </div>

              <div className="space-y-4">
                {/* Link Input */}
                <div className="flex items-center gap-1 sm:gap-3 w-full overflow-hidden">
                  <div className="flex-1 min-w-0 overflow-hidden">
                    <input
                      type="text"
                      readOnly
                      value={referralLink}
                      className="w-full bg-white/5 px-2 sm:px-4 py-2 sm:py-3 rounded-xl border border-white/10 text-white text-sm sm:text-base focus:outline-none focus:border-green-500 transition-all duration-300 overflow-ellipsis overflow-hidden"
                    />
                  </div>
                  <button
                    onClick={handleCopy}
                    className="flex-shrink-0 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-2 sm:px-4 py-2 sm:py-3 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl"
                  >
                    <Copy className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                </div>
                
                {copied && (
                  <motion.p 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-green-400 text-sm font-medium"
                  >
                    ✅ {t('copied')}
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
                    {t('referralPage.downloadQR')}
                  </button>
                  <p className="text-sm text-gray-400 text-center mt-2">
                    {t('referralPage.scanToShare')}
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
                  <h3 className="text-base sm:text-lg font-bold text-white">{t('referralPage.bonus')}</h3>
                  <p className="text-xs sm:text-sm text-gray-400">{t('referralPage.claimBonuses')}</p>
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
                                      <h3 className="text-base sm:text-lg font-bold text-white">{t('referralPage.yourReferrals')}</h3>
                  <p className="text-xs sm:text-sm text-gray-400">{t('referralPage.trackProgress')}</p>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-white/5">
                    <tr>
                      <th className="p-2 sm:p-4 text-left text-xs sm:text-sm font-semibold text-gray-300">{t('referralPage.email')}</th>
                      <th className="p-2 sm:p-4 text-left text-xs sm:text-sm font-semibold text-gray-300">{t('referralPage.status')}</th>
                      <th className="p-2 sm:p-4 text-left text-xs sm:text-sm font-semibold text-gray-300">{t('referralPage.action')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {referrals.length === 0 ? (
                      <tr>
                        <td className="p-4 sm:p-6 text-center text-gray-500" colSpan={3}>
                          <div className="flex flex-col items-center gap-2">
                            <Users className="w-6 h-6 sm:w-8 sm:h-8 text-gray-600" />
                            <p className="text-sm sm:text-base">{t('referralPage.noReferralsYet')}</p>
                            <p className="text-xs sm:text-sm">{t('referralPage.shareLinkToStart')}</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      referrals.map((ref, idx) => (
                        <tr key={idx} className="border-t border-white/5 hover:bg-white/5 transition-colors">
                          <td className="p-2 sm:p-4 text-white font-medium text-xs sm:text-sm">{ref.email}</td>
                          <td className="p-2 sm:p-4">
                            <div className="flex items-center gap-1 sm:gap-2">
                              {getStatusIcon(ref.status)}
                              <span className={`${getStatusColor(ref.status)} font-medium text-xs sm:text-sm`}>
                                {ref.status}
                              </span>
                            </div>
                          </td>
                          <td className="p-2 sm:p-4">
                            {ref.status === 'Verified' && !ref.claimed ? (
                              <button
                                onClick={() => handleClaim(ref.email)}
                                className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-black px-2 sm:px-4 py-1 sm:py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm transition-all duration-300 shadow-lg hover:shadow-xl flex items-center gap-1 sm:gap-2"
                              >
                                <Gift className="w-3 h-3 sm:w-4 sm:h-4" />
                                {t('referralPage.claim')}
                              </button>
                            ) : ref.claimed ? (
                              <span className="text-green-400 font-medium flex items-center gap-2">
                                <CheckCircle className="w-4 h-4" />
                                {t('referralPage.claimed')}
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
                                      <h3 className="text-base sm:text-lg font-bold text-white">{t('referralPage.bonusTiers')}</h3>
                  <p className="text-xs sm:text-sm text-gray-400">{t('referralPage.rewardStructure')}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {bonusTiers.length === 0 ? (
                    <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                      <p className="text-sm text-gray-300">No referral bonus tiers configured.</p>
                    </div>
                  ) : (
                    bonusTiers.map((tier, idx) => {
                      const colorSets = [
                        { bg: 'from-green-500/20 to-emerald-500/20', border: 'border-green-500/30', text: 'text-green-400' },
                        { bg: 'from-blue-500/20 to-cyan-500/20', border: 'border-blue-500/30', text: 'text-blue-400' },
                        { bg: 'from-purple-500/20 to-pink-500/20', border: 'border-purple-500/30', text: 'text-purple-400' },
                      ];
                      const colors = colorSets[idx % colorSets.length];
                      return (
                        <div key={tier.id} className={`bg-gradient-to-r ${colors.bg} rounded-xl p-4 border ${colors.border}`}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-white font-semibold">{tier.name || `Tier ${tier.tier}`}</span>
                            <span className={`${colors.text} font-bold`}>{tier.reward} FSN</span>
                          </div>
                          <p className="text-sm text-gray-300">
                            {tier.referralRange?.min ?? 0} - {tier.referralRange?.max ?? 0} verified referrals
                          </p>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Referral Stats Summary */}
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-xl">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-xl flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <div>
                                      <h3 className="text-base sm:text-lg font-bold text-white">{t('referralPage.referralSummary')}</h3>
                  <p className="text-xs sm:text-sm text-gray-400">{t('referralPage.performanceOverview')}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-sm">{t('referralPage.totalReferrals')}</span>
                    <span className="text-white font-semibold">{referrals.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-sm">{t('referralPage.verified')}</span>
                    <span className="text-green-400 font-semibold">{verifiedCount}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-sm">{t('referralPage.pending')}</span>
                    <span className="text-yellow-400 font-semibold">{pendingCount}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-sm">{t('referralPage.rejected')}</span>
                    <span className="text-red-400 font-semibold">{rejectedCount}</span>
                  </div>
                </div>

                {verifiedCount > 0 && (
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <p className="text-sm text-gray-400 mb-2">{t('referralPage.verifiedEmails')}:</p>
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
