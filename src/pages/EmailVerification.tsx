import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import { onAuthStateChanged, reload, sendEmailVerification, signOut } from 'firebase/auth';
import { getFirebaseErrorMessage } from '../utils/firebaseErrors';
import { Spinner } from '../components/ui/spinner';
import fsnLogo from '../assets/fsn-logo.png';

const EmailVerification = () => {
  const navigate = useNavigate();
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        // If no user is logged in, redirect to login
        navigate('/login');
        return;
      }
      
      // Check if user is authenticated with Google
      const isGoogleAuth = user.providerData.some(
        provider => provider.providerId === 'google.com'
      );
      
      if (isGoogleAuth) {
        // Google users don't need verification, redirect to dashboard
        navigate('/dashboard');
        return;
      }
      
      if (user.emailVerified) {
        // Email is already verified, redirect to dashboard
        navigate('/dashboard');
        return;
      }
      
      setLoading(false);
      
      // Check for verification status every 3 seconds
      const interval = setInterval(async () => {
        try {
          await reload(user);
          if (user.emailVerified) {
            clearInterval(interval);
            navigate('/dashboard');
          }
        } catch (err) {
          console.error('Error checking verification status:', err);
        }
      }, 3000);
      
      return () => clearInterval(interval);
    });

    return () => unsubscribe();
  }, [navigate]);

  const handleResend = async () => {
    if (auth.currentUser && !auth.currentUser.emailVerified) {
      try {
        setSending(true);
        setError('');
        await sendEmailVerification(auth.currentUser);
        setMessage('Verification email has been resent. Please check your inbox.');
      } catch (err: any) {
        setError(getFirebaseErrorMessage(err.code));
      } finally {
        setSending(false);
      }
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (err: any) {
      setError(getFirebaseErrorMessage(err.code));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-white font-inter">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="relative inline-block">
            <img src={fsnLogo} alt="FSN Logo" className="w-16 h-16" />
            <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-purple-600 rounded-full opacity-30 blur-md"></div>
          </div>
          <h1 className="text-3xl font-bold mt-4">
            <span className="text-amber-400">Fly</span>
            <span className="text-purple-400">Sky</span>{' '}
            <span className="text-white">Network</span>
          </h1>
        </div>

        <div className="bg-gray-900/80 backdrop-blur-md border border-white/10 rounded-xl shadow-2xl overflow-hidden">
          <div className="px-8 py-10">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-white mb-2">Verify Your Email</h2>
              <p className="text-gray-300">
                We've sent a verification link to your email.<br/>
                Please check your inbox and click the link to continue.
              </p>
            </div>

            {message && (
              <div className="mb-6 p-4 bg-green-500/20 border border-green-500/30 rounded-lg text-center">
                <p className="text-green-300 text-sm">{message}</p>
              </div>
            )}

            {error && (
              <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg text-center">
                <p className="text-red-300 text-sm">{error}</p>
              </div>
            )}

            <div className="space-y-4">
              <button
                onClick={handleResend}
                disabled={sending}
                className="w-full py-3 bg-gradient-to-r from-amber-500 to-purple-600 hover:from-amber-400 hover:to-purple-500 text-white font-semibold rounded-lg transition flex items-center justify-center"
              >
                {sending ? (
                  <>
                    <Spinner size="sm" color="white" className="mr-2" />
                    Sending...
                  </>
                ) : (
                  'Resend Verification Email'
                )}
              </button>

              <button
                onClick={handleLogout}
                className="w-full py-3 bg-gray-700/70 hover:bg-gray-600/70 text-white font-semibold rounded-lg transition"
              >
                Logout
              </button>
            </div>

            <p className="text-sm text-gray-400 text-center mt-6">
              Already verified? Try <button onClick={() => navigate('/login')} className="text-purple-400 hover:text-purple-300 transition">logging in</button> again.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailVerification;
