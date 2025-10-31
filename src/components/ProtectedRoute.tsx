import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { Spinner } from './ui/spinner';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set a timeout to prevent infinite loading
    const loadingTimeout = setTimeout(() => {
      console.warn('ProtectedRoute: Loading timeout - clearing loading state');
      setLoading(false);
    }, 15000); // 15 second timeout

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      // console.log('ProtectedRoute: Auth state changed', {
      //   hasUser: !!user,
      //   uid: user?.uid,
      //   email: user?.email,
      //   emailVerified: user?.emailVerified,
      //   providers: user?.providerData?.map(p => p.providerId),
      //   platform: 'ios'
      // });
      
      if (!user) {
        // console.log('ProtectedRoute: No user, redirecting to login');
        // No user is signed in
        setIsAuthenticated(false);
        setNeedsVerification(false);
        setIsBlocked(false);
        setLoading(false);
        clearTimeout(loadingTimeout);
        return;
      }
      
      // Check if user is authenticated with Google or Apple
      const isGoogleAuth = user.providerData.some(
        provider => provider.providerId === 'google.com'
      );
      
      const isAppleAuth = user.providerData.some(
        provider => provider.providerId === 'apple.com'
      );

      // Check if user is blocked first
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData.block) {
          // console.log('ProtectedRoute: User is blocked, redirecting to user-blocked');
          setIsBlocked(true);
          setIsAuthenticated(false);
          setNeedsVerification(false);
          setLoading(false);
          clearTimeout(loadingTimeout);
          return;
        }
      }

      // console.log('ProtectedRoute: User auth check', {
      //   isGoogleAuth,
      //   isAppleAuth,
      //   emailVerified: user.emailVerified,
      //   providerData: user.providerData.map(p => ({ providerId: p.providerId, uid: p.uid }))
      // });

      if (isGoogleAuth || isAppleAuth || user.emailVerified) {
        // console.log('ProtectedRoute: User authenticated, allowing access to dashboard');
        // Google, Apple, or verified email users are fully authenticated
        setIsAuthenticated(true);
        setNeedsVerification(false);
        setIsBlocked(false);
      } else {
        // console.log('ProtectedRoute: User needs email verification');
        // Email users who are not verified need verification
        setIsAuthenticated(false);
        setNeedsVerification(true);
        setIsBlocked(false);
      }
      
      clearTimeout(loadingTimeout);
      setLoading(false);
    });

    return () => {
      clearTimeout(loadingTimeout);
      unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-950">
        <Spinner size="lg" color="yellow" />
        <p className="mt-4 text-yellow-400 text-lg">Loading...</p>
      </div>
    );
  }

  if (isBlocked) {
    return <Navigate to="/user-blocked" replace />;
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
