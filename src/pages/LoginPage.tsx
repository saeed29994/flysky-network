import { useState } from 'react';
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

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      if (user.emailVerified) {
        await requestPermissionAndToken();
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
          title: '🎉 Welcome to FlySky Network!',
          body: 'You’ve earned a 500 FSN welcome bonus. Click below to claim your reward',
          timestamp: Date.now(),
          read: false,
          claimed: false,
          amount: 500,
          type: 'welcome_bonus',
        });
      }

      await requestPermissionAndToken();
      navigate('/dashboard');

    } catch (err: any) {
      console.error('Google login error:', err);
      setError('Google login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <form
        onSubmit={handleLogin}
        className="bg-gray-900 p-6 rounded-lg shadow-md w-full max-w-md text-white"
      >
        <h1 className="text-2xl font-bold mb-4 text-yellow-400">Login</h1>

        {error && <p className="text-red-400 mb-4 text-sm">{error}</p>}

        <input
          type="email"
          placeholder="Email"
          className="w-full p-2 mb-3 rounded bg-gray-800 border border-gray-700"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full p-2 mb-2 rounded bg-gray-800 border border-gray-700"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <div className="text-right mb-4">
          <Link to="/forgot-password" className="text-sm text-yellow-400 hover:underline">
            Forgot Password?
          </Link>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="bg-yellow-500 hover:bg-yellow-400 text-black w-full py-2 rounded font-semibold transition"
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>

        <div className="text-center text-white my-4">OR</div>

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
          {loading ? 'Please wait...' : 'Login with Google'}
        </button>

        <p className="mt-4 text-sm text-gray-400 text-center">
          Don’t have an account?{' '}
          <Link to="/signup" className="text-yellow-400 hover:underline">
            Sign Up
          </Link>
        </p>
      </form>
    </div>
  );
};

export default LoginPage;
