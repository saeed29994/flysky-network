import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { Spinner } from './ui/spinner';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        // No user is signed in
        setIsAuthenticated(false);
        setNeedsVerification(false);
        setLoading(false);
        return;
      }
      
      // Check if user is authenticated with Google
      const isGoogleAuth = user.providerData.some(
        provider => provider.providerId === 'google.com'
      );
      
      if (isGoogleAuth || user.emailVerified) {
        // Google users or verified email users are fully authenticated
        setIsAuthenticated(true);
        setNeedsVerification(false);
      } else {
        // Email users who are not verified need verification
        setIsAuthenticated(false);
        setNeedsVerification(true);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-950">
        <Spinner size="lg" color="yellow" />
        <p className="mt-4 text-yellow-400 text-lg">Loading...</p>
      </div>
    );
  }

  if (needsVerification) {
    return <Navigate to="/verify-email" replace />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
