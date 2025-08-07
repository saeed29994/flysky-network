// 📁 src/pages/AboutUs.tsx
import React from "react";
import { useTranslation } from "react-i18next";
import DashboardLayout from "./DashboardLayout";
import { motion } from 'framer-motion';
import { 
  Info, 
  Target, 
  Eye, 
  Shield, 
  Users, 
  Zap, 
  Gamepad2, 
  Coins, 
  CheckCircle,
  ArrowRight,
  Award,
  Heart,
  Play,
  Gift,
} from 'lucide-react';

const AboutUs: React.FC = () => {
  const { t } = useTranslation();

  return (
    <DashboardLayout>
      <div className="w-full bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 min-h-screen">
        {/* Hero Section */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative overflow-hidden"
        >
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-blue-500/5"></div>
          <div className="absolute inset-0 opacity-30" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.02'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}></div>

          <div className="relative px-4 py-12 lg:py-20">
            <div className="max-w-4xl mx-auto text-center">
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="w-20 h-20 lg:w-24 lg:h-24 mx-auto mb-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-2xl"
              >
                <Info className="w-10 h-10 lg:w-12 lg:h-12 text-white" />
              </motion.div>
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="text-4xl lg:text-6xl font-bold text-white mb-6 tracking-tight"
              >
                {t("about.title")}
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="text-gray-300 text-xl lg:text-2xl max-w-3xl mx-auto leading-relaxed mb-8"
              >
                {t("about.intro")}
              </motion.p>
            </div>
          </div>
        </motion.div>

        {/* Main Content */}
        <div className="max-w-6xl mx-auto px-4 pb-16">
          
          {/* Vision & Mission Section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-16"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
              {/* Vision */}
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 shadow-xl">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
                    <Eye className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">{t("about.visionTitle")}</h2>
                    <p className="text-gray-400">{t("about.ourFutureVision")}</p>
                  </div>
                </div>
                <p className="text-gray-300 text-lg leading-relaxed">
                  {t("about.vision")}
                </p>
              </div>

              {/* Mission */}
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 shadow-xl">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg">
                    <Target className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">{t("about.missionTitle")}</h2>
                    <p className="text-gray-400">{t("about.ourPurpose")}</p>
                  </div>
                </div>
                <p className="text-gray-300 text-lg leading-relaxed">
                  {t("about.mission")}
                </p>
              </div>
            </div>
          </motion.div>

          {/* What We Offer Section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mb-16"
          >
            <div className="text-center mb-12">
              <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">{t("about.featuresTitle")}</h2>
              <p className="text-gray-400 text-lg">{t("about.discoverWhatMakesUnique")}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 shadow-xl text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <Coins className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-4">{t("about.earnFSNPoints")}</h3>
                <p className="text-gray-400 text-lg leading-relaxed">
                  {t("about.features.earn")}
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 shadow-xl text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <Gift className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-4">{t("about.unlockFeatures")}</h3>
                <p className="text-gray-400 text-lg leading-relaxed">
                  {t("about.features.unlock")}
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 shadow-xl text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <Gamepad2 className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-4">{t("about.interactiveGames")}</h3>
                <p className="text-gray-400 text-lg leading-relaxed">
                  {t("about.features.enjoy")}
                </p>
              </div>
            </div>
          </motion.div>

          {/* FSN Points Section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mb-16"
          >
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 shadow-xl overflow-hidden">
              <div className="p-8 border-b border-white/10">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg">
                    <Coins className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-white">{t("about.fsnPoints.title")}</h2>
                    <p className="text-gray-400 text-lg">{t("about.virtualInAppCurrency")}</p>
                  </div>
                </div>
              </div>

              <div className="p-8">
                <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 rounded-2xl p-6 border border-yellow-500/20">
                  <p className="text-gray-300 text-lg leading-relaxed">
                    {t("about.fsnPoints.description")}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Battle Legend Game Section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mb-16"
          >
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 shadow-xl overflow-hidden">
              <div className="p-8 border-b border-white/10">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
                    <Gamepad2 className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-white">{t("about.battleLegend.title")}</h2>
                    <p className="text-gray-400 text-lg">{t("about.thrillingAdventuresAwait")}</p>
                  </div>
                </div>
              </div>

              <div className="p-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                  <div>
                    <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-2xl p-6 border border-purple-500/20">
                      <p className="text-gray-300 text-lg leading-relaxed mb-6">
                        {t("about.battleLegend.description")}
                      </p>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <CheckCircle className="w-5 h-5 text-green-400" />
                          <span className="text-white">{t("about.competeWithOtherPlayers")}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <CheckCircle className="w-5 h-5 text-green-400" />
                          <span className="text-white">{t("about.winExcitingRewards")}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <CheckCircle className="w-5 h-5 text-green-400" />
                          <span className="text-white">{t("about.allWithinTheApp")}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="w-48 h-48 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-2xl flex items-center justify-center mx-auto border border-purple-500/30">
                      <Play className="w-16 h-16 text-purple-400" />
                    </div>
                    <p className="text-gray-400 mt-4">{t("about.comingSoon")}</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Platform Benefits */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="mb-16"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-xl text-center">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{t("about.safeAndSecure")}</h3>
                <p className="text-gray-400 text-sm">{t("about.yourDataAndRewardsProtected")}</p>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-xl text-center">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{t("about.fastAndSmooth")}</h3>
                <p className="text-gray-400 text-sm">{t("about.optimizedForBestExperience")}</p>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-xl text-center">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{t("about.community")}</h3>
                <p className="text-gray-400 text-sm">{t("about.joinOurGrowingCommunity")}</p>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-xl text-center">
                <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <Award className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{t("about.rewards")}</h3>
                <p className="text-gray-400 text-sm">{t("about.earnWhileHavingFun")}</p>
              </div>
            </div>
          </motion.div>

          {/* Conclusion & CTA */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }}
            className="text-center"
          >
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-12 border border-white/20 shadow-xl">
              <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Heart className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-4">{t("about.readyToGetStarted")}</h2>
              <p className="text-gray-300 text-lg leading-relaxed mb-8 max-w-3xl mx-auto">
                {t("about.join")}
              </p>
              <button className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-8 py-4 rounded-xl font-bold text-lg hover:from-blue-600 hover:to-purple-600 transition-colors flex items-center gap-3 mx-auto">
                <ArrowRight className="w-5 h-5" />
                {t("about.getStartedToday")}
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AboutUs;
