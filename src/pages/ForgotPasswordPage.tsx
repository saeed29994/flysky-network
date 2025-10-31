// src/pages/ForgotPasswordPage.tsx

import { useState } from 'react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebase';
import { getFirebaseErrorMessage } from '../utils/firebaseErrors';
import { Link } from 'react-router-dom';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      await sendPasswordResetEmail(auth, email);
      setMessage('Password reset email sent. Please check your inbox.');
    } catch (err: any) {
      setError(getFirebaseErrorMessage(err.code));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <form
        onSubmit={handleReset}
        className="bg-gray-900 p-6 rounded-lg shadow-md w-full max-w-md text-white"
      >
        <h1 className="text-2xl font-bold mb-4 text-yellow-400">Forgot Password</h1>

        {message && <p className="text-green-400 mb-4 text-sm">{message}</p>}
        {error && <p className="text-red-400 mb-4 text-sm">{error}</p>}

        <input
          type="email"
          placeholder="Enter your email"
          className="w-full p-2 mb-4 rounded bg-gray-800 border border-gray-700"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <button
          type="submit"
          disabled={loading}
          className="bg-yellow-500 hover:bg-yellow-400 text-black w-full py-2 rounded font-semibold transition"
        >
          {loading ? 'Sending...' : 'Send Reset Email'}
        </button>

        <p className="mt-4 text-sm text-gray-400 text-center">
          Remembered your password?{' '}
          <Link to="/login" className="text-yellow-400 hover:underline">
            Login
          </Link>
        </p>
      </form>
    </div>
  );
};

export default ForgotPasswordPage;
