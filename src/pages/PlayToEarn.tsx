import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Gamepad2, Clock, Star } from 'lucide-react';
import playImage from '../assets/play_to_earn.jpg';
import playImageMobile from '../assets/play_mobile.jpg';

const PlayToEarn = () => {
  const { t } = useTranslation();

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
        <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/5 via-purple-500/5 to-yellow-500/5"></div>
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
                className="w-20 h-20 lg:w-24 lg:h-24 mx-auto mb-6 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-2xl flex items-center justify-center shadow-2xl"
              >
                <Gamepad2 className="w-10 h-10 lg:w-12 lg:h-12 text-white" />
              </motion.div>
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="text-3xl lg:text-5xl font-bold text-white mb-4 tracking-tight"
              >
                🎮 {t('playToEarnPage.title')}
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="text-gray-300 text-lg lg:text-xl max-w-2xl mx-auto leading-relaxed"
              >
                {t('playToEarnPage.description')}
              </motion.p>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto px-4 pb-12">
        {/* Main Content Grid - Professional Layout */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
          
          {/* Left Column - Main Content (8 columns on xl) */}
          <div className="xl:col-span-8 space-y-8">
            
            {/* Coming Soon Card */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 shadow-xl overflow-hidden"
            >
              <div className="p-6 border-b border-white/10">
                <div className="flex items-center gap-6">
                  <div className="w-10 h-10 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                    <Clock className="w-5 h-5 text-white" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-xl font-bold text-white mb-1">{t('playToEarnPage.comingSoon')}</h2>
                    <p className="text-gray-400 text-sm leading-relaxed">{t('playToEarnPage.workingHard')}</p>
                  </div>
                </div>
              </div>

              <div className="p-6">
                {/* Mobile Image */}
                <div className="block md:hidden mb-6">
      <img
        src={playImageMobile}
        alt="Play to Earn Mobile"
                    className="w-full h-auto rounded-xl shadow-xl border-2 border-yellow-400/50"
      />
                </div>
                
                {/* Desktop Image */}
                <div className="hidden md:block mb-6">
      <img
        src={playImage}
        alt="Play to Earn"
                    className="w-full h-auto rounded-xl shadow-xl border-2 border-yellow-400/50"
                  />
                </div>

                {/* Coming Soon Message */}
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                    <Star className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4">{t('playToEarnPage.stayTuned')}</h3>
                  <p className="text-gray-400 mb-6 max-w-md mx-auto leading-relaxed">
                    {t('playToEarnPage.underDevelopment')}
                  </p>
                  <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-xl p-4 border border-yellow-500/30">
                    <p className="text-yellow-400 font-medium">{t('playToEarnPage.comingSoon')}</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Features Preview */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-xl"
              >
                <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center mb-4 shadow-lg">
                  <Star className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-white mb-3">{t('playToEarnPage.dailyRewards')}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{t('playToEarnPage.dailyRewardsDescription')}</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-xl"
              >
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center mb-4 shadow-lg">
                  <Gamepad2 className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-white mb-3">{t('playToEarnPage.tokenRewards')}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{t('playToEarnPage.tokenRewardsDescription')}</p>
              </motion.div>
            </motion.div>
          </div>

          {/* Right Column - Info (4 columns on xl) */}
          <div className="xl:col-span-4">
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="space-y-6 sticky top-8"
            >
              {/* Gaming Info Card */}
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-xl">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
                    <Gamepad2 className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">{t('playToEarnPage.gamingPlatform')}</h3>
                    <p className="text-sm text-gray-400">{t('playToEarnPage.whatToExpect')}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center text-xs font-bold text-black mt-0.5">
                      1
                    </div>
                    <div>
                      <h4 className="text-white font-medium text-sm">{t('playToEarnPage.startPlaying')}</h4>
                      <p className="text-gray-400 text-xs">{t('playToEarnPage.beginJourney')}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center text-xs font-bold text-black mt-0.5">
                      2
                    </div>
                    <div>
                      <h4 className="text-white font-medium text-sm">{t('playToEarnPage.chooseGame')}</h4>
                      <p className="text-gray-400 text-xs">{t('playToEarnPage.selectGameModes')}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center text-xs font-bold text-black mt-0.5">
                      3
                    </div>
                    <div>
                      <h4 className="text-white font-medium text-sm">{t('playToEarnPage.playAndEarn')}</h4>
                      <p className="text-gray-400 text-xs">{t('playToEarnPage.completeMissions')}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Rewards Preview Card */}
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-xl">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg">
                    <Star className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">{t('playToEarnPage.rewardsPreview')}</h3>
                    <p className="text-sm text-gray-400">{t('playToEarnPage.earningStructure')}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-xl p-4 border border-green-500/30">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white font-semibold text-sm">{t('playToEarnPage.dailyLogin')}</span>
                      <span className="text-green-400 font-bold text-sm">50 FSN</span>
                    </div>
                    <p className="text-xs text-gray-300">{t('playToEarnPage.dailyLoginDescription')}</p>
                  </div>

                  <div className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-xl p-4 border border-blue-500/30">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white font-semibold text-sm">{t('playToEarnPage.gameWins')}</span>
                      <span className="text-blue-400 font-bold text-sm">100 FSN</span>
                    </div>
                    <p className="text-xs text-gray-300">{t('playToEarnPage.gameWinsDescription')}</p>
                  </div>

                  <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl p-4 border border-purple-500/30">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white font-semibold text-sm">{t('playToEarnPage.achievements')}</span>
                      <span className="text-purple-400 font-bold text-sm">200 FSN</span>
                    </div>
                    <p className="text-xs text-gray-300">{t('playToEarnPage.achievementsDescription')}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayToEarn;
