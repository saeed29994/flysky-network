import { useEffect, useState } from 'react';
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
} from 'firebase/auth';
import { auth, db } from '../firebase';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { getFirebaseErrorMessage } from '../utils/firebaseErrors';
import { requestPermissionAndToken } from '../utils/pushNotification';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp, collection, query, where, getDocs, Timestamp, arrayUnion, increment } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n';
import { v4 as uuidv4 } from 'uuid';
import { Spinner } from '../components/ui/spinner';
import fsnLogo from '../assets/fsn-logo.png';
import LanguageSwitcher from '../components/LanguageSwitcher';

const LoginPage = () => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [logoSpin, setLogoSpin] = useState(true);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [referralCode, setReferralCode] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setLogoSpin(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    document.documentElement.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
  }, [i18n.language]);

  useEffect(() => {
    const refFromUrl = searchParams.get('ref');
    if (refFromUrl) setReferralCode(refFromUrl);
  }, [searchParams]);

  const sendWelcomeMessage = async (uid: string) => {
    const inboxRef = doc(db, 'users', uid, 'inbox', 'welcome');
    const inboxSnap = await getDoc(inboxRef);

    if (!inboxSnap.exists()) {
      await setDoc(inboxRef, {
        title: t('welcomeBonus.title'),
        body: t('welcomeBonus.body', { amount: 500 }),
        timestamp: Date.now(),
        read: false,
        claimed: false,
        amount: 500,
        type: 'welcome_bonus',
      });
    }
  };

  const registerReferral = async (referredCode: string, referredEmail: string) => {
    try {
      const q = query(collection(db, 'users'), where('referralCode', '==', referredCode));
      const querySnapshot = await getDocs(q);

      let refUserRef = null;
      let refData = null;

      if (!querySnapshot.empty) {
        const refUser = querySnapshot.docs[0];
        refUserRef = refUser.ref;
        refData = refUser.data();
      } else {
        const altRef = doc(db, 'users', referredCode);
        const altSnap = await getDoc(altRef);
        if (altSnap.exists()) {
          refUserRef = altRef;
          refData = altSnap.data();
        }
      }

      if (refUserRef && refData) {
        // Use updateDoc with FieldValue.increment to properly update referrals count
        await updateDoc(refUserRef, {
          referralList: arrayUnion({
            email: referredEmail,
            status: 'Pending',
            timestamp: Date.now(),
          }),
          referrals: increment(1),
        });
        console.log('✅ Referral registered successfully with count increment.');
      } else {
        console.warn('⚠️ No matching referrer found for code:', referredCode);
      }
    } catch (err) {
      console.error('❌ Failed to update referral list:', err);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setEmailLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Request notification permission
      await requestPermissionAndToken(user.uid);

      if (user.emailVerified) {
        // If email is verified, go to dashboard
        navigate('/dashboard');
      } else {
        // If email is not verified, go to verification page
        navigate('/verify-email');
      }
    } catch (err: any) {
      console.error(err);
      setError(getFirebaseErrorMessage(err.code));
    } finally {
      setEmailLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setGoogleLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);

      // Request notification permission
      await requestPermissionAndToken(user.uid);

      if (!userSnap.exists()) {
        // New user registration via Google
        const generatedReferralCode = uuidv4().slice(0, 8);
        const finalReferral = referralCode.trim();

        await setDoc(userRef, {
          fullName: user.displayName || '',
          email: user.email || '',
          balance: 0,
          watchedAdsToday: 0,
          adsLastWatched: Timestamp.fromMillis(0),
          plan: 'economy',
          createdAt: serverTimestamp(),
          referralCode: generatedReferralCode,
          referredBy: finalReferral || '',
          language: 'en',
          theme: 'dark',
          kycStatus: 'Not Actived',
          dailyMined: 0,
          lockedFromStaking: 0,
          stakingEarnings: 0,
          referralReward: 0,
          referrals: 0,
          agreedToTerms: true,
          transactionHistory: [],
        });

        if (finalReferral) await registerReferral(finalReferral, user.email || '');
        await sendWelcomeMessage(user.uid);
      }

      // Google users go directly to dashboard (already verified)
      navigate('/dashboard');
    } catch (err: any) {
      console.error('Google login error:', err);
      setError(getFirebaseErrorMessage(err.code));
    } finally {
      setGoogleLoading(false);
    }
  };

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
              className={`w-16 h-16 ${logoSpin ? 'animate-spin-slow' : ''}`}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-purple-600 rounded-full opacity-30 blur-md"></div>
          </div>
          <h1 className="text-3xl font-bold mt-4">
            <span className="text-amber-400">Fly</span>
            <span className="text-purple-400">Sky</span>{' '}
            <span className="text-white">Network</span>
          </h1>
        </div>

        <div className="bg-gray-900/80 backdrop-blur-md border border-white/10 rounded-xl shadow-2xl overflow-hidden">
          <div className="px-6 py-8">
            <h2 className="text-2xl font-bold mb-6 text-center text-white">{t('auth.loginTitle')}</h2>

            {error && (
              <div className="mb-6 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
                <p className="text-red-300 text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <input
                  type="email"
                  placeholder={t('auth.email')}
                  className="w-full p-3 bg-gray-800/70 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div>
                <input
                  type="password"
                  placeholder={t('auth.password')}
                  className="w-full p-3 bg-gray-800/70 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <div className="text-right">
                <Link to="/forgot-password" className="text-sm text-purple-300 hover:text-purple-200 transition">
                  {t('auth.forgotPassword')}
                </Link>
              </div>

              <button
                type="submit"
                disabled={emailLoading || googleLoading}
                className="w-full py-3 bg-gradient-to-r from-amber-500 to-purple-600 hover:from-amber-400 hover:to-purple-500 text-white font-semibold rounded-lg transition flex items-center justify-center"
              >
                {emailLoading ? (
                  <>
                    <Spinner size="sm" color="white" className="mr-2" />
                    {t('auth.loggingIn')}
                  </>
                ) : (
                  t('auth.login')
                )}
              </button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-600"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-3 bg-gray-900/80 text-gray-400">{t('auth.or')}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={emailLoading || googleLoading}
              className="w-full py-3 bg-white text-gray-800 font-semibold rounded-lg hover:bg-gray-100 transition flex items-center justify-center"
            >
              {googleLoading ? (
                <>
                  <Spinner size="sm" color="primary" className="mr-2" />
                  {t('auth.pleaseWait')}
                </>
              ) : (
                <>
                  <img
                    src="https://developers.google.com/identity/images/g-logo.png"
                    alt="Google Logo"
                    className="w-5 h-5 mr-3"
                  />
                  {t('auth.loginWithGoogle')}
                </>
              )}
            </button>

            <p className="mt-6 text-sm text-gray-400 text-center">
              {t('auth.noAccount')}{' '}
              <Link to="/signup" className="text-purple-400 hover:text-purple-300 transition">
                {t('auth.signUp')}
              </Link>
            </p>
          </div>
        </div>


      </div>
    </div>
  );
};

export default LoginPage;
