// 📁 src/pages/Dashboard.tsx
import { useEffect, useRef, useState } from 'react';
import { useUserPlan } from '../contexts/UserPlanContext';
import { Link } from 'react-router-dom';
import { requestPermissionAndToken } from '../utils/pushNotification';
import { auth } from '../firebase';
import { useTranslation } from 'react-i18next';
import {
  FaGem, FaRocket, FaShareAlt, FaGamepad, FaInfoCircle, FaCoins,
  FaVideo, FaWallet, FaEnvelope, FaCogs, FaIdCard, FaPhoneAlt
} from 'react-icons/fa';
import logo from '../assets/fsn-logo.png';

// (تمت إزالة interface Plan)

const Dashboard = () => {
  const { t } = useTranslation();
  const formRef = useRef<HTMLFormElement>(null);
  useUserPlan();
  const [showContactForm, setShowContactForm] = useState(false);

  useEffect(() => {
    const user = auth.currentUser;
    if (user?.uid) {
      requestPermissionAndToken(user.uid).catch(console.error);
    }
  }, []);

  const sendEmail = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formRef.current) return;

    const formData = new FormData(formRef.current);
    const name = formData.get('user_name');
    const email = formData.get('user_email');
    const message = formData.get('message');

    if (name && email && message) {
      alert(t('contact.thankYou'));
      formRef.current.reset();
    } else {
      alert(t('contact.fillAllFields'));
    }
  };

  return (
    <>
      {/* Hero Banner */}
      <section className="w-full bg-gradient-to-br from-[#1B263B] via-[#0D1B2A] to-black text-white py-12 px-4 text-center relative overflow-hidden">
        <div className="max-w-4xl mx-auto flex flex-col items-center justify-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">{t('dashboard.bannerTitle', 'Welcome to FlySky Network')}</h1>
          <p className="text-sm md:text-base font-medium mb-4">{t('dashboard.bannerSubtitle', 'Explore. Earn. Grow.')}</p>
          <img
            src={logo}
            alt="FlySky Logo"
            className="w-20 h-20 animate-spin-slow"
          />
        </div>
      </section>

      {/* Dashboard Icon Grid */}
      <section className="w-full bg-[#0D1B2A] text-white py-16 px-6">
        <div className="max-w-4xl mx-auto grid grid-cols-3 gap-6 sm:grid-cols-4 md:grid-cols-6 text-center">
          {[{
            to: '/mining', icon: <FaGem />, label: t('dashboard.miningTitle')
          }, {
            to: '/membership', icon: <FaRocket />, label: t('dashboard.membershipTitle')
          }, {
            to: '/referral', icon: <FaShareAlt />, label: t('dashboard.referralTitle')
          }, {
            to: '/playtoearn', icon: <FaGamepad />, label: t('dashboard.playTitle')
          }, {
            to: '/watch-to-earn', icon: <FaVideo />, label: t('menu.watch')
          }, {
            to: '/wallet', icon: <FaWallet />, label: t('menu.wallet')
          }, {
            to: '/inbox', icon: <FaEnvelope />, label: t('menu.inbox')
          }, {
            to: '/about', icon: <FaInfoCircle />, label: t('dashboard.aboutTitle')
          }, {
            to: '/staking', icon: <FaCoins />, label: t('dashboard.stakingTitle')
          }, {
            to: '/settings', icon: <FaCogs />, label: t('menu.settings')
          }, {
            to: '/kyc', icon: <FaIdCard />, label: t('menu.kyc')
          }].map(({ to, icon, label }, i) => (
            <Link key={i} to={to} className="bg-[#1B263B] p-4 rounded-xl shadow hover:animate-ping-once">
              <div className="text-yellow-400 text-xl mb-2">{icon}</div>
              <span className="text-sm">{label}</span>
            </Link>
          ))}
          <button onClick={() => setShowContactForm(!showContactForm)} className="bg-[#1B263B] p-4 rounded-xl shadow hover:animate-ping-once">
            <FaPhoneAlt className="mx-auto mb-2 text-yellow-400" size={28} />
            <span className="text-sm">{t('menu.contact')}</span>
          </button>
        </div>
      </section>

      {showContactForm && (
        <section id="contact" className="w-full bg-[#0D1B2A] text-white py-16 px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-yellow-400 mb-6 text-center">
              {t('contact.title')}
            </h2>
            <p className="text-center text-gray-300 mb-8">{t('contact.description')}</p>
            <form ref={formRef} onSubmit={sendEmail} className="space-y-4">
              <input
                type="text"
                name="user_name"
                placeholder={t('contact.name')}
                className="w-full p-3 rounded-lg bg-gray-800 text-white placeholder-gray-400"
                required
              />
              <input
                type="email"
                name="user_email"
                placeholder={t('contact.email')}
                className="w-full p-3 rounded-lg bg-gray-800 text-white placeholder-gray-400"
                required
              />
              <textarea
                name="message"
                placeholder={t('contact.message')}
                rows={5}
                className="w-full p-3 rounded-lg bg-gray-800 text-white placeholder-gray-400"
                required
              />
              <button
                type="submit"
                className="bg-yellow-400 hover:bg-yellow-300 text-black font-bold py-3 px-6 rounded-lg transition-all"
              >
                {t('contact.send')}
              </button>
            </form>
          </div>
        </section>
      )}
    </>
  );
};

export default Dashboard;
