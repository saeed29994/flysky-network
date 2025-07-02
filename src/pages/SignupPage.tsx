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
} from 'firebase/firestore';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { requestPermissionAndToken } from '../utils/pushNotification';
import { sendNotification as sendFCMNotification } from '../utils/sendNotification';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n';

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
        body: 'You’ve earned a 500 FSN welcome bonus. Click below to claim your reward',
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

    try {
      const finalReferral = referralCode.trim();

      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const generatedReferralCode = uuidv4().slice(0, 8);

      await setDoc(doc(db, 'users', user.uid), {
        fullName,
        email,
        balance: 500,
        plan: 'economy',
        createdAt: serverTimestamp(),
        referralCode: generatedReferralCode,
        referredBy: finalReferral || '',
        language: 'en',
        theme: 'dark',
        kycStatus: 'Not Actived',
        miningStartTime: serverTimestamp(),
        dailyMined: 0,
        lockedFromStaking: 0,
        stakingEarnings: 0,
        referralReward: 0,
        referrals: 0,
        agreedToTerms: true,
        transactionHistory: [
          {
            description: 'Initial balance record (500 FSN)',
            timestamp: Date.now(),
          },
        ],
      });

      if (finalReferral) await registerReferral(finalReferral, email);

      await sendWelcomeMessage(user.uid);
      await sendEmailVerification(user);
      await requestPermissionAndToken(user.uid);
      navigate('/verify-email');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Signup failed');
    }
  };

  const handleGoogleSignup = async () => {
    try {
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
          balance: 500,
          plan: 'economy',
          createdAt: serverTimestamp(),
          referralCode: generatedReferralCode,
          referredBy: referralCode.trim() || '',
          language: 'en',
          theme: 'dark',
          kycStatus: 'Not Actived',
          miningStartTime: serverTimestamp(),
          dailyMined: 0,
          lockedFromStaking: 0,
          stakingEarnings: 0,
          referralReward: 0,
          referrals: 0,
          agreedToTerms: true,
          transactionHistory: [
            {
              description: 'Initial balance record (500 FSN)',
              timestamp: Date.now(),
            },
          ],
        });

        if (referralCode.trim()) await registerReferral(referralCode.trim(), user.email || '');
        await sendWelcomeMessage(user.uid);
        await requestPermissionAndToken(user.uid);
      }

      navigate('/verify-email');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Google signup failed');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-slate-900 to-slate-800 text-white p-6">
      <img
        src="/fsn-logo.png"
        alt="Logo"
        className={`w-20 h-20 mb-2 ${logoSpin ? 'animate-spin-slow' : ''}`}
      />
      <h1 className="text-4xl font-bold mb-6">
        <span className="text-yellow-400">Fly</span>
        <span className="text-cyan-400">Sky</span>
        <span className="text-yellow-400"> Network</span>
      </h1>
      <h2 className="text-2xl font-semibold mb-6">{t('auth.createAccount')}</h2>

      <form onSubmit={handleSignup} className="w-full max-w-md space-y-4">
        <input type="text" placeholder={t('auth.fullName')} value={fullName} onChange={(e) => setFullName(e.target.value)} required className="w-full px-4 py-2 rounded-md bg-gray-700 text-white focus:outline-none" />
        <input type="email" placeholder={t('auth.email')} value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full px-4 py-2 rounded-md bg-gray-700 text-white focus:outline-none" />
        <input type="password" placeholder={t('auth.password')} value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full px-4 py-2 rounded-md bg-gray-700 text-white focus:outline-none" />
        <input type="text" placeholder={t('auth.referralCode')} value={referralCode} onChange={(e) => setReferralCode(e.target.value)} className="w-full px-4 py-2 rounded-md bg-gray-700 text-white focus:outline-none" />

        <label className="flex items-center text-sm text-gray-300">
          <input type="checkbox" checked={acceptedTerms} onChange={(e) => setAcceptedTerms(e.target.checked)} required className="mr-2" />
          {t('auth.agreeTo')}{' '}
          <Link to="/terms" className="text-yellow-400 underline">
            {t('auth.terms')}
          </Link>
        </label>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={!acceptedTerms}
          className={`w-full py-2 rounded-md font-semibold transition ${
            acceptedTerms
              ? 'bg-yellow-500 text-black hover:bg-yellow-400'
              : 'bg-gray-500 text-gray-300 cursor-not-allowed'
          }`}
        >
          {t('auth.signUp')}
        </button>

        <button
          type="button"
          onClick={handleGoogleSignup}
          disabled={!acceptedTerms}
          className={`w-full py-2 rounded-md font-semibold transition ${
            acceptedTerms
              ? 'bg-white text-black hover:bg-gray-200'
              : 'bg-gray-500 text-gray-300 cursor-not-allowed'
          }`}
        >
          {t('auth.signUpWithGoogle')}
        </button>

        <p className="text-center text-sm text-gray-400">
          {t('auth.haveAccount')}{' '}
          <Link to="/login" className="text-yellow-400">
            {t('auth.login')}
          </Link>
        </p>

        <div className="text-center pt-4">
          <select
            onChange={(e) => i18n.changeLanguage(e.target.value)}
            defaultValue={i18n.language}
            className="bg-gray-800 text-white px-3 py-1 rounded border border-gray-600"
          >
            <option value="en">English</option>
            <option value="ar">العربية</option>
          </select>
        </div>
      </form>
    </div>
  );
};

export default SignupPage;
