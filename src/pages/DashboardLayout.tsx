import { useState, useEffect, ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User } from 'lucide-react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import ProfileModal from '../components/ProfileModal';

interface DashboardLayoutProps {
  children: ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userPlan, setUserPlan] = useState('');
  const [kycStatus, setKycStatus] = useState<'Not Actived' | 'Pending' | 'Approved'>('Not Actived');
  const [subscriptionEnd, setSubscriptionEnd] = useState<string | undefined>(undefined);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [showProfileModal, setShowProfileModal] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        navigate('/login');
        return;
      }

      const userRef = doc(db, 'users', user.uid);

      const unsubscribeSnapshot = onSnapshot(userRef, (userSnap) => {
        const data = userSnap.data();

        setUserName(data?.fullName || '');
        setUserEmail(data?.email || '');
        setAvatarUrl(data?.avatarUrl || '');

        const planValue = data?.membership?.planName || data?.plan || 'economy';
        const normalizedPlan =
          planValue === 'first' || planValue === 'first-lifetime' || planValue === 'first-6'
            ? 'first'
            : planValue === 'business'
            ? 'business'
            : 'economy';
        setUserPlan(normalizedPlan);

        const rawKyc = (data?.kycStatus || data?.kyc?.kycStatus || 'Not Actived').toLowerCase();
        const normalizedKyc =
          rawKyc === 'approved' || rawKyc === 'actived' || rawKyc === 'verified' ? 'Approved' :
          rawKyc === 'pending' ? 'Pending' : 'Not Actived';
        setKycStatus(normalizedKyc);

        const endDate = data?.membership?.subscriptionEnd;
        if (endDate) {
          setSubscriptionEnd(new Date(endDate).toLocaleDateString());
        }

        setIsLoading(false);
      });

      return () => {
        unsubscribe();
        unsubscribeSnapshot();
      };
    });

    return () => unsubscribe();
  }, [navigate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 text-yellow-400 text-lg">
        Loading your dashboard...
      </div>
    );
  }

  return (
    <>
      <main className="pt-20 md:pt-24 pb-24 px-0 w-full bg-[#0B1622]">
        {children}

        {/* Bottom Navbar - Mobile Only */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-gray-900 text-gray-400 flex justify-around items-center py-2 shadow-inner border-t border-gray-700 z-50">
          <Link to="/dashboard" className="flex flex-col items-center text-xs hover:text-yellow-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            </svg>
            Home
          </Link>
          <Link to="/mining" className="flex flex-col items-center text-xs hover:text-yellow-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 11V3h2v8h-2zm-4 8h2v-4H7v4zm8-4h2v4h-2v-4z" />
            </svg>
            Mining
          </Link>
          <Link to="/inbox" className="flex flex-col items-center text-xs hover:text-yellow-400 relative">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12.79A9 9 0 1112.79 3a9 9 0 018.21 9.79z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12h.01M9 12h.01M12 15h.01" />
            </svg>
            Inbox
          </Link>
          <button
            onClick={() => setShowProfileModal(true)}
            className="flex flex-col items-center text-xs hover:text-yellow-400"
          >
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="Profile"
                className="w-6 h-6 rounded-full mb-1 object-cover"
              />
            ) : (
              <User size={20} className="mb-1" />
            )}
            Profile
          </button>
        </div>

        <footer className="text-center text-gray-500 text-xs py-4 flex flex-col items-center space-y-2">
          <div className="flex space-x-4">
            <a href="https://x.com/your_handle" target="_blank" rel="noopener noreferrer" className="hover:text-yellow-400">X</a>
            <a href="https://facebook.com/your_page" target="_blank" rel="noopener noreferrer" className="hover:text-yellow-400">Facebook</a>
            <a href="https://t.me/your_channel" target="_blank" rel="noopener noreferrer" className="hover:text-yellow-400">Telegram</a>
            <a href="https://discord.gg/your_server" target="_blank" rel="noopener noreferrer" className="hover:text-yellow-400">Discord</a>
          </div>
          <p>© {new Date().getFullYear()} FlySky Network. All rights reserved.</p>
        </footer>
      </main>

      {/* Profile Modal */}
      {showProfileModal && (
        <ProfileModal
          isOpen={showProfileModal}
          onClose={() => setShowProfileModal(false)}
          fullName={userName}
          email={userEmail}
          plan={userPlan as 'economy' | 'business' | 'first'}
          kycStatus={kycStatus}
          subscriptionEnd={subscriptionEnd}
          onUpgrade={() => navigate('/membership')}
        />
      )}
    </>
  );
};

export default DashboardLayout;
