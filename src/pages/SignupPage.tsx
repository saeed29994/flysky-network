import { useEffect, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signInWithPopup,
  GoogleAuthProvider,
} from 'firebase/auth';
import { auth, db } from '../firebase';
import {
  doc,
  setDoc,
  serverTimestamp,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  Timestamp,
} from 'firebase/firestore';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { requestPermissionAndToken } from '../utils/pushNotification';
import { sendNotification as sendFCMNotification } from '../utils/sendNotification';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n';
import { Spinner } from '../components/ui/spinner';
import { getFirebaseErrorMessage } from '../utils/firebaseErrors';
import fsnLogo from '../assets/fsn-logo.png';

const SignupPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [error, setError] = useState('');
  const [logoSpin, setLogoSpin] = useState(true);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setLogoSpin(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const refFromUrl = searchParams.get('ref');
    if (refFromUrl) setReferralCode(refFromUrl);
  }, [searchParams]);

  useEffect(() => {
    document.documentElement.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
  }, [i18n.language]);

  const sendWelcomeMessage = async (uid: string) => {
    const inboxRef = doc(db, 'users', uid, 'inbox', 'welcome');
    const inboxSnap = await getDoc(inboxRef);

    if (!inboxSnap.exists()) {
      await setDoc(inboxRef, {
        title: '🎉 Welcome to FlySky Network!',
        body: 'You\'ve earned a 500 FSN welcome bonus. Click below to claim your reward',
        timestamp: Date.now(),
        read: false,
        claimed: false,
        amount: 500,
        type: 'welcome_bonus',
      });

      await sendFCMNotification({
        title: '🎁 Welcome Bonus',
        body: 'You received a 500 FSN welcome reward!',
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
        const referralList = refData.referralList || [];
        referralList.push({
          email: referredEmail,
          status: 'Pending',
        });

        await setDoc(refUserRef, { referralList }, { merge: true });
        console.log('✅ Referral registered successfully.');
      } else {
        console.warn('⚠️ No matching referrer found for code:', referredCode);
      }
    } catch (err) {
      console.error('❌ Failed to update referral list:', err);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setEmailLoading(true);

    try {
      const finalReferral = referralCode.trim();

      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const generatedReferralCode = uuidv4().slice(0, 8);

      await setDoc(doc(db, 'users', user.uid), {
        fullName,
        email,
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

      if (finalReferral) await registerReferral(finalReferral, email);

      await sendWelcomeMessage(user.uid);
      await sendEmailVerification(user);
      await requestPermissionAndToken(user.uid);
      navigate('/verify-email');
    } catch (err: any) {
      console.error(err);
      setError(getFirebaseErrorMessage(err.code));
    } finally {
      setEmailLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    try {
      setGoogleLoading(true);
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        const generatedReferralCode = uuidv4().slice(0, 8);

        await setDoc(userRef, {
          fullName: user.displayName || '',
          email: user.email || '',
          balance: 0,
          watchedAdsToday: 0,
          adsLastWatched: Timestamp.fromMillis(0),
          plan: 'economy',
          createdAt: serverTimestamp(),
          referralCode: generatedReferralCode,
          referredBy: referralCode.trim() || '',
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

        if (referralCode.trim()) await registerReferral(referralCode.trim(), user.email || '');
        await sendWelcomeMessage(user.uid);
        await requestPermissionAndToken(user.uid);
      }

      navigate('/dashboard');
    } catch (err: any) {
      console.error(err);
      setError(getFirebaseErrorMessage(err.code));
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex flex-col items-center justify-center p-4">
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
          <h2 className="text-xl font-medium mt-2 text-gray-200">{t('auth.createAccount')}</h2>
        </div>

        <div className="bg-gray-900/80 backdrop-blur-md border border-white/10 rounded-xl shadow-2xl overflow-hidden">
          <div className="px-6 py-8">
            {error && (
              <div className="mb-6 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
                <p className="text-red-300 text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handleSignup} className="space-y-4">
              <div>
                <input 
                  type="text" 
                  placeholder={t('auth.fullName')} 
                  value={fullName} 
                  onChange={(e) => setFullName(e.target.value)} 
                  required 
                  className="w-full p-3 bg-gray-800/70 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500"
                />
              </div>
              
              <div>
                <input 
                  type="email" 
                  placeholder={t('auth.email')} 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  required 
                  className="w-full p-3 bg-gray-800/70 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500"
                />
              </div>
              
              <div>
                <input 
                  type="password" 
                  placeholder={t('auth.password')} 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  required 
                  className="w-full p-3 bg-gray-800/70 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500"
                />
              </div>
              
              <div>
                <input 
                  type="text" 
                  placeholder={t('auth.referralCode')} 
                  value={referralCode} 
                  onChange={(e) => setReferralCode(e.target.value)} 
                  className="w-full p-3 bg-gray-800/70 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500"
                />
              </div>

              <label className="flex items-center space-x-2 cursor-pointer text-gray-300">
                <input 
                  type="checkbox" 
                  checked={acceptedTerms} 
                  onChange={(e) => setAcceptedTerms(e.target.checked)} 
                  required 
                  className="rounded bg-gray-800 border-gray-600 text-purple-500 focus:ring-purple-500/30"
                />
                <span className="text-sm">
                  {t('auth.agreeTo')}{' '}
                  <Link to="/terms" className="text-purple-400 hover:text-purple-300 transition">
                    {t('auth.terms')}
                  </Link>
                </span>
              </label>

              <button
                type="submit"
                disabled={!acceptedTerms || emailLoading}
                className={`w-full py-3 rounded-lg font-semibold transition flex justify-center items-center mt-2 ${
                  acceptedTerms && !emailLoading
                    ? 'bg-gradient-to-r from-amber-500 to-purple-600 hover:from-amber-400 hover:to-purple-500 text-white'
                    : 'bg-gray-700/50 text-gray-400 cursor-not-allowed'
                }`}
              >
                {emailLoading ? (
                  <>
                    <Spinner size="sm" color="white" className="mr-2" />
                    {t('processing')}
                  </>
                ) : (
                  t('auth.signUp')
                )}
              </button>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-600"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-3 bg-gray-900/80 text-gray-400">{t('auth.or')}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleGoogleSignup}
                disabled={!acceptedTerms || googleLoading}
                className={`w-full py-3 rounded-lg font-semibold transition flex justify-center items-center ${
                  acceptedTerms && !googleLoading
                    ? 'bg-white text-gray-800 hover:bg-gray-100'
                    : 'bg-gray-700/50 text-gray-400 cursor-not-allowed'
                }`}
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
                      className="w-5 h-5 mr-2"
                    />
                    {t('auth.signUpWithGoogle')}
                  </>
                )}
              </button>

              <p className="text-center text-sm text-gray-400 mt-4">
                {t('auth.haveAccount')}{' '}
                <Link to="/login" className="text-purple-400 hover:text-purple-300 transition">
                  {t('auth.login')}
                </Link>
              </p>
            </form>
          </div>
        </div>

        <div className="mt-6 text-center">
          <select
            onChange={(e) => i18n.changeLanguage(e.target.value)}
            defaultValue={i18n.language}
            className="bg-gray-800/50 text-white px-4 py-2 rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
          >
            <option value="en">English</option>
            <option value="ar">العربية</option>
            <option value="zh">🇨🇳 中文</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
