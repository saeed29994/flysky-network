import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { doc, getDoc, collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { motion } from 'framer-motion';
import {
  User, Crown, Camera, CheckCircle, Clock, AlertCircle,
  Star, Zap, Settings, Coins, Users, 
  Wallet, Gem, Share2, Activity, ChartBar, Layers,
  Hexagon, Trophy, Lock,
  Mail, Shield as ShieldIcon,
  Calendar as CalendarIcon, 
  Edit,
  Shield,
  Trash2,
  AlertTriangle
} from 'lucide-react';

interface UserStats {
  balance: number;
  referrals: number;
  miningLevel: string;
  totalEarnings: number;
  lockedInStaking: number;
  referralRewards: number;
  stakingEarnings: number;
  miningEarnings: number;
  watchedAdsToday: number;
  dailyMined: number;
  achievements: Achievement[];
  activityHistory: ActivityItem[];
  stakingHistory: StakingItem[];
  miningHistory: MiningItem[];
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  progress: number;
  total: number;
  completed: boolean;
  completedAt?: string;
}

interface ActivityItem {
  id: string;
  type: string;
  description: string;
  amount?: number;
  timestamp: string;
  status: string;
}

interface StakingItem {
  id: string;
  amount: number;
  duration: number;
  startDate: string;
  endDate: string;
  status: string;
  reward?: number;
}

interface MiningItem {
  id: string;
  amount: number;
  timestamp: string;
  level: string;
  duration: number;
}

const Profile = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('about');
  
  // User data states
  const [userData, setUserData] = useState({
    fullName: '',
    email: '',
    plan: 'economy',
    kycStatus: 'Not activated' as 'Not activated' | 'Not Actived' | 'Pending' | 'Approved' | 'Verified',
    subscriptionEnd: '',
    avatarUrl: '',
    createdAt: '',
    referralCode: '',
    language: 'en',
    theme: 'dark',
    dataDeletionRequested: false,
    dataDeletionStatus: 'none' as 'none' | 'pending' | 'processing' | 'completed' | 'cancelled',
    publicDeletionRequest: false
  });

  const [userStats, setUserStats] = useState<UserStats>({
    balance: 0,
    referrals: 0,
    miningLevel: 'Bronze',
    totalEarnings: 0,
    lockedInStaking: 0,
    referralRewards: 0,
    stakingEarnings: 0,
    miningEarnings: 0,
    watchedAdsToday: 0,
    dailyMined: 0,
    achievements: [],
    activityHistory: [],
    stakingHistory: [],
    miningHistory: []
  });

  useEffect(() => {
    const fetchUserData = async () => {
      const user = auth.currentUser;
      if (!user) {
        navigate('/login');
        return;
      }

      try {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const data = userSnap.data();
          
          // Calculate total earnings
          const miningEarnings = data.miningEarnings || 0;
          const referralEarnings = data.referralEarnings || data.referralReward || 0;
          const stakingEarnings = data.stakingEarnings || 0;
          const totalEarnings = miningEarnings + referralEarnings + stakingEarnings;

          // Determine mining level based on plan
          const plan = data.membership?.planName || data.plan || 'economy';
          const miningLevel = 
            plan === 'first-lifetime' ? 'Diamond' :
            plan === 'first-6' ? 'Platinum' :
            plan === 'business' ? 'Gold' :
            'Bronze';

          // Get locked staking amount
          let lockedInStaking = 0;
          let stakingHistory: StakingItem[] = [];
          try {
            const stakingSnap = await getDocs(collection(db, 'users', user.uid, 'staking'));
            const stakingList = stakingSnap.docs.map(doc => doc.data());
            lockedInStaking = stakingList
              .filter((s: any) => s.status === 'active')
              .reduce((sum, s: any) => sum + (s.amount || 0), 0);
            stakingHistory = stakingList.map((s: any) => ({
              id: s.id,
              amount: s.amount,
              duration: s.duration,
              startDate: s.startDate,
              endDate: s.endDate,
              status: s.status,
              reward: s.reward
            }));
          } catch (err) {
            console.error("Error fetching staking data:", err);
          }

          // Get mining history
          let miningHistory: MiningItem[] = [];
          try {
            const miningQuery = query(
              collection(db, 'users', user.uid, 'miningHistory'),
              orderBy('timestamp', 'desc'),
              limit(10)
            );
            const miningSnap = await getDocs(miningQuery);
            miningHistory = miningSnap.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            })) as MiningItem[];
          } catch (err) {
            console.error("Error fetching mining history:", err);
          }

          // Get activity history
          let activityHistory: ActivityItem[] = [];
          try {
            const activityQuery = query(
              collection(db, 'users', user.uid, 'activity'),
              orderBy('timestamp', 'desc'),
              limit(10)
            );
            const activitySnap = await getDocs(activityQuery);
            activityHistory = activitySnap.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            })) as ActivityItem[];
          } catch (err) {
            console.error("Error fetching activity history:", err);
          }

          // Get achievements
          let achievements: Achievement[] = [];
          try {
            const achievementsSnap = await getDocs(collection(db, 'users', user.uid, 'achievements'));
            achievements = achievementsSnap.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            })) as Achievement[];
          } catch (err) {
            console.error("Error fetching achievements:", err);
          }

          setUserData({
            fullName: data.fullName || '',
            email: data.email || '',
            plan: plan,
            kycStatus: data.kycStatus === 'Verified' ? 'Verified' : 
                      data.kycStatus === 'Pending' ? 'Pending' : 
                      data.kycStatus === 'Approved' ? 'Approved' : 'Not activated',
            subscriptionEnd: data.membership?.subscriptionEnd ? new Date(data.membership.subscriptionEnd).toLocaleDateString() : '',
            avatarUrl: data.avatarUrl || '',
            createdAt: data.createdAt ? new Date(data.createdAt.toDate()).toLocaleDateString() : '',
            referralCode: data.referralCode || '',
            language: data.language || 'en',
            theme: data.theme || 'dark',
            dataDeletionRequested: data.dataDeletionRequested || false,
            dataDeletionStatus: data.dataDeletionStatus || 'none',
            publicDeletionRequest: data.publicDeletionRequest || false
          });

          setUserStats({
            balance: data.balance || 0,
            referrals: data.referrals || 0,
            miningLevel,
            totalEarnings,
            lockedInStaking,
            referralRewards: data.referralReward || 0,
            stakingEarnings,
            miningEarnings,
            watchedAdsToday: data.watchedAdsToday || 0,
            dailyMined: data.dailyMined || 0,
            achievements,
            activityHistory,
            stakingHistory,
            miningHistory
          });
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [navigate]);

  const getPlanBadge = () => {
    if (userData.plan === 'first' || userData.plan === 'first-lifetime' || userData.plan === 'first-6') {
      return (
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-2">
          <Crown className="w-4 h-4 text-yellow-400 flex-shrink-0" />
          <span className="bg-gradient-to-r from-yellow-400 to-orange-400 text-black text-xs px-2 sm:px-3 py-1 rounded-full font-semibold whitespace-nowrap">
            {t('profile.firstClass')}
          </span>
        </div>
      );
    }
    if (userData.plan === 'business') {
      return (
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-2">
          <Star className="w-4 h-4 text-blue-400 flex-shrink-0" />
          <span className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs px-2 sm:px-3 py-1 rounded-full font-semibold whitespace-nowrap">
            {t('profile.businessClass')}
          </span>
        </div>
      );
    }
    return (
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-2">
        <Zap className="w-4 h-4 text-gray-400 flex-shrink-0" />
        <span className="bg-gradient-to-r from-gray-500 to-gray-600 text-white text-xs px-2 sm:px-3 py-1 rounded-full font-semibold whitespace-nowrap">
          {t('profile.economyClass')}
        </span>
      </div>
    );
  };

  const getKYCStatus = () => {
    if (userData.kycStatus === 'Verified' || userData.kycStatus === 'Approved') {
      return (
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-2">
          <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
          <span className="bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs px-2 sm:px-3 py-1 rounded-full font-semibold whitespace-nowrap">
            {t('kycApproved')}
          </span>
        </div>
      );
    }
    if (userData.kycStatus === 'Pending') {
      return (
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-2">
          <Clock className="w-4 h-4 text-yellow-400 flex-shrink-0" />
          <span className="bg-gradient-to-r from-yellow-400 to-orange-400 text-black text-xs px-2 sm:px-3 py-1 rounded-full font-semibold whitespace-nowrap">
            {t('kycPending')}
          </span>
        </div>
      );
    }
    // Default is 'Not activated' or any other status
    return (
      <button
        onClick={() => navigate('/kyc')}
        className="flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-2 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs px-2 sm:px-3 py-1 rounded-full hover:from-red-600 hover:to-pink-600 transition-all duration-200 font-semibold"
      >
        <AlertCircle className="w-4 h-4 flex-shrink-0" />
        <span className="whitespace-nowrap">{t('notVerified')}</span>
      </button>
    );
  };

  const getDataDeletionStatus = () => {
    if (userData.dataDeletionRequested) {
      if (userData.dataDeletionStatus === 'completed') {
        return (
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-2">
            <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
            <span className="bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs px-2 sm:px-3 py-1 rounded-full font-semibold whitespace-nowrap">
              Data Deleted
            </span>
          </div>
        );
      } else if (userData.dataDeletionStatus === 'processing') {
        return (
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-2">
            <Clock className="w-4 h-4 text-blue-400 flex-shrink-0" />
            <span className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs px-2 sm:px-3 py-1 rounded-full font-semibold whitespace-nowrap">
              Deletion in Progress
            </span>
          </div>
        );
      } else if (userData.dataDeletionStatus === 'cancelled') {
        return (
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-2">
            <AlertCircle className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <span className="bg-gradient-to-r from-gray-500 to-gray-600 text-white text-xs px-2 sm:px-3 py-1 rounded-full font-semibold whitespace-nowrap">
              Deletion Cancelled
            </span>
          </div>
        );
      } else {
        // pending status
        return (
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-2">
            <Clock className="w-4 h-4 text-yellow-400 flex-shrink-0" />
            <span className="bg-gradient-to-r from-yellow-400 to-orange-400 text-black text-xs px-2 sm:px-3 py-1 rounded-full font-semibold whitespace-nowrap">
              Deletion Pending
            </span>
          </div>
        );
      }
    }
    return null;
  };

  const tabs = [
    { id: 'about', label: t('profile.about'), icon: User },
    { id: 'achievements', label: t('profile.achievements'), icon: Trophy },
    { id: 'activity', label: t('profile.activity'), icon: Activity },
    { id: 'stats', label: t('profile.stats'), icon: ChartBar },
    { id: 'privacy', label: 'Privacy & Data', icon: Shield }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'about':
        return (
          <div className="space-y-6">
            {/* About Section */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-4 sm:p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg sm:text-xl font-semibold text-white">{t('profile.about')}</h3>
                <button className="bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600 transition-colors">
                  <Edit className="w-4 h-4" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-3 sm:p-4 bg-white/5 rounded-lg">
                  <Mail className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-white font-medium text-sm sm:text-base">{t('settingsSection.email')}</p>
                    <p className="text-gray-400 text-xs sm:text-sm truncate">{userData.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-3 sm:p-4 bg-white/5 rounded-lg">
                  <CalendarIcon className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-white font-medium text-sm sm:text-base">{t('profile.memberSince')}</p>
                    <p className="text-gray-400 text-xs sm:text-sm">{userData.createdAt}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-3 sm:p-4 bg-white/5 rounded-lg">
                  <Crown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-white font-medium text-sm sm:text-base">{t('profile.membershipPlan')}</p>
                    <p className="text-gray-400 text-xs sm:text-sm">{userData.plan === 'first' || userData.plan === 'first-lifetime' || userData.plan === 'first-6' ? t('profile.firstClass') : userData.plan === 'business' ? t('profile.businessClass') : t('profile.economyClass')}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-3 sm:p-4 bg-white/5 rounded-lg">
                  <ShieldIcon className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-white font-medium text-sm sm:text-base">{t('profile.verificationStatus')}</p>
                    {getKYCStatus()}
                  </div>
                </div>

                {userData.dataDeletionRequested && (
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-white/5 rounded-lg">
                    <Trash2 className="w-5 h-5 text-red-400 flex-shrink-0 mt-1 sm:mt-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-white font-medium text-sm sm:text-base mb-2 sm:mb-0">Data Deletion Status</p>
                      <div className="flex flex-wrap items-center gap-2">
                        {getDataDeletionStatus()}
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-4 p-3 sm:p-4 bg-white/5 rounded-lg">
                  <Users className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-white font-medium text-sm sm:text-base">{t('profile.referralCode')}</p>
                    <p className="text-gray-400 text-xs sm:text-sm truncate">{userData.referralCode}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-4 sm:p-6">
              <h3 className="text-lg sm:text-xl font-semibold text-white mb-4">{t('profile.quickActions')}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <button
                  onClick={() => navigate('/settings')}
                  className="flex items-center gap-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white px-3 sm:px-4 py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-purple-600 transition-all duration-200 text-sm sm:text-base"
                >
                  <Settings className="w-4 h-4" />
                  {t('profile.editProfile')}
                </button>
                
                <button
                  onClick={() => navigate('/mining')}
                  className="flex items-center gap-3 bg-gradient-to-r from-amber-500 to-orange-500 text-black px-3 sm:px-4 py-3 rounded-lg font-semibold hover:from-amber-600 hover:to-orange-600 transition-all duration-200 text-sm sm:text-base"
                >
                  <Gem className="w-4 h-4" />
                  {t('profile.startMining')}
                </button>
                
                <button
                  onClick={() => navigate('/staking')}
                  className="flex items-center gap-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-3 sm:px-4 py-3 rounded-lg font-semibold hover:from-green-600 hover:to-emerald-600 transition-all duration-200 text-sm sm:text-base"
                >
                  <Coins className="w-4 h-4" />
                  {t('profile.viewStaking')}
                </button>
                
                <button
                  onClick={() => navigate('/referral-program')}
                  className="flex items-center gap-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 sm:px-4 py-3 rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition-all duration-200 text-sm sm:text-base"
                >
                  <Share2 className="w-4 h-4" />
                  {t('profile.referralProgram')}
                </button>
              </div>
            </div>
          </div>
        );

      case 'achievements':
        return (
          <div className="space-y-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-4 sm:p-6">
              <h3 className="text-lg sm:text-xl font-semibold text-white mb-6">{t('profile.yourAchievements')}</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                {userStats.achievements.map(achievement => (
                  <div
                    key={achievement.id}
                    className="bg-white/5 p-4 sm:p-6 rounded-lg space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 sm:gap-4">
                        <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          achievement.completed
                            ? 'bg-gradient-to-br from-yellow-500 to-orange-500'
                            : 'bg-gray-700'
                        }`}>
                          {achievement.completed ? (
                            <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                          ) : (
                            <Lock className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-white font-semibold text-base sm:text-lg">
                            {achievement.title}
                          </h4>
                          <p className="text-gray-400 text-xs sm:text-sm">
                            {achievement.description}
                          </p>
                        </div>
                      </div>
                      {achievement.completed && (
                        <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-400 flex-shrink-0" />
                      )}
                    </div>

                    {!achievement.completed && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs sm:text-sm">
                          <span className="text-gray-400">{t('profile.progress')}</span>
                          <span className="text-white">
                            {achievement.progress} / {achievement.total}
                          </span>
                        </div>
                        <div className="bg-gray-700 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-yellow-500 to-orange-500 h-2 rounded-full transition-all duration-300"
                            style={{
                              width: `${(achievement.progress / achievement.total) * 100}%`
                            }}
                          />
                        </div>
                      </div>
                    )}

                    {achievement.completed && achievement.completedAt && (
                      <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-400">
                        <CheckCircle className="w-4 h-4" />
                        {t('profile.completedOn')} {new Date(achievement.completedAt).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'activity':
        return (
          <div className="space-y-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-4 sm:p-6">
              <h3 className="text-lg sm:text-xl font-semibold text-white mb-6">{t('profile.recentActivity')}</h3>
              <div className="space-y-4">
                {userStats.activityHistory.map(activity => (
                  <div
                    key={activity.id}
                    className="flex items-center justify-between bg-white/5 p-3 sm:p-4 rounded-lg"
                  >
                    <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                      {activity.type === 'mining' && <Gem className="w-5 h-5 text-yellow-400 flex-shrink-0" />}
                      {activity.type === 'staking' && <Layers className="w-5 h-5 text-blue-400 flex-shrink-0" />}
                      {activity.type === 'referral' && <Users className="w-5 h-5 text-green-400 flex-shrink-0" />}
                      <div className="min-w-0 flex-1">
                        <p className="text-white font-medium text-sm sm:text-base truncate">
                          {activity.description}
                        </p>
                        <p className="text-xs sm:text-sm text-gray-400">
                          {new Date(activity.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    {activity.amount && (
                      <span className="text-green-400 font-semibold text-sm sm:text-base flex-shrink-0">
                        +{activity.amount} FSN
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'stats':
        return (
          <div className="space-y-6">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-xl p-4 sm:p-6 border border-green-500/30">
                <div className="flex items-center gap-3 mb-3">
                  <Wallet className="w-5 h-5 sm:w-6 sm:h-6 text-green-400" />
                  <h3 className="text-white font-semibold text-sm sm:text-base">{t('profile.balance')}</h3>
                </div>
                <p className="text-2xl sm:text-3xl font-bold text-green-400">
                  {userStats.balance.toLocaleString()} FSN
                </p>
                                  <p className="text-xs sm:text-sm text-gray-400 mt-2">
                    {t('profile.availableForUse')}
                  </p>
              </div>

              <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl p-4 sm:p-6 border border-blue-500/30">
                <div className="flex items-center gap-3 mb-3">
                  <ChartBar className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400" />
                  <h3 className="text-white font-semibold text-sm sm:text-base">{t('profile.totalEarnings')}</h3>
                </div>
                <p className="text-2xl sm:text-3xl font-bold text-blue-400">
                  {userStats.totalEarnings.toLocaleString()} FSN
                </p>
                                  <p className="text-xs sm:text-sm text-gray-400 mt-2">
                    {t('profile.lifetimeEarnings')}
                  </p>
              </div>

              <div className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-xl p-4 sm:p-6 border border-yellow-500/30 sm:col-span-2 lg:col-span-1">
                <div className="flex items-center gap-3 mb-3">
                  <Users className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-400" />
                  <h3 className="text-white font-semibold text-sm sm:text-base">{t('profile.referrals')}</h3>
                </div>
                <p className="text-2xl sm:text-3xl font-bold text-yellow-400">
                  {userStats.referrals}
                </p>
                                  <p className="text-xs sm:text-sm text-gray-400 mt-2">
                    {t('profile.totalReferrals')}
                  </p>
              </div>
            </div>

            {/* Mining Stats */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-4 sm:p-6">
              <h3 className="text-lg sm:text-xl font-semibold text-white mb-6">{t('profile.miningStatistics')}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                <div className="bg-white/5 rounded-lg p-3 sm:p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Hexagon className="w-4 h-4 text-purple-400" />
                    <span className="text-gray-400 text-xs sm:text-sm">{t('profile.miningLevel')}</span>
                  </div>
                  <p className="text-white font-semibold text-base sm:text-lg">{userStats.miningLevel}</p>
                </div>

                <div className="bg-white/5 rounded-lg p-3 sm:p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Gem className="w-4 h-4 text-yellow-400" />
                    <span className="text-gray-400 text-xs sm:text-sm">{t('profile.miningEarnings')}</span>
                  </div>
                  <p className="text-white font-semibold text-base sm:text-lg">
                    {userStats.miningEarnings.toLocaleString()} FSN
                  </p>
                </div>

                <div className="bg-white/5 rounded-lg p-3 sm:p-4 sm:col-span-2 lg:col-span-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Layers className="w-4 h-4 text-blue-400" />
                    <span className="text-gray-400 text-xs sm:text-sm">{t('profile.stakedAmount')}</span>
                  </div>
                  <p className="text-white font-semibold text-base sm:text-lg">
                    {userStats.lockedInStaking.toLocaleString()} FSN
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      case 'privacy':
        return (
          <div className="space-y-6">
            {/* Data Deletion Status */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-4 sm:p-6">
              <h3 className="text-lg sm:text-xl font-semibold text-white mb-6 flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-400" />
                Data Deletion & Privacy
              </h3>
              
              {userData.dataDeletionRequested ? (
                <div className="space-y-4">
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <Trash2 className="w-5 h-5 text-blue-400" />
                      <h4 className="text-blue-400 font-semibold">Data Deletion Request Active</h4>
                    </div>
                    <div className="space-y-3">
                      {getDataDeletionStatus()}
                      <p className="text-blue-300 text-sm">
                        Your data deletion request is being processed. This process typically takes up to 90 days to complete.
                      </p>
                      <div className="bg-blue-500/20 rounded-lg p-3">
                        <h5 className="text-blue-300 font-medium mb-2">What happens next?</h5>
                        <ul className="text-blue-200 text-sm space-y-1">
                          <li>• Request reviewed within 30 days</li>
                          <li>• Processing begins after approval</li>
                          <li>• Data deletion completed within 90 days</li>
                          <li>• Final confirmation sent via email</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <AlertTriangle className="w-5 h-5 text-yellow-400" />
                      <h4 className="text-yellow-400 font-semibold">Important Notice</h4>
                    </div>
                    <p className="text-yellow-300 text-sm">
                      While your deletion request is being processed, your account remains active but limited. 
                      You can still access basic information but cannot perform new transactions.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <CheckCircle className="w-5 h-5 text-green-400" />
                      <h4 className="text-green-400 font-semibold">No Active Deletion Requests</h4>
                    </div>
                    <p className="text-green-300 text-sm">
                      Your account is currently active with no pending data deletion requests.
                    </p>
                  </div>
                  
                  <div className="bg-gray-500/10 border border-gray-500/20 rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <Shield className="w-5 h-5 text-gray-400" />
                      <h4 className="text-gray-300 font-semibold">Data Privacy</h4>
                    </div>
                    <p className="text-gray-300 text-sm">
                      Your personal data is protected and only used for service delivery. 
                      You can request data deletion at any time through our privacy portal.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Privacy Actions */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-4 sm:p-6">
              <h3 className="text-lg sm:text-xl font-semibold text-white mb-4">Privacy Actions</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  onClick={() => navigate('/data-deletion')}
                  className="flex items-center gap-3 bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-3 rounded-lg font-semibold hover:from-red-600 hover:to-red-700 transition-all duration-200"
                >
                  <Trash2 className="w-4 h-4" />
                  Request Data Deletion
                </button>
                
                <button
                  onClick={() => navigate('/settings')}
                  className="flex items-center gap-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-purple-600 transition-all duration-200"
                >
                  <Settings className="w-4 h-4" />
                  Privacy Settings
                </button>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-white">{t('profile.loadingProfile')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Profile Header */}
      <div className="bg-white/10 backdrop-blur-sm border-b border-white/20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
            {/* Profile Picture */}
            <div className="relative">
              {userData.avatarUrl ? (
                <img
                  src={userData.avatarUrl}
                  alt="Profile"
                  className="w-20 h-20 sm:w-24 sm:h-24 lg:w-32 lg:h-32 rounded-full object-cover border-4 border-white shadow-xl"
                />
              ) : (
                <div className="w-20 h-20 sm:w-24 sm:h-24 lg:w-32 lg:h-32 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 text-white flex items-center justify-center text-2xl sm:text-3xl lg:text-4xl font-bold border-4 border-white shadow-xl">
                  {userData.fullName.charAt(0).toUpperCase()}
                </div>
              )}
              <button className="absolute -bottom-1 -right-1 sm:-bottom-2 sm:-right-2 bg-blue-500 text-white p-1.5 sm:p-2 rounded-full hover:bg-blue-600 transition-colors shadow-lg">
                <Camera className="w-3 h-3 sm:w-4 sm:h-4" />
              </button>
            </div>

            {/* Profile Info */}
            <div className="flex-1 min-w-0 text-center sm:text-left">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-2">{userData.fullName}</h1>
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-2 sm:gap-4 text-gray-300 text-sm">
                <div className="flex items-center gap-1">
                  <Mail className="w-4 h-4" />
                  <span className="truncate">{userData.email}</span>
                </div>
                <div className="flex items-center gap-1">
                  <CalendarIcon className="w-4 h-4" />
                  <span>{t('profile.memberSince')} {userData.createdAt}</span>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row flex-wrap justify-center sm:justify-start gap-2 sm:gap-3 mt-3">
                {getPlanBadge()}
                {getKYCStatus()}
                {getDataDeletionStatus()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-white/10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-4 sm:space-x-8 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-400'
                      : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {renderTabContent()}
        </motion.div>
      </div>
    </div>
  );
};

export default Profile;