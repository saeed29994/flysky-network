import { useState } from 'react';
import { createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
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
} from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
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

      const userRef = doc(db, 'users', user.uid);
      const generatedCode = uuidv4().slice(0, 8);

      await setDoc(userRef, {
        fullName,
        email,
        balance: 0,
        plan: 'economy',
        createdAt: serverTimestamp(),
        referralCode: generatedCode,
        referredBy: finalReferral,
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

      // ✅ تسجيل الإحالة في Firestore
      if (finalReferral !== '') {
        const referrerQuery = query(
          collection(db, 'users'),
          where('referralCode', '==', finalReferral)
        );
        const querySnapshot = await getDocs(referrerQuery);

        if (!querySnapshot.empty) {
          const referrerDoc = querySnapshot.docs[0];
          const referrerRef = doc(db, 'users', referrerDoc.id);

          await updateDoc(referrerRef, {
            referralList: arrayUnion({
              email: email,
              status: 'Pending',
              timestamp: Date.now(),
            }),
          });

          console.log('Referral registered successfully.');
        } else {
          console.log('No referrer found with this code.');
        }
      }

      // ✅ إضافة رسالة الترحيب
      const inboxRef = doc(collection(db, 'users', user.uid, 'inbox'));
      await setDoc(inboxRef, {
        title: '🎉 Welcome to FlySky Network!',
        body: 'You’ve earned a 500 FSN welcome bonus. Click below to claim your reward',
        timestamp: Date.now(),
        read: false,
        claimed: false,
        amount: 500,
        type: 'welcome_bonus',
      });

      navigate('/verify-email');
    } catch (err: any) {
      console.error('Error during signup:', err);
      setError('An unexpected error occurred. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-[#0B1622] flex items-center justify-center px-4">
      <form onSubmit={handleSignup} className="bg-gray-900 p-6 rounded-xl shadow-lg w-full max-w-md">
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
          onChange={(e) => setReferralCode(e.target.value.trim())}
          className="w-full p-2 mb-6 rounded bg-gray-800 text-white"
        />
        <button type="submit" className="w-full bg-yellow-400 text-black py-2 rounded font-bold hover:bg-yellow-300 transition">
          Sign Up
        </button>
      </form>
    </div>
  );
};

export default SignupPage;
