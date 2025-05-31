import { useState } from 'react';
import { createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, setDoc, serverTimestamp, collection } from 'firebase/firestore';
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
      console.log('User entered referral code:', referralCode); // ✅ تحقق من الكود المُدخل

      // إزالة أي فراغات من كود الإحالة
      const finalReferral = referralCode.trim() !== '' ? referralCode.trim() : '';
      console.log('Final referral code to save:', finalReferral);

      // ✅ إنشاء حساب المستخدم في Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // ✅ إرسال رابط التحقق
      await sendEmailVerification(user);

      // ✅ إنشاء وثيقة المستخدم الجديدة في Firestore
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

      console.log('User document created successfully in Firestore.');

      // ✅ إضافة رسالة الترحيب في صندوق البريد (Inbox)
      const inboxRef = doc(collection(db, 'users', user.uid, 'inbox'));
      await setDoc(inboxRef, {
        title: 'Welcome!',
        body: 'Welcome to our platform! Claim your 500 bonus coins by pressing the Claim button.',
        timestamp: Date.now(),
        read: false,
        claimed: false,
        amount: 500,
        type: 'welcome_bonus',
      });

      console.log('Welcome bonus message added to inbox.');

      // 🔥 استدعاء خادم الإحالة الخارجي إذا كان هناك كود إحالة
      if (finalReferral !== '') {
        console.log('Calling referral API with code:', finalReferral);
        try {
          const response = await fetch('https://flysky-referral-api.onrender.com/addReferral', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              referrerCode: finalReferral,
              newUserEmail: email,
            }),
          });

          const data = await response.json();
          console.log('Referral API Response:', data);
        } catch (apiError) {
          console.error('Error calling referral API:', apiError);
        }
      }

      // ✅ توجيه المستخدم لصفحة "تحقق البريد"
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
          onChange={(e) => setReferralCode(e.target.value.trim())} // ✅ إزالة الفراغات الزائدة
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
