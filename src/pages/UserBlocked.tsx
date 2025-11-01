import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { FaBan, FaExclamationTriangle } from 'react-icons/fa';
import fsnLogo from '../assets/fsn-logo.png';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n';

const UserBlocked = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [blockReason, setBlockReason] = useState<string>('');

  useEffect(() => {
    document.documentElement.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
  }, []);

  useEffect(() => {
    const checkUserBlockStatus = async () => {
      const user = auth.currentUser;
      if (!user) {
        navigate('/login');
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          if (!userData.block) {
            // User is no longer blocked, redirect to dashboard
            navigate('/dashboard');
            return;
          }
          setBlockReason(userData.blockReason || 'Your account has been blocked by an administrator.');
        }
      } catch (error) {
        console.error('Error checking user block status:', error);
      }
    };

    checkUserBlockStatus();

    // Check every 30 seconds if user is still blocked
    const interval = setInterval(checkUserBlockStatus, 30000);
    return () => clearInterval(interval);
  }, [navigate]);


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex flex-col items-center justify-center p-4">
      <div className={`fixed top-6 ${i18n.language === 'ar' ? 'left-6' : 'right-6'} z-50`}>
        <LanguageSwitcher />
      </div>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="relative inline-block">
            <img
              src={fsnLogo}
              alt="FSN Logo"
              className="w-16 h-16"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-red-400 to-red-600 rounded-full opacity-30 blur-md"></div>
          </div>
          <h1 className="text-3xl font-bold mt-4 text-red-400">
            {t('userBlocked.title')}
          </h1>
          <p className="text-gray-400 mt-2">
            {t('userBlocked.subtitle')}
          </p>
        </div>

        <div className="bg-gray-900/80 backdrop-blur-md border border-red-500/20 rounded-xl shadow-2xl overflow-hidden">
          <div className="px-6 py-8">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaBan className="w-8 h-8 text-red-400" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">{t('userBlocked.title')}</h2>
              <p className="text-gray-400 text-sm">{t('userBlocked.subtitle')}</p>
            </div>

            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <FaExclamationTriangle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="text-red-400 font-semibold mb-2">{t('userBlocked.reason')}</h3>
                  <p className="text-red-300 text-sm leading-relaxed">
                    {blockReason}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white/5 rounded-lg p-4 mb-6">
              <h4 className="text-white font-semibold mb-2">{t('userBlocked.whatToDoTitle')}</h4>
              <ul className="text-gray-300 text-sm space-y-1">
                <li>• {t('userBlocked.contactSupport')}</li>
                <li>• {t('userBlocked.reviewTerms')}</li>
                <li>• {t('userBlocked.autoUnblock')}</li>
              </ul>
            </div>

            <div className="space-y-3">
              <p className="text-center text-gray-400 text-xs">
                {t('userBlocked.checkingStatus')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserBlocked;