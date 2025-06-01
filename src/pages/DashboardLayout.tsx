import { useState, useEffect, ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, User } from 'lucide-react';
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
  const [showMobileMenu, setShowMobileMenu] = useState(false);

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
      {/* Navbar Desktop */}
      <nav className="hidden md:flex fixed top-0 left-0 right-0 z-50 items-center justify-between bg-gray-900 bg-opacity-80 backdrop-blur-md px-8 py-4 shadow-md">
        <div className="text-2xl font-extrabold">
          <span className="text-yellow-400">Fly</span>
          <span className="text-sky-400">Sky</span>{' '}
          <span className="text-yellow-400">Network</span>
        </div>
        <div className="flex items-center space-x-6">
          <Link to="/dashboard" className="text-white hover:text-yellow-400 text-sm font-semibold">Dashboard</Link>
          <Link to="/staking" className="text-white hover:text-yellow-400 text-sm font-semibold">Staking</Link>
          <Link to="/mining" className="text-white hover:text-yellow-400 text-sm font-semibold">Mining</Link>
          <Link to="/playtoearn" className="text-white hover:text-yellow-400 text-sm font-semibold">Play</Link>
          <Link to="/watch-to-earn" className="text-white hover:text-yellow-400 text-sm font-semibold">Watch</Link>
          <Link to="/referral-program" className="text-white hover:text-yellow-400 text-sm font-semibold">Referral</Link>
          <Link to="/wallet" className="text-white hover:text-yellow-400 text-sm font-semibold">Wallet</Link>
          <Link to="/about" className="text-white hover:text-yellow-400 text-sm font-semibold">About Us</Link>
          <button onClick={() => setShowProfileModal(true)} className="flex items-center text-white hover:text-yellow-400 text-sm font-semibold">
            <User size={16} className="mr-1" /> Profile
          </button>
        </div>
      </nav>

      {/* Navbar Mobile */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-gray-900 shadow-md flex justify-between items-center px-4 py-3">
        <div className="text-xl font-extrabold text-yellow-400">
          <span className="text-yellow-400">Fly</span>
          <span className="text-sky-400">Sky</span>{' '}
          <span className="text-yellow-400">Network</span>
        </div>
        <button onClick={() => setShowMobileMenu(!showMobileMenu)} className="text-white">
          {showMobileMenu ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>
      {showMobileMenu && (
        <div className="md:hidden fixed top-14 left-0 w-full bg-gray-800 border-t border-gray-700 shadow-lg z-40">
          <Link to="/dashboard" className="block w-full text-left px-4 py-3 text-white hover:bg-gray-700">Dashboard</Link>
          <Link to="/staking" className="block w-full text-left px-4 py-3 text-white hover:bg-gray-700">Staking</Link>
          <Link to="/mining" className="block w-full text-left px-4 py-3 text-white hover:bg-gray-700">Mining</Link>
          <Link to="/playtoearn" className="block w-full text-left px-4 py-3 text-white hover:bg-gray-700">Play</Link>
          <Link to="/watch-to-earn" className="block w-full text-left px-4 py-3 text-white hover:bg-gray-700">Watch</Link>
          <Link to="/referral-program" className="block w-full text-left px-4 py-3 text-white hover:bg-gray-700">Referral</Link>
          <Link to="/wallet" className="block w-full text-left px-4 py-3 text-white hover:bg-gray-700">Wallet</Link>
          <Link to="/about" className="block w-full text-left px-4 py-3 text-white hover:bg-gray-700">About Us</Link>
          <button onClick={() => setShowProfileModal(true)} className="block w-full text-left px-4 py-3 text-yellow-400 hover:bg-gray-700">Profile</button>
        </div>
      )}

      {/* Main Content */}
      <main className="pt-20 md:pt-24 pb-24 px-0 w-full bg-[#0B1622]">
        {children}

        {/* Bottom Navbar - Mobile Only */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-gray-900 text-gray-400 flex justify-around items-center py-2 shadow-inner border-t border-gray-700 z-50">
          <Link to="/dashboard" className="flex flex-col items-center text-xs hover:text-yellow-400">🏠 Home</Link>
          <Link to="/mining" className="flex flex-col items-center text-xs hover:text-yellow-400">⛏️ Mining</Link>
          <Link to="/inbox" className="flex flex-col items-center text-xs hover:text-yellow-400">📥 Inbox</Link>
          <button onClick={() => setShowProfileModal(true)} className="flex flex-col items-center text-xs hover:text-yellow-400">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Profile" className="w-6 h-6 rounded-full mb-1 object-cover" />
            ) : (
              <User size={20} className="mb-1" />
            )}
            Profile
          </button>
        </div>
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
