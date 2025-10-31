import { useEffect, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
} from 'firebase/auth';
import { auth, db } from '../firebase';
import {
  doc,
  setDoc,
  updateDoc,
  serverTimestamp,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  Timestamp,
  arrayUnion,
  increment,
} from 'firebase/firestore';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { requestPermissionAndToken } from '../utils/pushNotification';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n';
import { Spinner } from '../components/ui/spinner';
import { getFirebaseErrorMessage } from '../utils/firebaseErrors';
import fsnLogo from '../assets/fsn-logo.png';
import LanguageSwitcher from '../components/LanguageSwitcher';
// import AppleSignInService from '../services/appleSignInService';
import GoogleSignInService from '../services/googleSignInService';
import { isPlatformIOS } from '../utils/pwaUtils';
import GiftService from '../components/admin/Gifts/GiftService';
import { getMaxReferralsFromTiers } from '../utils/rewardsService';

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
  const [emailLoading, setEmailLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  // const [appleLoading, setAppleLoading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setLogoSpin(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const refFromUrl = searchParams.get('ref');
    if (refFromUrl) setReferralCode(refFromUrl);
  }, [searchParams]);

  // Note: Redirect handling is no longer needed with Capacitor Firebase Authentication

  useEffect(() => {
    document.documentElement.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
  }, [i18n.language]);

  const sendWelcomeMessage = async (uid: string) => {
    try {
      // Use secure cloud function to grant welcome bonus
      await GiftService.grantWelcomeBonus(uid, 100, 'New user registration bonus');
    } catch (error) {
      console.error('Failed to grant welcome bonus:', error);
      // Fallback: try to add welcome message manually if cloud function fails
      try {
        const inboxRef = doc(db, 'users', uid, 'inbox', 'welcome');
        const inboxSnap = await getDoc(inboxRef);

        if (!inboxSnap.exists()) {
          await setDoc(inboxRef, {
            title: t('welcomeBonus.title'),
            body: t('welcomeBonus.body', { amount: 100 }),
            timestamp: Date.now(),
            read: false,
            claimed: false,
            amount: 100,
            type: 'welcome_bonus',
          });
        }
      } catch (fallbackError) {
        console.error('Fallback welcome message also failed:', fallbackError);
      }
    }
  };

  const registerReferral = async (referredCode: string, referredEmail: string) => {
    try {
      // console.log('🔍 Searching for referrer with code:', referredCode);
      // console.log('📧 Email to register:', referredEmail);

      // Check authentication status
      // const currentUser = auth.currentUser;
      // console.log('🔐 Current user authenticated:', !!currentUser);
      // console.log('🔐 Current user UID:', currentUser?.uid);

      const q = query(collection(db, 'users'), where('referralCode', '==', referredCode));
      const querySnapshot = await getDocs(q);

      let refUserRef = null;
      let refData = null;

      if (!querySnapshot.empty) {
        const refUser = querySnapshot.docs[0];
        refUserRef = refUser.ref;
        refData = refUser.data();
        // console.log('✅ Found referrer by referral code:', refUser.id);
        // console.log('🔍 Referrer document path:', refUserRef.path);
      } else {
        console.log('🔍 Trying alternative lookup by UID...');
        const altRef = doc(db, 'users', referredCode);
        const altSnap = await getDoc(altRef);
        if (altSnap.exists()) {
          refUserRef = altRef;
          refData = altSnap.data();
          // console.log('✅ Found referrer by UID:', referredCode);
          // console.log('🔍 Referrer document path:', refUserRef.path);
        }
      }

      if (refUserRef && refData) {
        // Check referral limit before adding new referral
        const maxReferrals = await getMaxReferralsFromTiers();
        const currentReferrals = refData.referrals || 0;

        if (currentReferrals >= maxReferrals) {
          console.warn('⚠️ Referral limit reached for user:', refUserRef.id, 'Current:', currentReferrals, 'Max:', maxReferrals);
          throw new Error(`Maximum referral limit of ${maxReferrals} reached`);
        }

        // console.log('📝 Updating referrer document:', refUserRef.id);
        // console.log('📊 Current referral count:', currentReferrals);
        // console.log('📊 Current referral list length:', (refData.referralList || []).length);

        // Log the exact data we're trying to update
        const updateData = {
          referralList: arrayUnion({
            email: referredEmail,
            status: 'Pending',
            timestamp: Date.now(),
          }),
          referrals: increment(1),
        };
        // console.log('📝 Update data:', updateData);

        // Use updateDoc with FieldValue.increment to properly update referrals count
        await updateDoc(refUserRef, updateData);
        // console.log('✅ Referral registered successfully with count increment.');
      } else {
        console.warn('⚠️ No matching referrer found for code:', referredCode);
      }
    } catch (err: any) {
      console.error('❌ Failed to update referral list:', err);
      console.error('🔍 Error details:', err.message);
      console.error('🔍 Error code:', err.code);
      console.error('🔍 Full error object:', err);
      throw err; // Re-throw to handle in calling function
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

      // console.log('🔍 Final referral code:', finalReferral);
      // console.log('🔍 User email:', email);

      if (finalReferral) {
        // console.log('🔄 Registering referral...');
        try {
          await registerReferral(finalReferral, email);
        } catch (referralError: any) {
          console.error('❌ Referral registration failed:', referralError);
          // Continue with signup even if referral fails, but log the error
          // Don't block user registration due to referral limit
        }
      } else {
        // console.log('ℹ️ No referral code provided');
      }

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
    setError('');
    setGoogleLoading(true);
    try {
      // console.log('🔍 Starting Google Sign In from SignupPage...');
      const result = await GoogleSignInService.signIn(referralCode);
      
      if (result.success) {
        // Google Sign In successful, navigate to dashboard
        navigate('/dashboard');
      } else {
        setError(result.error || 'Google Sign In failed');
      }
    } catch (err: any) {
      console.error('Google signup error:', err);
      setError(err.message || 'Google Sign In failed');
    } finally {
      setGoogleLoading(false);
    }
  };

  // const handleAppleSignup = async () => {
  //   setError('');
  //   setAppleLoading(true);
  //   try {
  //     const result = await AppleSignInService.signIn(referralCode);
      
  //     if (result.success) {
  //       // Apple Sign In successful, navigate to dashboard
  //       navigate('/dashboard');
  //     } else {
  //       setError(result.error || 'Apple Sign In failed');
  //     }
  //   } catch (err: any) {
  //     console.error('Apple signup error:', err);
  //     setError(err.message || 'Apple Sign In failed');
  //   } finally {
  //     setAppleLoading(false);
  //   }
  // };

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

              <p className="text-center text-sm text-gray-300">
                {t('auth.bySigningUp')}{' '}
                <Link to="/terms" className="text-purple-400 hover:text-purple-300 transition">
                  {t('auth.terms')}
                </Link>
                {' '}{t('auth.and')}{' '}
                <Link to="/privacy-policy" className="text-purple-400 hover:text-purple-300 transition">
                  {t('auth.privacy')}
                </Link>
              </p>

              <button
                type="submit"
                disabled={emailLoading}
                className={`w-full py-3 rounded-lg font-semibold transition flex justify-center items-center mt-2 ${
                  !emailLoading
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

              {/* Google Sign In Button - Hide on iOS devices */}
              {!isPlatformIOS() && (
                <button
                  type="button"
                  onClick={handleGoogleSignup}
                  disabled={googleLoading
                    //  || appleLoading
                    }
                  className={`w-full py-3 rounded-lg font-semibold transition flex justify-center items-center ${
                    !googleLoading
                    //  && !appleLoading
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
              )}

              {/* Apple Sign In Button - Only show on iOS devices */}
              {/* {isPlatformIOS() && (
                <button
                  type="button"
                  onClick={handleAppleSignup}
                  disabled={!acceptedTerms || googleLoading || appleLoading}
                  className={`w-full py-3 rounded-lg font-semibold transition flex justify-center items-center mt-3 ${
                    acceptedTerms && !googleLoading && !appleLoading
                      ? 'bg-black text-white hover:bg-gray-800'
                      : 'bg-gray-700/50 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {appleLoading ? (
                    <>
                      <Spinner size="sm" color="white" className="mr-2" />
                      {t('auth.pleaseWait')}
                    </>
                  ) : (
                    <>
                      <svg
                        className="w-5 h-5 mr-2"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.11-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                      </svg>
                      {t('auth.signUpWithApple')}
                    </>
                  )}
                </button>
              )} */}

              <p className="text-center text-sm text-gray-400 mt-4">
                {t('auth.haveAccount')}{' '}
                <Link to="/login" className="text-purple-400 hover:text-purple-300 transition">
                  {t('auth.login')}
                </Link>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
