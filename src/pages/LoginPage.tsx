import { useEffect, useState } from 'react';
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
} from 'firebase/auth';
import { auth, db } from '../firebase';
import { useNavigate, Link } from 'react-router-dom';
import { getFirebaseErrorMessage } from '../utils/firebaseErrors';
import { requestPermissionAndToken } from '../utils/pushNotification';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n';

const LoginPage = () => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [logoSpin, setLogoSpin] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      setLogoSpin(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    document.documentElement.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
  }, [i18n.language]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      if (user.emailVerified) {
        await requestPermissionAndToken(user.uid);
        navigate('/dashboard');
      } else {
        navigate('/verify-email');
      }
    } catch (err: any) {
      console.error(err);
      setError(getFirebaseErrorMessage(err.code));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (!userDoc.exists()) {
        await setDoc(doc(db, 'users', user.uid), {
          fullName: user.displayName || '',
          email: user.email || '',
          balance: 0,
          plan: 'economy',
          createdAt: serverTimestamp(),
          referralCode: '',
          referredBy: '',
          language: 'en',
          theme: 'dark',
          kycStatus: 'Not Actived',
          miningStartTime: null,
          dailyMined: 0,
          lockedFromStaking: 0,
          stakingEarnings: 0,
          referralReward: 0,
          referrals: 0,
          transactionHistory: [
            {
              description: 'Initial balance record (empty)',
              timestamp: Date.now(),
            },
          ],
        });

        await setDoc(doc(db, 'users', user.uid, 'inbox', 'welcome'), {
          title: t('inbox.welcomeTitle'),
          body: t('inbox.welcomeBody'),
          timestamp: Date.now(),
          read: false,
          claimed: false,
          amount: 500,
          type: 'welcome_bonus',
        });
      }

      await requestPermissionAndToken(user.uid);
      navigate('/dashboard');
    } catch (err: any) {
      console.error('Google login error:', err);
      const errMsg = err?.message || '';
      if (errMsg.includes('A problem occurred while') || errMsg.includes('popup')) {
        setError(t('auth.googlePopupError'));
      } else {
        setError(t('auth.googleGenericError'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-4">
      <div className="flex items-center mb-6 space-x-3 sm:space-x-5">
        <img
          src="/fsn-logo.png"
          alt="FSN Logo"
          className={`w-12 h-12 sm:w-16 sm:h-16 ${logoSpin ? 'animate-spin-slow' : ''}`}
        />
        <h1 className="text-2xl sm:text-4xl font-extrabold text-center">
          <span className="text-yellow-400">Fly</span>
          <span className="text-sky-400">Sky</span>{' '}
          <span className="text-yellow-400">Network</span>
        </h1>
      </div>

      <form
        onSubmit={handleLogin}
        className="bg-gray-900 p-6 rounded-lg shadow-md w-full max-w-md text-white"
      >
        <h2 className="text-2xl font-bold mb-4 text-yellow-400">{t('auth.loginTitle')}</h2>

        {error && <p className="text-red-400 mb-4 text-sm">{error}</p>}

        <input
          type="email"
          placeholder={t('auth.email')}
          className="w-full p-2 mb-3 rounded bg-gray-800 border border-gray-700"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder={t('auth.password')}
          className="w-full p-2 mb-2 rounded bg-gray-800 border border-gray-700"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <div className="text-right mb-4">
          <Link to="/forgot-password" className="text-sm text-yellow-400 hover:underline">
            {t('auth.forgotPassword')}
          </Link>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="bg-yellow-500 hover:bg-yellow-400 text-black w-full py-2 rounded font-semibold transition"
        >
          {loading ? t('auth.loggingIn') : t('auth.login')}
        </button>

        <div className="text-center text-white my-4">{t('auth.or')}</div>

        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading}
          className="flex items-center justify-center bg-white text-black py-2 px-4 rounded font-semibold shadow hover:bg-gray-100 transition w-full"
        >
          <img
            src="https://developers.google.com/identity/images/g-logo.png"
            alt="Google Logo"
            className="w-5 h-5 mr-3"
          />
          {loading ? t('auth.pleaseWait') : t('auth.loginWithGoogle')}
        </button>

        <p className="mt-4 text-sm text-gray-400 text-center">
          {t('auth.noAccount')}{' '}
          <Link to="/signup" className="text-yellow-400 hover:underline">
            {t('auth.signUp')}
          </Link>
        </p>
      </form>

      {/* Language Selector */}
      <div className="mt-4">
        <select
          onChange={(e) => i18n.changeLanguage(e.target.value)}
          defaultValue={i18n.language}
          className="bg-gray-800 text-white px-3 py-1 rounded border border-gray-600"
        >
          <option value="en">English</option>
          <option value="ar">العربية</option>
        </select>
      </div>
    </div>
  );
};

export default LoginPage;
