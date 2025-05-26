import { useRef } from 'react';
import { useUserPlan } from '../contexts/UserPlanContext';
import MembershipPage from './MembershipPage'; // عرض كامل لخطط العضوية
import banner5 from '../assets/banner5.jpg';
import playToEarnBanner from '../assets/playtoearn.jpg';
import referralProgramBanner from '../assets/Referral_Program.jpg';

const Dashboard = () => {
  const formRef = useRef<HTMLFormElement>(null);
  const { loading } = useUserPlan();

  const sendEmail = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formRef.current) return;

    const formData = new FormData(formRef.current);
    const name = formData.get('user_name');
    const email = formData.get('user_email');
    const message = formData.get('message');

    if (name && email && message) {
      alert('Thanks for contacting us! We will get back to you soon.');
      formRef.current.reset();
    } else {
      alert('Please fill out all fields.');
    }
  };

  return (
    <>
      {/* القسم الأول: التعدين */}
      <section id="mining" className="w-full bg-[#0D1B2A] text-white py-16 px-4">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div className="flex justify-center md:justify-start">
            <img src={banner5} alt="Daily Mining" className="w-full max-w-md rounded-2xl shadow-lg border border-yellow-500" />
          </div>
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-yellow-400 mb-4">Daily Mining Overview</h2>
            <p className="text-base md:text-lg text-gray-300 mb-6 leading-relaxed">
              Earn daily FSN tokens based on your membership level. Upgrade to unlock higher rewards and exclusive benefits.
            </p>
            <div className="bg-[#1B263B] p-6 rounded-xl shadow-inner">
              <ul className="text-sm md:text-base text-gray-200 space-y-2">
                <li>⚫ <strong>Economy Class:</strong> 600 FSN / 12 hour</li>
                <li>🔵 <strong>Business Class:</strong> 3000 FSN / 12 hour</li>
                <li>🟡 <strong>First Class:</strong> 6000 FSN / 12 hour</li>
              </ul>
            </div>
            <div className="mt-8">
              <a href="/mining" className="inline-block w-full sm:w-auto bg-yellow-400 hover:bg-yellow-300 text-black font-bold py-3 px-6 rounded-lg transition-all text-center shadow-lg">
                Start Mining Now
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* خطط العضوية */}
      <section className="w-full bg-white text-black py-16 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-8 text-gray-800">Membership Plans</h2>
          {!loading ? <MembershipPage /> : <p>Loading membership data...</p>}
        </div>
      </section>

      {/* الإحالة */}
      <section className="w-full bg-gray-100 py-16 px-4">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div>
            <img src={referralProgramBanner} alt="Referral Program" className="w-full max-w-md mx-auto rounded-2xl shadow-lg" />
          </div>
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">Invite & Earn</h2>
            <p className="text-lg text-gray-600 mb-4">Share your referral link and earn rewards when your friends join FlySky Network.</p>
            <a href="/referral" className="inline-block bg-yellow-400 hover:bg-yellow-300 text-black font-bold py-3 px-6 rounded-lg transition-all text-center shadow-md">
              View Referral Program
            </a>
          </div>
        </div>
      </section>

      {/* الألعاب */}
      <section className="w-full bg-[#0D1B2A] text-white py-16 px-4">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div className="order-2 md:order-1">
            <h2 className="text-3xl md:text-4xl font-bold text-yellow-400 mb-4">Play to Earn</h2>
            <p className="text-base md:text-lg text-gray-300 mb-6">Coming soon: Fun and engaging mini-games that let you earn more FSN!</p>
            <a href="/playtoearn" className="inline-block bg-yellow-400 hover:bg-yellow-300 text-black font-bold py-3 px-6 rounded-lg transition-all text-center shadow-md">
              Explore Play to Earn
            </a>
          </div>
          <div className="order-1 md:order-2 flex justify-center">
            <img src={playToEarnBanner} alt="Play to Earn" className="w-full max-w-md rounded-2xl shadow-lg" />
          </div>
        </div>
      </section>

      {/* نبذة */}
      <section className="w-full bg-white py-16 px-4 text-center">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">About Us</h2>
          <p className="text-gray-600 text-lg">
            FlySky Network is a next-generation digital economy platform combining mining, staking, gaming, and NFTs into one seamless experience.
          </p>
        </div>
      </section>

      {/* الستايكنج */}
      <section className="w-full bg-gray-100 py-16 px-4 text-center">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">Staking Opportunities</h2>
          <p className="text-gray-700 mb-6 text-lg">Stake your FSN tokens and earn passive income with flexible plans and high returns.</p>
          <a href="/staking" className="bg-yellow-400 hover:bg-yellow-300 text-black font-bold py-3 px-6 rounded-lg transition-all shadow-md">
            Visit Staking Page
          </a>
        </div>
      </section>

      {/* التواصل */}
      <section id="contact" className="w-full bg-[#0D1B2A] text-white py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-yellow-400 mb-6 text-center">Contact Us</h2>
          <p className="text-center text-gray-300 mb-8">
            Have questions? Reach out to our team and we'll get back to you shortly.
          </p>
          <form ref={formRef} onSubmit={sendEmail} className="space-y-4">
            <input type="text" name="user_name" placeholder="Your Name" className="w-full p-3 rounded-lg bg-gray-800 text-white placeholder-gray-400" required />
            <input type="email" name="user_email" placeholder="Your Email" className="w-full p-3 rounded-lg bg-gray-800 text-white placeholder-gray-400" required />
            <textarea name="message" placeholder="Your Message" rows={5} className="w-full p-3 rounded-lg bg-gray-800 text-white placeholder-gray-400" required />
            <button type="submit" className="bg-yellow-400 hover:bg-yellow-300 text-black font-bold py-3 px-6 rounded-lg transition-all">
              Send Message
            </button>
          </form>
        </div>
      </section>
    </>
  );
};

export default Dashboard;
