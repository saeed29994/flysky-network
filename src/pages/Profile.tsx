import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { doc, getDoc, collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { motion } from 'framer-motion';
import {
  User, Crown, Shield, Calendar, Camera, CheckCircle, Clock, AlertCircle,
  Star, Zap, Gift, ArrowRight, Settings, Coins, TrendingUp, Users, 
  Wallet, Gem, Share2, Award, Activity, ChartBar, History, Layers,
  Hexagon, Target, Sparkles, Flame, Rocket, Trophy, Lock, Edit3,
  Mail, Globe, MapPin, Phone, Briefcase, Heart, Shield as ShieldIcon,
  Award as AwardIcon, Calendar as CalendarIcon, Clock as ClockIcon,
  Camera as CameraIcon, Edit, MoreHorizontal, Plus, Minus, Eye
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
    kycStatus: 'Not Actived' as 'Not Actived' | 'Pending' | 'Approved',
    subscriptionEnd: '',
    avatarUrl: '',
    createdAt: '',
    referralCode: '',
    language: 'en',
    theme: 'dark'
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
            kycStatus: data.kycStatus || 'Not Actived',
            subscriptionEnd: data.membership?.subscriptionEnd ? new Date(data.membership.subscriptionEnd).toLocaleDateString() : '',
            avatarUrl: data.avatarUrl || '',
            createdAt: data.createdAt ? new Date(data.createdAt.toDate()).toLocaleDateString() : '',
            referralCode: data.referralCode || '',
            language: data.language || 'en',
            theme: data.theme || 'dark'
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
        <div className="flex items-center gap-2">
          <Crown className="w-4 h-4 text-yellow-400" />
          <span className="bg-gradient-to-r from-yellow-400 to-orange-400 text-black text-xs px-3 py-1 rounded-full font-semibold">
            First Class
          </span>
        </div>
      );
    }
    if (userData.plan === 'business') {
      return (
        <div className="flex items-center gap-2">
          <Star className="w-4 h-4 text-blue-400" />
          <span className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs px-3 py-1 rounded-full font-semibold">
            Business Class
          </span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-2">
        <Zap className="w-4 h-4 text-gray-400" />
        <span className="bg-gradient-to-r from-gray-500 to-gray-600 text-white text-xs px-3 py-1 rounded-full font-semibold">
          Economy Class
        </span>
      </div>
    );
  };

  const getKYCStatus = () => {
    if (userData.kycStatus === 'Approved') {
      return (
        <div className="flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-green-400" />
          <span className="bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs px-3 py-1 rounded-full font-semibold">
            {t('kycApproved')}
          </span>
        </div>
      );
    }
    if (userData.kycStatus === 'Pending') {
      return (
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-yellow-400" />
          <span className="bg-gradient-to-r from-yellow-400 to-orange-400 text-black text-xs px-3 py-1 rounded-full font-semibold">
            {t('kycPending')}
          </span>
        </div>
      );
    }
    return (
      <button
        onClick={() => navigate('/kyc')}
        className="flex items-center gap-2 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs px-3 py-1 rounded-full hover:from-red-600 hover:to-pink-600 transition-all duration-200 font-semibold"
      >
        <AlertCircle className="w-4 h-4" />
        {t('notVerified')}
      </button>
    );
  };

  const tabs = [
    { id: 'about', label: 'About', icon: User },
    { id: 'achievements', label: 'Achievements', icon: Trophy },
    { id: 'activity', label: 'Activity', icon: Activity },
    { id: 'stats', label: 'Stats', icon: ChartBar }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'about':
        return (
          <div className="space-y-6">
            {/* About Section */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-4 sm:p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg sm:text-xl font-semibold text-white">About</h3>
                <button className="bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600 transition-colors">
                  <Edit className="w-4 h-4" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-3 sm:p-4 bg-white/5 rounded-lg">
                  <Mail className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-white font-medium text-sm sm:text-base">Email</p>
                    <p className="text-gray-400 text-xs sm:text-sm truncate">{userData.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-3 sm:p-4 bg-white/5 rounded-lg">
                  <CalendarIcon className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-white font-medium text-sm sm:text-base">Member Since</p>
                    <p className="text-gray-400 text-xs sm:text-sm">{userData.createdAt}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-3 sm:p-4 bg-white/5 rounded-lg">
                  <Crown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-white font-medium text-sm sm:text-base">Membership Plan</p>
                    <p className="text-gray-400 text-xs sm:text-sm">{userData.plan === 'first' || userData.plan === 'first-lifetime' || userData.plan === 'first-6' ? 'First Class' : userData.plan === 'business' ? 'Business Class' : 'Economy Class'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-3 sm:p-4 bg-white/5 rounded-lg">
                  <ShieldIcon className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-white font-medium text-sm sm:text-base">Verification Status</p>
                    <p className="text-gray-400 text-xs sm:text-sm">{userData.kycStatus}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-3 sm:p-4 bg-white/5 rounded-lg">
                  <Users className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-white font-medium text-sm sm:text-base">Referral Code</p>
                    <p className="text-gray-400 text-xs sm:text-sm truncate">{userData.referralCode}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-4 sm:p-6">
              <h3 className="text-lg sm:text-xl font-semibold text-white mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <button
                  onClick={() => navigate('/settings')}
                  className="flex items-center gap-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white px-3 sm:px-4 py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-purple-600 transition-all duration-200 text-sm sm:text-base"
                >
                  <Settings className="w-4 h-4" />
                  Edit Profile
                </button>
                
                <button
                  onClick={() => navigate('/mining')}
                  className="flex items-center gap-3 bg-gradient-to-r from-amber-500 to-orange-500 text-black px-3 sm:px-4 py-3 rounded-lg font-semibold hover:from-amber-600 hover:to-orange-600 transition-all duration-200 text-sm sm:text-base"
                >
                  <Gem className="w-4 h-4" />
                  Start Mining
                </button>
                
                <button
                  onClick={() => navigate('/staking')}
                  className="flex items-center gap-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-3 sm:px-4 py-3 rounded-lg font-semibold hover:from-green-600 hover:to-emerald-600 transition-all duration-200 text-sm sm:text-base"
                >
                  <Coins className="w-4 h-4" />
                  View Staking
                </button>
                
                <button
                  onClick={() => navigate('/referral-program')}
                  className="flex items-center gap-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 sm:px-4 py-3 rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition-all duration-200 text-sm sm:text-base"
                >
                  <Share2 className="w-4 h-4" />
                  Referral Program
                </button>
              </div>
            </div>
          </div>
        );

      case 'achievements':
        return (
          <div className="space-y-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-4 sm:p-6">
              <h3 className="text-lg sm:text-xl font-semibold text-white mb-6">Your Achievements</h3>
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
                          <span className="text-gray-400">Progress</span>
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
                        Completed on {new Date(achievement.completedAt).toLocaleDateString()}
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
              <h3 className="text-lg sm:text-xl font-semibold text-white mb-6">Recent Activity</h3>
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
                  <h3 className="text-white font-semibold text-sm sm:text-base">Balance</h3>
                </div>
                <p className="text-2xl sm:text-3xl font-bold text-green-400">
                  {userStats.balance.toLocaleString()} FSN
                </p>
                <p className="text-xs sm:text-sm text-gray-400 mt-2">
                  Available for use
                </p>
              </div>

              <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl p-4 sm:p-6 border border-blue-500/30">
                <div className="flex items-center gap-3 mb-3">
                  <ChartBar className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400" />
                  <h3 className="text-white font-semibold text-sm sm:text-base">Total Earnings</h3>
                </div>
                <p className="text-2xl sm:text-3xl font-bold text-blue-400">
                  {userStats.totalEarnings.toLocaleString()} FSN
                </p>
                <p className="text-xs sm:text-sm text-gray-400 mt-2">
                  Lifetime earnings
                </p>
              </div>

              <div className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-xl p-4 sm:p-6 border border-yellow-500/30 sm:col-span-2 lg:col-span-1">
                <div className="flex items-center gap-3 mb-3">
                  <Users className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-400" />
                  <h3 className="text-white font-semibold text-sm sm:text-base">Referrals</h3>
                </div>
                <p className="text-2xl sm:text-3xl font-bold text-yellow-400">
                  {userStats.referrals}
                </p>
                <p className="text-xs sm:text-sm text-gray-400 mt-2">
                  Total referrals
                </p>
              </div>
            </div>

            {/* Mining Stats */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-4 sm:p-6">
              <h3 className="text-lg sm:text-xl font-semibold text-white mb-6">Mining Statistics</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                <div className="bg-white/5 rounded-lg p-3 sm:p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Hexagon className="w-4 h-4 text-purple-400" />
                    <span className="text-gray-400 text-xs sm:text-sm">Mining Level</span>
                  </div>
                  <p className="text-white font-semibold text-base sm:text-lg">{userStats.miningLevel}</p>
                </div>

                <div className="bg-white/5 rounded-lg p-3 sm:p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Gem className="w-4 h-4 text-yellow-400" />
                    <span className="text-gray-400 text-xs sm:text-sm">Mining Earnings</span>
                  </div>
                  <p className="text-white font-semibold text-base sm:text-lg">
                    {userStats.miningEarnings.toLocaleString()} FSN
                  </p>
                </div>

                <div className="bg-white/5 rounded-lg p-3 sm:p-4 sm:col-span-2 lg:col-span-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Layers className="w-4 h-4 text-blue-400" />
                    <span className="text-gray-400 text-xs sm:text-sm">Staked Amount</span>
                  </div>
                  <p className="text-white font-semibold text-base sm:text-lg">
                    {userStats.lockedInStaking.toLocaleString()} FSN
                  </p>
                </div>
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
          <p className="text-white">Loading profile...</p>
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
                  <span>Member since {userData.createdAt}</span>
                </div>
              </div>
              <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-3">
                {getPlanBadge()}
                {getKYCStatus()}
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