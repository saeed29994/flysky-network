import { useState, useEffect, ReactNode } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, User, Phone, Home, Wallet, Mail } from 'lucide-react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, onSnapshot, collection, query, where } from 'firebase/firestore';
import ProfileModal from '../components/ProfileModal';

interface DashboardLayoutProps {
  children: ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const hideFooter = location.pathname === '/watch-to-earn';

  const [isLoading, setIsLoading] = useState(true);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userPlan, setUserPlan] = useState('');
  const [kycStatus, setKycStatus] = useState<'Not Actived' | 'Pending' | 'Approved'>('Not Actived');
  const [subscriptionEnd, setSubscriptionEnd] = useState<string | undefined>(undefined);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false);

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

      const inboxQuery = query(
        collection(db, 'users', user.uid, 'inbox'),
        where('read', '==', false)
      );

      const unsubscribeInbox = onSnapshot(inboxQuery, (snapshot) => {
        setHasUnreadMessages(!snapshot.empty);
      });

      return () => {
        unsubscribe();
        unsubscribeSnapshot();
        unsubscribeInbox();
      };
    });

    return () => unsubscribe();
  }, [navigate]);

  const scrollToContact = () => {
    navigate('/dashboard');
    setTimeout(() => {
      const contactSection = document.getElementById('contact');
      if (contactSection) {
        contactSection.scrollIntoView({ behavior: 'smooth' });
      }
    }, 300);
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
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
        <Link to="/dashboard" className="text-2xl font-extrabold hover:opacity-90">
  <span className="text-yellow-400">Fly</span>
  <span className="text-sky-400">Sky</span>{' '}
  <span className="text-yellow-400">Network</span>
</Link>
        <div className="flex items-center space-x-6">
  <Link to="/dashboard" className="flex items-center text-yellow-400 hover:text-yellow-300 text-xm font-semibold">
    <Home size={16} className="mr-1" /> Home
  </Link>
  <Link to="/staking" className="flex items-center text-yellow-400 hover:text-yellow-300 text-xm font-semibold">
    <Wallet size={16} className="mr-1" /> Staking
  </Link>
  <Link to="/mining" className="flex items-center text-yellow-400 hover:text-yellow-300 text-xm font-semibold">
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6l4 2" />
    </svg>
    Mining
  </Link>
  <Link to="/playtoearn" className="flex items-center text-yellow-400 hover:text-yellow-300 text-xm font-semibold">
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17l6.25-5-6.25-5v10z" />
    </svg>
    Play
  </Link>
  <Link to="/watch-to-earn" className="flex items-center text-yellow-400 hover:text-yellow-300 text-xm font-semibold">
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M4 6h16M4 18h16" />
    </svg>
    Watch
  </Link>
  <Link to="/referral-program" className="flex items-center text-yellow-400 hover:text-yellow-300 text-xm font-semibold">
    <User size={16} className="mr-1" /> Referral
  </Link>
  <Link to="/wallet" className="flex items-center text-yellow-400 hover:text-yellow-300 text-xm font-semibold">
    <Wallet size={16} className="mr-1" /> Wallet
  </Link>
  <Link to="/about" className="flex items-center text-yellow-400 hover:text-yellow-300 text-xm font-semibold">
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M12 20a8 8 0 100-16 8 8 0 000 16z" />
    </svg>
    About Us
  </Link>
  <div className="relative flex items-center text-yellow-400 hover:text-yellow-300 text-xm font-semibold">
    <Mail size={16} className="mr-1" />
    <Link to="/inbox">Inbox</Link>
    {hasUnreadMessages && (
      <span className="absolute top-0 right-0 inline-block w-2 h-2 bg-red-500 rounded-full"></span>
    )}
  </div>
  <button onClick={scrollToContact} className="flex items-center text-yellow-400 hover:text-yellow-300 text-xm font-semibold">
    <Phone size={16} className="mr-1" /> Contact
  </button>
  <button onClick={() => setShowProfileModal(true)} className="flex items-center text-yellow-400 hover:text-yellow-300 text-xm font-semibold">
    {avatarUrl ? (
      <img src={avatarUrl} alt="Avatar" className="w-6 h-6 rounded-full mr-1 object-cover" />
    ) : (
      <User size={16} className="mr-1" />
    )}
    Profile
  </button>
  <button onClick={handleLogout} className="flex items-center text-red-400 hover:text-red-300 text-xm font-semibold">
    <span className="mr-1">🚪</span> Logout
  </button>
</div>
      </nav>

      {/* Navbar Mobile */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-gray-900 shadow-md flex justify-between items-center px-4 py-3">
        <Link to="/dashboard" className="text-2xl font-extrabold hover:opacity-90">
  <span className="text-yellow-400">Fly</span>
  <span className="text-sky-400">Sky</span>{' '}
  <span className="text-yellow-400">Network</span>
</Link>
        <button onClick={() => setShowMobileMenu(!showMobileMenu)} className="text-yellow-400">
          {showMobileMenu ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>
      {showMobileMenu && (
  <div className="md:hidden fixed top-14 left-0 w-full bg-gray-800 border-t border-gray-700 shadow-lg z-40 flex flex-col items-start px-4 py-3 space-y-2 text-left">
    <Link to="/dashboard" onClick={() => setShowMobileMenu(false)} className="flex items-center text-yellow-400 hover:text-yellow-300">
      <Home className="w-4 h-4 mr-2" /> Home
    </Link>
    <Link to="/staking" onClick={() => setShowMobileMenu(false)} className="flex items-center text-yellow-400 hover:text-yellow-300">
      <Wallet className="w-4 h-4 mr-2" /> Staking
    </Link>
    <Link to="/mining" onClick={() => setShowMobileMenu(false)} className="flex items-center text-yellow-400 hover:text-yellow-300">
      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6l4 2" />
      </svg>
      Mining
    </Link>
    <Link to="/playtoearn" onClick={() => setShowMobileMenu(false)} className="flex items-center text-yellow-400 hover:text-yellow-300">
      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17l6.25-5-6.25-5v10z" />
      </svg>
      Play
    </Link>
    <Link to="/watch-to-earn" onClick={() => setShowMobileMenu(false)} className="flex items-center text-yellow-400 hover:text-yellow-300">
      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M4 6h16M4 18h16" />
      </svg>
      Watch
    </Link>
    <Link to="/referral-program" onClick={() => setShowMobileMenu(false)} className="flex items-center text-yellow-400 hover:text-yellow-300">
      <User className="w-4 h-4 mr-2" /> Referral
    </Link>
    <Link to="/wallet" onClick={() => setShowMobileMenu(false)} className="flex items-center text-yellow-400 hover:text-yellow-300">
      <Wallet className="w-4 h-4 mr-2" /> Wallet
    </Link>
    <Link to="/about" onClick={() => setShowMobileMenu(false)} className="flex items-center text-yellow-400 hover:text-yellow-300">
      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M12 20a8 8 0 100-16 8 8 0 000 16z" />
      </svg>
      About Us
    </Link>
    <div className="relative flex items-center text-yellow-400 hover:text-yellow-300">
      <Mail className="w-4 h-4 mr-2" />
      <Link to="/inbox" onClick={() => setShowMobileMenu(false)}>Inbox</Link>
      {hasUnreadMessages && (
        <span className="absolute top-1 left-[-8px] w-2 h-2 bg-red-500 rounded-full"></span>
      )}
    </div>
    <button onClick={() => { setShowMobileMenu(false); scrollToContact(); }} className="flex items-center text-yellow-400 hover:text-yellow-300">
      <Phone className="w-4 h-4 mr-2" /> Contact Us
    </button>
    <button onClick={() => { setShowMobileMenu(false); setShowProfileModal(true); }} className="flex items-center text-yellow-400 hover:text-yellow-300">
      <User className="w-4 h-4 mr-2" /> Profile
    </button>
    <button onClick={() => { setShowMobileMenu(false); handleLogout(); }} className="flex items-center text-red-400 hover:text-red-300">
      <span className="mr-2">🚪</span> Logout
    </button>
  </div>
)}




      {/* Main Content */}
      <main className="pt-20 md:pt-24 pb-24 px-0 w-full bg-[#0B1622]">
        {children}

        {!hideFooter && (
          <footer className="text-center text-gray-500 text-xs py-4 flex flex-col items-center space-y-2">
            <p className="text-yellow-400 font-semibold">Follow us</p>
            <div className="flex space-x-4">
              <a href="https://x.com/your_handle" target="_blank" rel="noopener noreferrer" className="hover:text-yellow-400">X</a>
              <a href="https://facebook.com/your_page" target="_blank" rel="noopener noreferrer" className="hover:text-yellow-400">Facebook</a>
              <a href="https://t.me/your_channel" target="_blank" rel="noopener noreferrer" className="hover:text-yellow-400">Telegram</a>
              <a href="https://discord.gg/your_server" target="_blank" rel="noopener noreferrer" className="hover:text-yellow-400">Discord</a>
            </div>
            <p>© {new Date().getFullYear()} FlySky Network. All rights reserved.</p>
          </footer>
        )}
      </main>

      {/* Bottom Navigation - Mobile */}
      {!hideFooter && (
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-gray-900 border-t border-gray-800 flex justify-around items-center py-2 md:hidden">
          <Link to="/dashboard" className="flex flex-col items-center text-yellow-400 hover:text-yellow-300 text-xs">
            <Home size={20} className="mb-1" />
            Home
          </Link>
          <Link to="/mining" className="flex flex-col items-center text-yellow-400 hover:text-yellow-300 text-xs">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mb-1 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6l4 2" />
            </svg>
            Mining
          </Link>
          <Link to="/wallet" className="flex flex-col items-center text-yellow-400 hover:text-yellow-300 text-xs">
            <Wallet size={20} className="mb-1" />
            Wallet
          </Link>
          <Link to="/inbox" className="relative flex flex-col items-center text-yellow-400 hover:text-yellow-300 text-xs">
            <Mail size={20} className="mb-1" />
            Inbox
            {hasUnreadMessages && (
              <span className="absolute top-0 right-3 w-2 h-2 bg-red-500 rounded-full"></span>
            )}
          </Link>
          <button
            onClick={() => setShowProfileModal(true)}
            className="flex flex-col items-center text-yellow-400 hover:text-yellow-300 text-xs"
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" className="w-6 h-6 rounded-full mb-1 object-cover" />
            ) : (
              <User size={20} className="mb-1" />
            )}
            Profile
          </button>
        </nav>
      )}

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