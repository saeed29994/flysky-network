// src/pages/LandingPage.tsx

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';
import desktopBackground from '../assets/landing_desktop.jpg';
import mobileBackground from '../assets/landing_mobile.jpg';

const LandingPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        navigate('/dashboard');
      }
    });

    return () => unsubscribe();
  }, []);

  const backgroundImage = window.innerWidth < 768 ? mobileBackground : desktopBackground;

  return (
    <div
      className="min-h-screen flex items-end justify-center bg-cover bg-center pb-20"
      style={{ backgroundImage: `url(${backgroundImage})` }}
    >
      <div className="text-center space-x-4">
        <a href="/signup" className="px-6 py-2 bg-yellow-500 text-black font-semibold rounded hover:bg-yellow-400">
          Get Started
        </a>
        <a href="/login" className="px-6 py-2 bg-yellow-500 text-black font-semibold rounded hover:bg-yellow-400">
          Login
        </a>
      </div>
    </div>
  );
};

export default LandingPage;
