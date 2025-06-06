import { useState } from 'react';
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
  collection,
  updateDoc,
  arrayUnion,
  query,
  where,
  getDocs,
  getDoc,
} from 'firebase/firestore';
import { useNavigate, Link } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';

const SignupPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [error, setError] = useState('');

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const finalReferral = referralCode.trim() !== '' ? referralCode.trim() : '';

      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      await sendEmailVerification(user);

      await createUserRecord(user.uid, email, fullName, finalReferral);

      navigate('/verify-email');
    } catch (err) {
      console.error('Error during signup:', err);
      setError('An unexpected error occurred. Please try again.');
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
        await createUserRecord(user.uid, user.email || '', user.displayName || '', referralCode.trim());
      }

      navigate('/dashboard');
    } catch (err) {
      console.error('Google Sign-in error:', err);
      setError('Google sign-in failed. Please try again.');
    }
  };

  const createUserRecord = async (uid: string, email: string, fullName: string, referralCode: string) => {
    const userRef = doc(db, 'users', uid);
    const generatedCode = uuidv4().slice(0, 8);

    await setDoc(userRef, {
      fullName,
      email,
      balance: 500,
      createdAt: serverTimestamp(),
      dailyMined: 0,
      lockedFromStaking: 0,
      language: 'en',
      theme: 'dark',
      kycStatus: 'Not Actived',
      stakingEarnings: 0,
      referralReward: 0,
      referrals: 0,
      referralCode: generatedCode,
      referredBy: referralCode || '',
      role: 'user',
      transactionHistory: [
        {
          description: 'Initial balance record (empty)',
          timestamp: Date.now(),
        },
      ],
      membership: {
        plan: 'economy',
        planName: 'economy',
        miningEarnings: 0,
        miningStartTime: null,
      },
    });

    if (referralCode !== '') {
      try {
        const referrerQuery = query(collection(db, 'users'), where('referralCode', '==', referralCode));
        const querySnapshot = await getDocs(referrerQuery);
        if (!querySnapshot.empty) {
          const referrerDoc = querySnapshot.docs[0];
          await updateDoc(doc(db, 'users', referrerDoc.id), {
            referralList: arrayUnion({
              email,
              status: 'Pending',
              timestamp: Date.now(),
            }),
          });
        }
      } catch (err) {
        console.warn('⚠️ Could not update referral list:', err);
      }
    }

    const inboxRef = doc(collection(db, 'users', uid, 'inbox'));
    await setDoc(inboxRef, {
      title: '🎉 Welcome to FlySky Network!',
      body: 'You’ve earned a 500 FSN welcome bonus. Click below to claim your reward',
      timestamp: Date.now(),
      read: false,
      claimed: false,
      amount: 500,
      type: 'welcome_bonus',
    });
  };

  return (
    <div className="min-h-screen bg-[#0B1622] flex items-center justify-center px-4">
      <form onSubmit={handleSignup} className="bg-gray-900 p-6 rounded-xl shadow-lg w-full max-w-md text-white">
        <h2 className="text-yellow-400 text-2xl font-bold mb-4">Create Account</h2>

        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

        <input
          type="text"
          placeholder="Full Name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="w-full p-2 mb-4 rounded bg-gray-800 text-white"
          required
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-2 mb-4 rounded bg-gray-800 text-white"
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-2 mb-4 rounded bg-gray-800 text-white"
          required
        />
        <input
          type="text"
          placeholder="Referral Code (optional)"
          value={referralCode}
          onChange={(e) => setReferralCode(e.target.value)}
          className="w-full p-2 mb-6 rounded bg-gray-800 text-white"
        />

        <button type="submit" className="w-full bg-yellow-400 text-black py-2 rounded font-bold hover:bg-yellow-300 transition">
          Sign Up with Email
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
          Continue with Google
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
