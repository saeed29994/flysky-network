import { useState, useEffect, ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, User, LogOut, Phone } from 'lucide-react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import ProfileModal from '../components/ProfileModal';

interface DashboardLayoutProps {
  children: ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [userName, setUserName] = useState('');
  const [userPlan, setUserPlan] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [kycStatus, setKycStatus] = useState<'Not Actived' | 'Pending' | 'Approved'>('Not Actived');
  const [subscriptionEnd, setSubscriptionEnd] = useState<string | undefined>(undefined);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        navigate('/login');
        return;
      }

      try {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        const data = userSnap.data();

        setUserName(data?.fullName || '');
        setUserEmail(data?.email || '');

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
          rawKyc === 'approved' || rawKyc === 'actived' ? 'Approved' :
          rawKyc === 'pending' ? 'Pending' : 'Not Actived';
        setKycStatus(normalizedKyc);

        const endDate = data?.membership?.subscriptionEnd;
        if (endDate) {
          setSubscriptionEnd(new Date(endDate).toLocaleDateString());
        }

        const inboxRef = collection(db, `users/${user.uid}/inbox`);
        const snapshot = await getDocs(inboxRef);
        const unread = snapshot.docs.filter((doc) => !doc.data().read);
        setUnreadCount(unread.length);
      } catch (err) {
        console.error('Error loading user data:', err);
      }

      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  const scrollToContact = () => {
    navigate('/dashboard');
    setTimeout(() => {
      const contactSection = document.getElementById('contact-us');
      if (contactSection) {
        contactSection.scrollIntoView({ behavior: 'smooth' });
      }
    }, 300);
  };

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
          <Link to="/inbox" className="relative text-white hover:text-yellow-400 text-sm font-semibold">
            Inbox {unreadCount > 0 && <span className='ml-1 text-xs text-yellow-400'>({unreadCount})</span>}
          </Link>
          <button onClick={scrollToContact} className="text-white hover:text-yellow-400 text-sm font-semibold flex items-center">
            <Phone size={16} className="mr-1" /> Contact
          </button>
          <button onClick={() => setShowProfileModal(true)} className="text-white hover:text-yellow-400 text-sm font-semibold flex items-center">
            <User size={16} className="mr-1" /> Profile
          </button>
          <button onClick={handleLogout} className="text-red-400 hover:text-red-300 text-sm flex items-center">
            <LogOut size={16} className="mr-1" /> Logout
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
          <Link to="/dashboard" className="block px-4 py-3 text-yellow-400 hover:bg-gray-700" onClick={() => setShowMobileMenu(false)}>🏠 Home</Link>
          <Link to="/mining" className="block px-4 py-3 text-yellow-400 hover:bg-gray-700" onClick={() => setShowMobileMenu(false)}>⛏️ Mining</Link>
          <Link to="/staking" className="block px-4 py-3 text-yellow-400 hover:bg-gray-700" onClick={() => setShowMobileMenu(false)}>📈 Staking</Link>
          <Link to="/membership" className="block px-4 py-3 text-yellow-400 hover:bg-gray-700" onClick={() => setShowMobileMenu(false)}>💳 Membership</Link>
          <Link to="/playtoearn" className="block px-4 py-3 text-yellow-400 hover:bg-gray-700" onClick={() => setShowMobileMenu(false)}>🎮 Play to Earn</Link>
          <Link to="/watch-to-earn" className="block px-4 py-3 text-yellow-400 hover:bg-gray-700" onClick={() => setShowMobileMenu(false)}>🎥 Watch</Link>
          <Link to="/referral-program" className="block px-4 py-3 text-yellow-400 hover:bg-gray-700" onClick={() => setShowMobileMenu(false)}>🤝 Referral</Link>
          <Link to="/wallet" className="block px-4 py-3 text-yellow-400 hover:bg-gray-700" onClick={() => setShowMobileMenu(false)}>👛 Wallet</Link>
          <Link to="/inbox" className="block px-4 py-3 text-yellow-400 hover:bg-gray-700" onClick={() => setShowMobileMenu(false)}>📩 Inbox</Link>
          <button onClick={() => { setShowProfileModal(true); setShowMobileMenu(false); }} className="block w-full text-left px-4 py-3 text-yellow-400 hover:bg-gray-700">👤 Profile</button>
          <button onClick={scrollToContact} className="block w-full text-left px-4 py-3 text-yellow-400 hover:bg-gray-700">📞 Contact Us</button>
          <button onClick={handleLogout} className="w-full text-left px-4 py-3 text-red-400 hover:bg-gray-700">🚪 Logout</button>
        </div>
      )}

      {/* Main Content */}
      <main className="pt-20 md:pt-24 pb-24 px-0 w-full bg-[#0B1622]">
        {children}
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
