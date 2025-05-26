import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import { onAuthStateChanged, reload, sendEmailVerification } from 'firebase/auth';
import { getFirebaseErrorMessage } from '../utils/firebaseErrors';

const EmailVerification = () => {
  const navigate = useNavigate();
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        const interval = setInterval(async () => {
          await reload(user);
          if (user.emailVerified) {
            clearInterval(interval);
            navigate('/dashboard');
          }
        }, 3000);
        return () => clearInterval(interval);
      }
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white p-4 text-center">
      <div className="bg-gray-900 p-6 rounded-lg shadow-lg max-w-md w-full">
        <h1 className="text-xl font-bold text-yellow-400 mb-4">Verify Your Email</h1>
        <p className="mb-4">
          We've sent a verification link to your email.
          <br />
          Once verified, you'll be redirected to your dashboard.
        </p>

        <button
          onClick={handleResend}
          disabled={sending}
          className="bg-yellow-500 hover:bg-yellow-400 text-black font-semibold py-2 px-4 rounded transition"
        >
          {sending ? 'Sending...' : 'Resend Verification Email'}
        </button>

        {message && <p className="mt-4 text-green-400 text-sm">{message}</p>}
        {error && <p className="mt-2 text-red-400 text-sm">{error}</p>}
      </div>
    </div>
  );
};

export default EmailVerification;
