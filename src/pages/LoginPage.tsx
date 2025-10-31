import { useEffect, useState } from 'react';
import {
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { auth, db } from '../firebase';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { getFirebaseErrorMessage } from '../utils/firebaseErrors';
import { requestPermissionAndToken } from '../utils/pushNotification';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n';
import { Spinner } from '../components/ui/spinner';
import fsnLogo from '../assets/fsn-logo.png';
import LanguageSwitcher from '../components/LanguageSwitcher';
// import AppleSignInService from '../services/appleSignInService';
import GoogleSignInService from '../services/googleSignInService';
import { isPlatformIOS } from '../utils/pwaUtils';
import { doc, getDoc } from 'firebase/firestore';

const LoginPage = () => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  // const [appleLoading, setAppleLoading] = useState(false);
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

  // Note: Redirect handling is no longer needed with Capacitor Firebase Authentication


  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setEmailLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Check if user is blocked
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData.block) {
          // Navigate to blocked page instead of showing error
          navigate('/user-blocked');
          setEmailLoading(false);
          return;
        }
      }

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
      // console.log('🔍 Starting Google Sign In from LoginPage...');
      const result = await GoogleSignInService.signIn(referralCode);

      if (result.success && result.user) {
        // Check if user is blocked
        const userDoc = await getDoc(doc(db, 'users', result.user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          if (userData.block) {
            // Navigate to blocked page instead of showing error
            navigate('/user-blocked');
            setGoogleLoading(false);
            return;
          }
        }

        // Google Sign In successful, navigate to dashboard
        navigate('/dashboard');
      } else if (result.error?.includes('Redirecting to Google Sign In')) {
        // For Android redirect, show loading message
        setError('Redirecting to Google Sign In...');
        // Don't set loading to false as we're redirecting
        return;
      } else {
        setError(result.error || 'Google Sign In failed');
      }
    } catch (err: any) {
      console.error('Google login error:', err);
      setError(err.message || 'Google Sign In failed');
    } finally {
      setGoogleLoading(false);
    }
  };

  // const handleAppleLogin = async () => {
  //   setError('');
  //   setAppleLoading(true);
    
  //   try {
  //     // Add timeout to prevent UI from hanging indefinitely
  //     const timeoutPromise = new Promise((_, reject) => {
  //       setTimeout(() => reject(new Error('Apple Sign In timed out after 45 seconds')), 45000);
  //     });
      
  //     const signInPromise = AppleSignInService.signIn(referralCode);
  //     const result = await Promise.race([signInPromise, timeoutPromise]) as any;
      
  //     if (result.success) {
  //       // Apple Sign In successful, navigate to dashboard
  //       navigate('/dashboard');
  //     } else {
  //       setError(result.error || 'Apple Sign In failed');
  //     }
  //   } catch (err: any) {
  //     console.error('Apple login error:', err);
      
  //     if (err.message?.includes('timeout')) {
  //       setError('Apple Sign In timed out. Please try again.');
  //     } else {
  //       setError(err.message || 'Apple Sign In failed');
  //     }
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

            {/* Google Sign In Button - Hide on iOS devices */}
            {!isPlatformIOS() && (
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={emailLoading || googleLoading 
                  // || appleLoading
                }
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
            )}

            {/* Apple Sign In Button - Only show on iOS devices */}
            {/* {isPlatformIOS() && (
              <button
                type="button"
                onClick={handleAppleLogin}
                disabled={emailLoading || googleLoading || appleLoading}
                className="w-full py-3 bg-black text-white font-semibold rounded-lg hover:bg-gray-800 transition flex items-center justify-center mt-3"
              >
                {appleLoading ? (
                  <>
                    <Spinner size="sm" color="white" className="mr-2" />
                    {t('auth.pleaseWait')}
                  </>
                ) : (
                  <>
                    <svg
                      className="w-5 h-5 mr-3"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.11-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                    </svg>
                    {t('auth.loginWithApple')}
                  </>
                )}
              </button>
            )} */}

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

