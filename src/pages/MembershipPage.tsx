import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useUserPlan } from '../contexts/UserPlanContext';
import SubscribeModal from '../components/SubscribeModal';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

interface Plan {
  id: string;
  name: string;
  price: number;
  features: string[];
}

const MembershipPage = () => {
  const { t } = useTranslation();
  const { currentPlan, subscriptionEnd } = useUserPlan();
  const [modalPlan, setModalPlan] = useState<null | { index: number; price: string }>(null);
  const [selectedCurrency, setSelectedCurrency] = useState('usdt-bep20');
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [txLink, setTxLink] = useState('');
  const [fromAddress, setFromAddress] = useState('');
  const now = Math.floor(Date.now() / 1000);
  const isExpired = subscriptionEnd ? subscriptionEnd < now : true;

  const plans: Plan[] = [
    {
      id: 'business',
      name: 'plan.business',
      price: 10,
      features: ['advancedMining', 'prioritySupport', 'stakingAccess', 'fasterMining'],
    },
    {
      id: 'first',
      name: 'plan.first',
      price: 49,
      features: ['allBusinessFeatures', 'fasterMining', 'eventAccess', 'prioritySupport', 'highestMining', 'premiumAccess'],
    },
    {
      id: 'first-lifetime',
      name: 'plan.first-lifetime',
      price: 99,
      features: ['highestMining', 'lifetimeAccess', 'premiumAccess', 'prioritySupport', 'unlockedForever', 'lifetimePerks', 'eventAccess'],
    },
  ];

  const handleProofUpload = async () => {
    if (!proofFile || !txLink || !fromAddress) {
      toast.error('❌ ' + t('fillAllFields'));
      return;
    }

    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) {
      toast.error('❌ ' + t('notAuthenticated'));
      return;
    }

    try {
      setUploading(true);
      const storageRef = ref(storage, `manualPayments/${user.uid}/${Date.now()}-${proofFile.name}`);
      await uploadBytes(storageRef, proofFile);
      const downloadURL = await getDownloadURL(storageRef);

      await addDoc(collection(db, 'manualPayments'), {
        uid: user.uid,
        currency: selectedCurrency,
        proofUrl: downloadURL,
        fileName: proofFile.name,
        txLink,
        fromAddress,
        timestamp: serverTimestamp(),
        status: 'pending',
      });

      toast.success('✅ ' + t('success.stakeCreated'));
      setProofFile(null);
      setTxLink('');
      setFromAddress('');
    } catch (err) {
      console.error('❌ Upload failed:', err);
      toast.error('❌ ' + t('stakingSection.error.stakeFailed'));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto text-white px-4 py-12">
      <h1 className="text-3xl font-bold mb-8 text-center">{t('membershipPage.title')}</h1>

      <p className="text-center mb-2">
        {t('membershipPage.currentPlan')}: <span className="font-semibold capitalize">{currentPlan || t('membershipPage.notSubscribed')}</span>
      </p>

      {subscriptionEnd && (
        <p className="text-center mb-8 text-sm text-gray-300">
          {isExpired ? t('membershipPage.expiredOn') : t('membershipPage.expiresOn')}: {new Date(subscriptionEnd * 1000).toLocaleDateString()}
        </p>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {plans.map((plan, index) => {
          const isActive = plan.id === currentPlan && !isExpired;
          let bonus = 0;
          let bgColor = 'bg-[#1B263B]';

          if (plan.id === 'business') {
            bonus = 100000;
            bgColor = 'bg-green-900';
          } else if (plan.id === 'first') {
            bonus = 500000;
            bgColor = 'bg-blue-900';
          } else if (plan.id === 'first-lifetime') {
            bonus = 1000000;
            bgColor = 'bg-purple-900';
          }

          return (
            <div
              key={plan.id}
              className={`border rounded-xl p-6 shadow-md transition-all 
              ${isActive ? 'border-yellow-400 bg-yellow-100 text-black' : `${bgColor} text-white`}`}
            >
              <h2 className="text-xl font-bold mb-2">{t(plan.name)}</h2>
              <p className="mb-1 text-lg">{plan.price} BUSD</p>
              <p className="mb-1 text-sm font-semibold">
                {t('membershipPage.bonus')}: <span className="text-yellow-400 font-bold">{bonus.toLocaleString()} FSN</span>
              </p>
              <ul className="mb-6 text-sm space-y-1 text-left">
                {plan.features.map((feature, i) => (
                  <li key={i}>✔️ {t(`feature.${feature}`)}</li>
                ))}
              </ul>
              {isActive ? (
                <button className="w-full bg-green-500 text-white font-bold py-2 rounded" disabled>{t('membershipPage.activated')}</button>
              ) : (
                <button
                  className="w-full bg-yellow-400 hover:bg-yellow-300 text-black font-bold py-2 rounded"
                  onClick={() => setModalPlan({ index, price: String(plan.price) })}
                >
                  {plan.id === currentPlan && isExpired ? t('membershipPage.renew') : t('membershipPage.subscribe')}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {modalPlan && (
        <SubscribeModal planId={String(modalPlan.index)} price={modalPlan.price} onClose={() => setModalPlan(null)} />
      )}

      {/* 👇 قسم الدفع اليدوي */}
      <div className="mt-20 border-t border-gray-700 pt-10 px-4 sm:px-6 lg:px-8 w-full max-w-full">
        <h2 className="text-2xl font-bold text-yellow-400 text-center mb-6">{t('membershipPage.manualPaymentTitle')}</h2>

        <div className="bg-yellow-100 text-black text-sm p-4 rounded mb-6 max-w-2xl w-full mx-auto">
          <p className="mb-2 font-semibold">{t('membershipPage.instructions.title')}</p>
          <ul className="list-disc list-inside space-y-1">
            <li>{t('membershipPage.instructions.step1')}</li>
            <li>{t('membershipPage.instructions.step2')}</li>
            <li>{t('membershipPage.instructions.step3')}</li>
            <li className="text-red-600">{t('membershipPage.instructions.step4')}</li>
            <li className="text-green-600">{t('membershipPage.instructions.step5')}</li>
          </ul>
        </div>

        <div className="w-full max-w-md mx-auto mb-6 px-2">
          <label className="block text-sm font-medium text-white mb-2">{t('membershipPage.selectCurrency')}</label>
          <select
            className="w-full p-2 rounded bg-gray-800 text-white border border-gray-600"
            onChange={(e) => setSelectedCurrency(e.target.value)}
            value={selectedCurrency}
          >
            <option value="usdt-bep20">USDT (BEP-20)</option>
            <option value="busd">BUSD (BEP-20)</option>
            <option value="usdc">USDC (BEP-20)</option>
            <option value="bnb">BNB (BEP-20)</option>
            <option value="usdt-trc20">USDT (TRC-20)</option>
          </select>
        </div>

        <div className="text-center mb-6 px-2">
          <p className="text-sm text-gray-400 mb-1">{t('membershipPage.sendTo')}</p>
          <div className="bg-gray-800 text-yellow-300 px-4 py-2 rounded inline-block font-mono break-all">
            {selectedCurrency === 'usdt-trc20'
              ? 'TDwudwKdrHTQKsLoLABavJ9VQrX5nYVYM7'
              : '0x9E8550d26e6e2Ce3e5c4f8244B3E4504E24F2915'}
          </div>
        </div>

        <div className="w-full max-w-md mx-auto space-y-4 px-2">
          <div>
            <label className="block text-sm text-white font-medium mb-1">{t('membershipPage.transactionLink')}</label>
            <input
              type="text"
              value={txLink}
              onChange={(e) => setTxLink(e.target.value)}
              placeholder="https://bscscan.com/tx/..."
              className="w-full p-2 rounded bg-gray-800 text-white border border-gray-600"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-white font-medium mb-1">{t('membershipPage.fromAddress')}</label>
            <input
              type="text"
              value={fromAddress}
              onChange={(e) => setFromAddress(e.target.value)}
              placeholder="0x..."
              className="w-full p-2 rounded bg-gray-800 text-white border border-gray-600"
              required
            />
          </div>

          <div>
            <label className="block mb-2 text-sm text-white font-medium">{t('membershipPage.uploadProof')}</label>
            <input
              type="file"
              accept="image/*"
              className="bg-gray-800 text-white rounded p-2 w-full"
              onChange={(e) => setProofFile(e.target.files?.[0] || null)}
              required
            />
          </div>

          <div className="text-center">
            <button
              className={`bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-6 rounded mt-4 ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={handleProofUpload}
              disabled={uploading || !txLink || !fromAddress || !proofFile}
            >
              {uploading ? t('membershipPage.uploading') : t('membershipPage.submitProof')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MembershipPage;
