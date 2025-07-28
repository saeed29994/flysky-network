import { useState } from 'react';
import { 
  Upload, 
  Shield, 
  CheckCircle, 
  AlertCircle, 
  Camera, 
  FileText, 
  User,
  Clock,
  Info,
  ArrowRight
} from 'lucide-react';
import { auth, db } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import uploadToCloudinary from '../utils/uploadToCloudinary';
import IDFront from '../assets/id_front.jpg';
import IDBack from '../assets/id_back.jpg';
import IDSelfie from '../assets/selfie-sample.jpg';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';

const KycPage = () => {
  const { t } = useTranslation();
  const [idFront, setIdFront] = useState<File | null>(null);
  const [idBack, setIdBack] = useState<File | null>(null);
  const [selfie, setSelfie] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async () => {
    if (!idFront || !idBack || !selfie) {
      setMessage(t('kyc.uploadAllDocuments'));
      return;
    }

    setUploading(true);
    try {
      const [frontUrl, backUrl, selfieUrl] = await Promise.all([
        uploadToCloudinary(idFront),
        uploadToCloudinary(idBack),
        uploadToCloudinary(selfie),
      ]);

      const user = auth.currentUser;
      if (!user) return;

      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        kycStatus: 'Pending',
        kycDocuments: {
          idFront: frontUrl,
          idBack: backUrl,
          selfie: selfieUrl,
        },
      });

      setMessage(t('kyc.uploadSuccess'));
    } catch (err) {
      console.error(err);
      setMessage(t('kyc.uploadFailed'));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="w-full bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 min-h-screen">
      {/* Professional Header Section */}
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
        
        <div className="relative px-4 py-8 lg:py-12">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-8 lg:mb-12">
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="w-20 h-20 lg:w-24 lg:h-24 mx-auto mb-6 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-2xl"
              >
                <Shield className="w-10 h-10 lg:w-12 lg:h-12 text-white" />
              </motion.div>
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="text-3xl lg:text-5xl font-bold text-white mb-4 tracking-tight"
              >
                🛡️ {t('kyc.title')}
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="text-gray-300 text-lg lg:text-xl max-w-3xl mx-auto leading-relaxed"
              >
                Complete your identity verification to unlock premium features and ensure account security
              </motion.p>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto px-4 pb-12">
        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
          
          {/* Left Column - Main Content (8 columns on xl) */}
          <div className="xl:col-span-8 space-y-8">
            
            {/* Accepted IDs Section */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 shadow-xl overflow-hidden"
            >
              <div className="p-6 border-b border-white/10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">{t('kyc.idsAccepted.title')}</h2>
                    <p className="text-gray-400">Accepted identification documents</p>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    t('kyc.idsAccepted.option1'),
                    t('kyc.idsAccepted.option2'),
                    t('kyc.idsAccepted.option3'),
                    t('kyc.idsAccepted.option4')
                  ].map((item, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/10">
                      <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                      <span className="text-gray-300 text-sm">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* ID Photos Requirements */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 shadow-xl overflow-hidden"
            >
              <div className="p-6 border-b border-white/10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
                    <Camera className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">{t('kyc.idPhotos.title')}</h2>
                    <p className="text-gray-400">Photo requirements for ID documents</p>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <div className="space-y-3 mb-4">
                      {[
                        t('kyc.idPhotos.option1'),
                        t('kyc.idPhotos.option2'),
                        t('kyc.idPhotos.option3'),
                        t('kyc.idPhotos.option4')
                      ].map((item, index) => (
                        <div key={index} className="flex items-start gap-3">
                          <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                          <span className="text-gray-300 text-sm">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <img src={IDFront} alt="ID Front Sample" className="rounded-xl shadow-lg w-full border-2 border-white/20" />
                      <p className="text-sm text-gray-400 mt-2">{t('kyc.samples.front')}</p>
                    </div>
                    <div className="text-center">
                      <img src={IDBack} alt="ID Back Sample" className="rounded-xl shadow-lg w-full border-2 border-white/20" />
                      <p className="text-sm text-gray-400 mt-2">{t('kyc.samples.back')}</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Selfie Requirements */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 shadow-xl overflow-hidden"
            >
              <div className="p-6 border-b border-white/10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">{t('kyc.selfie.title')}</h2>
                    <p className="text-gray-400">Selfie photo requirements</p>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <div className="space-y-3">
                      {[
                        t('kyc.selfie.option1'),
                        t('kyc.selfie.option2'),
                        t('kyc.selfie.option3'),
                        t('kyc.selfie.option4'),
                        t('kyc.selfie.option5')
                      ].map((item, index) => (
                        <div key={index} className="flex items-start gap-3">
                          <div className="w-2 h-2 bg-purple-400 rounded-full mt-2 flex-shrink-0"></div>
                          <span className="text-gray-300 text-sm">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="text-center">
                    <img src={IDSelfie} alt="Selfie Sample" className="rounded-xl shadow-lg w-48 mx-auto border-2 border-white/20" />
                    <p className="text-sm text-gray-400 mt-2">{t('kyc.samples.selfie')}</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Upload Section */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 shadow-xl overflow-hidden"
            >
              <div className="p-6 border-b border-white/10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                    <Upload className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">{t('kyc.uploadSection.title')}</h2>
                    <p className="text-gray-400">Upload your verification documents</p>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-6">
                  {[
                    { label: t('kyc.uploadSection.front'), file: idFront, setFile: setIdFront },
                    { label: t('kyc.uploadSection.back'), file: idBack, setFile: setIdBack },
                    { label: t('kyc.uploadSection.selfie'), file: selfie, setFile: setSelfie }
                  ].map((item, index) => (
                    <div key={index}>
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-3">
                        <Upload size={16} className="text-yellow-400" />
                        {item.label}
                      </label>
                      <div className="relative">
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={(e) => item.setFile(e.target.files?.[0] || null)} 
                          className="w-full p-4 rounded-xl bg-white/10 border border-white/20 text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-gradient-to-r file:from-yellow-500 file:to-orange-500 file:text-black hover:file:from-yellow-600 hover:file:to-orange-600 transition-all duration-300" 
                        />
                        {item.file && (
                          <div className="mt-2 flex items-center gap-2 text-green-400 text-sm">
                            <CheckCircle className="w-4 h-4" />
                            {item.file.name}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  <button
                    onClick={handleSubmit}
                    disabled={uploading}
                    className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 disabled:from-gray-600 disabled:to-gray-700 text-black font-bold py-4 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none flex items-center justify-center gap-3"
                  >
                    {uploading ? (
                      <>
                        <div className="w-6 h-6 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
                        {t('kyc.uploading')}
                      </>
                    ) : (
                      <>
                        <ArrowRight className="w-5 h-5" />
                        {t('kyc.submit')}
                      </>
                    )}
                  </button>
                  
                  {message && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-green-500/20 border border-green-500/30 rounded-xl p-4"
                    >
                      <p className="text-green-400 text-sm">{message}</p>
                    </motion.div>
                  )}
                </div>
              </div>
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
              {/* FAQ Section */}
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-xl">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
                    <Info className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">{t('kyc.faq.title')}</h3>
                    <p className="text-sm text-gray-400">Common questions</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {[
                    { q: t('kyc.faq.q1'), a: t('kyc.faq.a1') },
                    { q: t('kyc.faq.q2'), a: t('kyc.faq.a2') },
                    { q: t('kyc.faq.q3'), a: t('kyc.faq.a3') },
                    { q: t('kyc.faq.q4'), a: t('kyc.faq.a4') },
                    { q: t('kyc.faq.q5'), a: t('kyc.faq.a5') }
                  ].map((item, index) => (
                    <div key={index} className="bg-white/5 rounded-xl p-4 border border-white/10">
                      <p className="text-white font-semibold text-sm mb-2">{item.q}</p>
                      <p className="text-gray-400 text-xs leading-relaxed">{item.a}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Disclaimer */}
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-xl">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                    <AlertCircle className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">{t('kyc.disclaimer.title')}</h3>
                  </div>
                </div>
                <p className="text-gray-400 text-sm leading-relaxed">{t('kyc.disclaimer.content')}</p>
              </div>

              {/* Processing Time */}
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-xl">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg">
                    <Clock className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Processing Time</h3>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="bg-green-500/20 border border-green-500/30 rounded-xl p-3">
                    <p className="text-green-400 font-semibold text-sm">24-48 Hours</p>
                    <p className="text-gray-400 text-xs">Typical processing time</p>
                  </div>
                  <p className="text-gray-400 text-xs leading-relaxed">
                    Your documents will be reviewed by our verification team. You'll receive a notification once the process is complete.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KycPage;
