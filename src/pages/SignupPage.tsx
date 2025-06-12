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
} from 'firebase/firestore';
import { useNavigate, Link } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { requestPermissionAndToken } from '../utils/pushNotification';

const SignupPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [error, setError] = useState('');
  const [logoSpin, setLogoSpin] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLogoSpin(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const finalReferral = referralCode.trim() !== '' ? referralCode.trim() : '';

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
        referredBy: finalReferral,
        language: 'en',
        theme: 'dark',
        kycStatus: 'Not Actived',
        miningStartTime: serverTimestamp(),
        dailyMined: 0,
        lockedFromStaking: 0,
        stakingEarnings: 0,
        referralReward: 0,
        referrals: 0,
        transactionHistory: [
          {
            description: 'Initial balance record (500 FSN)',
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

      await sendEmailVerification(user);
      await requestPermissionAndToken();
      navigate('/verify-email');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Signup failed');
    }
  };

  const handleGoogleSignup = async () => {
    setError('');

    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (!userDoc.exists()) {
        const generatedReferralCode = uuidv4().slice(0, 8);

        await setDoc(doc(db, 'users', user.uid), {
          fullName: user.displayName || '',
          email: user.email || '',
          balance: 500,
          plan: 'economy',
          createdAt: serverTimestamp(),
          referralCode: generatedReferralCode,
          referredBy: '',
          language: 'en',
          theme: 'dark',
          kycStatus: 'Not Actived',
          miningStartTime: serverTimestamp(),
          dailyMined: 0,
          lockedFromStaking: 0,
          stakingEarnings: 0,
          referralReward: 0,
          referrals: 0,
          transactionHistory: [
            {
              description: 'Initial balance record (500 FSN)',
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
      console.error(err);
      setError('Google signup failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-4">

      {/* شعار FlySky Network */}
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
        onSubmit={handleSignup}
        className="bg-gray-900 p-6 rounded-lg shadow-md w-full max-w-md text-white"
      >
        <h2 className="text-2xl font-bold mb-4 text-yellow-400">Sign Up</h2>

        {error && <p className="text-red-400 mb-4 text-sm">{error}</p>}

        <input
          type="text"
          placeholder="Full Name"
          className="w-full p-2 mb-3 rounded bg-gray-800 border border-gray-700"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
        />

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

        <input
          type="text"
          placeholder="Referral Code (Optional)"
          className="w-full p-2 mb-4 rounded bg-gray-800 border border-gray-700"
          value={referralCode}
          onChange={(e) => setReferralCode(e.target.value)}
        />

        <button
          type="submit"
          className="bg-yellow-500 hover:bg-yellow-400 text-black w-full py-2 rounded font-semibold transition"
        >
          Sign Up
        </button>

        <div className="text-center text-white my-4">OR</div>

        <button
          type="button"
          onClick={handleGoogleSignup}
          className="flex items-center justify-center bg-white text-black py-2 px-4 rounded font-semibold shadow hover:bg-gray-100 transition w-full"
        >
          <img
            src="https://developers.google.com/identity/images/g-logo.png"
            alt="Google Logo"
            className="w-5 h-5 mr-3"
          />
          Sign Up with Google
        </button>

        <p className="mt-4 text-sm text-gray-400 text-center">
          Already have an account?{' '}
          <Link to="/login" className="text-yellow-400 hover:underline">
            Login
          </Link>
        </p>
      </form>
    </div>
  );
};

export default SignupPage;
