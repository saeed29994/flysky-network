import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import { useNavigate, Link } from 'react-router-dom';
import { getFirebaseErrorMessage } from '../utils/firebaseErrors';
import { saveUserToken } from '../utils/pushNotification'; // ✅ إضافة الاستيراد

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
        // ✅ حفظ FCM Token بعد تسجيل الدخول الناجح
        await saveUserToken();
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
