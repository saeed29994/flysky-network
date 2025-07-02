import { useEffect, useRef, useState } from 'react';
import { useUserPlan } from '../contexts/UserPlanContext';
import { Link } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { requestPermissionAndToken } from '../utils/pushNotification';
import { auth, db } from '../firebase';
import { useTranslation } from 'react-i18next';

import banner5 from '../assets/banner5.jpg';
import playToEarnBanner from '../assets/playtoearn.jpg';
import referralProgramBanner from '../assets/Referral_Program.jpg';

interface Plan {
  id: string;
  name: string;
  price: number;
  features: string[];
}

const Dashboard = () => {
  const { t } = useTranslation();
  const formRef = useRef<HTMLFormElement>(null);
  useUserPlan();
  const [plans, setPlans] = useState<Plan[]>([]);

  useEffect(() => {
    const user = auth.currentUser;
    if (user?.uid) {
      requestPermissionAndToken(user.uid).catch(console.error);
    }

    const fetchPlans = async () => {
      const snapshot = await getDocs(collection(db, 'plans'));
      const fetchedPlans: Plan[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Plan[];
      setPlans(fetchedPlans.filter(p => p.id !== 'economy'));
    };
    fetchPlans();
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
      {/* Mining Section */}
      <section className="w-full bg-[#0D1B2A] text-white py-16 px-4">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div className="flex justify-center md:justify-start">
            <img
              src={banner5}
              alt="Daily Mining"
              className="w-full max-w-md rounded-2xl shadow-lg border border-yellow-500"
            />
          </div>
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-yellow-400 mb-4">
              {t('dashboard.miningTitle')}
            </h2>
            <p className="text-base md:text-lg text-gray-300 mb-6 leading-relaxed">
              {t('dashboard.miningDesc')}
            </p>
            <div className="bg-[#1B263B] p-6 rounded-xl shadow-inner">
              <ul className="text-sm md:text-base text-gray-200 space-y-2">
                <li>{t('plans.economy')} 600 FSN / 12h</li>
                <li>{t('plans.business')} 3000 FSN / 12h</li>
                <li>{t('plans.first')} 6000 FSN / 12h</li>
              </ul>
            </div>
            <div className="mt-8">
              <a
                href="/mining"
                className="inline-block w-full sm:w-auto bg-yellow-400 hover:bg-yellow-300 text-black font-bold py-3 px-6 rounded-lg transition-all text-center shadow-lg"
              >
                {t('dashboard.startMining')}
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Membership Plans */}
      <section className="w-full bg-white text-black py-16 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-8 text-gray-800">{t('dashboard.membershipTitle')}</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
            {plans.slice(0, 3).map((plan) => {
              let bonus = 0;
              let bgColor = 'bg-white text-black';

              if (plan.id === 'business') {
                bonus = 100000;
                bgColor = 'bg-green-900 text-white';
              } else if (plan.id === 'first') {
                bonus = 500000;
                bgColor = 'bg-blue-900 text-white';
              } else if (plan.id === 'first-lifetime') {
                bonus = 1000000;
                bgColor = 'bg-purple-900 text-white';
              }

              return (
                <div
                  key={plan.id}
                  className={`border border-gray-300 rounded-xl p-6 shadow-md ${bgColor}`}
                >
                  <h3 className="text-xl font-bold mb-2">{t(`planNames.${plan.id}`)}</h3>
                  <p className="text-sm mb-1">💰 {plan.price} BUSD</p>
                  <p className="text-sm mb-4">
                    🎁 {t('dashboard.bonus')} <span className="text-yellow-300 font-bold">{bonus.toLocaleString()} FSN</span>
                  </p>
                  <ul className="text-sm space-y-1 mb-4 text-left">
                    {plan.features.slice(0, 3).map((feature, idx) => (
                      <li key={idx}>✔️ {t(`planFeatures.${feature}`)}</li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
          <div className="mt-8">
            <Link
              to="/membership"
              className="inline-block bg-yellow-400 hover:bg-yellow-300 text-black font-bold py-3 px-6 rounded-lg transition-all shadow-md"
            >
              {t('dashboard.viewMembership')}
            </Link>
          </div>
        </div>
      </section>

      {/* Referral */}
      <section className="w-full bg-gray-100 py-16 px-4">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div>
            <img
              src={referralProgramBanner}
              alt="Referral Program"
              className="w-full max-w-md mx-auto rounded-2xl shadow-lg"
            />
          </div>
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
              {t('dashboard.referralTitle')}
            </h2>
            <p className="text-lg text-gray-600 mb-4">
              {t('dashboard.referralDesc')}
            </p>
            <a
              href="/referral"
              className="inline-block bg-yellow-400 hover:bg-yellow-300 text-black font-bold py-3 px-6 rounded-lg transition-all text-center shadow-md"
            >
              {t('dashboard.viewReferral')}
            </a>
          </div>
        </div>
      </section>

      {/* Play to Earn */}
      <section className="w-full bg-[#0D1B2A] text-white py-16 px-4">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div className="order-2 md:order-1">
            <h2 className="text-3xl md:text-4xl font-bold text-yellow-400 mb-4">
              {t('dashboard.playTitle')}
            </h2>
            <p className="text-base md:text-lg text-gray-300 mb-6">
              {t('dashboard.playDesc')}
            </p>
            <a
              href="/playtoearn"
              className="inline-block bg-yellow-400 hover:bg-yellow-300 text-black font-bold py-3 px-6 rounded-lg transition-all text-center shadow-md"
            >
              {t('dashboard.playButton')}
            </a>
          </div>
          <div className="order-1 md:order-2 flex justify-center">
            <img
              src={playToEarnBanner}
              alt="Play to Earn"
              className="w-full max-w-md rounded-2xl shadow-lg"
            />
          </div>
        </div>
      </section>

      {/* About Us */}
      <section className="w-full bg-white py-16 px-4 text-center">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">{t('dashboard.aboutTitle')}</h2>
          <p className="text-gray-600 text-lg mb-6">{t('dashboard.aboutDesc')}</p>
          <Link
            to="/about"
            className="inline-block bg-yellow-400 hover:bg-yellow-300 text-black font-bold py-3 px-6 rounded-lg transition-all shadow-md"
          >
            {t('dashboard.aboutButton')}
          </Link>
        </div>
      </section>

      {/* Staking */}
      <section className="w-full bg-gray-100 py-16 px-4 text-center">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">
            {t('dashboard.stakingTitle')}
          </h2>
          <p className="text-gray-700 mb-6 text-lg">
            {t('dashboard.stakingDesc')}
          </p>
          <a
            href="/staking"
            className="bg-yellow-400 hover:bg-yellow-300 text-black font-bold py-3 px-6 rounded-lg transition-all shadow-md"
          >
            {t('dashboard.stakingButton')}
          </a>
        </div>
      </section>

      {/* Contact */}
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
    </>
  );
};

export default Dashboard;
